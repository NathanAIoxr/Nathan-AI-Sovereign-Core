#!/usr/bin/env python3
"""Discover public software repositories (not live servers) for a global tech catalog.

Examples:
  python global_discovery.py --pages 1
  GITHUB_TOKEN=... python global_discovery.py --all-languages --multilingual --pages 2

Read-only: GitHub public repository search API. Does not clone, run, deploy,
probe hosts, enumerate network ports, or touch any third-party infrastructure.
"""
from __future__ import annotations
import argparse
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import time
import urllib.error
import urllib.parse
import urllib.request

TOPICS = [
    'cloudflare-workers','workers-ai','ai-agent','ai-agents','agent-framework',
    'mcp-server','bot-framework','workflow-engine','n8n-nodes','webassembly',
    'kernel','operating-system','distributed-computing','kubernetes-operator',
    'ros2','multi-agent','llm-inference','job-scheduler',
    'serverless-framework','comfyui-nodes',
]
LANGUAGES = [
    'JavaScript','TypeScript','Python','Rust','Go','Java','Kotlin','C#','C','C++',
    'Swift','Ruby','PHP','Dart','Scala','Lua','Elixir','Erlang','R','Julia',
    'Zig','Haskell','OCaml','Shell','Solidity',
]
# Extra language strings broaden text discovery. They do not establish a project's country.
MULTILINGUAL = {
    'es':'agente IA', 'pt':'agente inteligência artificial', 'fr':'agent intelligent',
    'de':'KI agent', 'it':'agente intelligenza artificiale', 'ja':'AIエージェント',
    'ko':'AI 에이전트', 'zh':'智能体', 'ar':'وكيل ذكاء اصطناعي',
    'hi':'एआई एजेंट', 'ru':'ИИ агент', 'tr':'yapay zeka ajan',
    'id':'agen AI', 'vi':'tác nhân AI',
}


def queries(args):
    for t in TOPICS:
        yield f'topic:{t} archived:false', f'topic:{t}'
    if args.all_languages:
        for language in LANGUAGES:
            # GitHub search's language: qualifier filters source language, not human language.
            yield f'agent in:name,description language:"{language}" archived:false', f'language:{language}'
    if args.multilingual:
        for lang, keyword in MULTILINGUAL.items():
            yield f'"{keyword}" in:name,description archived:false', f'text:{lang}'


def get_json(url: str, token: str | None) -> dict:
    headers = {
        'Accept':'application/vnd.github+json',
        'User-Agent':'NathanAI-global-public-repository-catalog/1.0',
        'X-GitHub-Api-Version':'2022-11-28',
    }
    if token:
        headers['Authorization'] = f'Bearer {token}'
    with urllib.request.urlopen(urllib.request.Request(url, headers=headers),timeout=30) as response:
        return json.load(response)


def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--pages', type=int, default=1, help='1 to 10 pages/query, 100 repos/page')
    p.add_argument('--all-languages', action='store_true', help='Use 25 additional programming-language queries')
    p.add_argument('--multilingual', action='store_true', help='Use 14 human-language text queries')
    p.add_argument('--max-queries', type=int, default=20, help='Cap number of queries this run')
    p.add_argument('--offset', type=int, default=0, help='Rotate over topic, source-language, and human-language queries')
    p.add_argument('--pause', type=float, default=1.0, help='Seconds between public API calls')
    p.add_argument('--output', type=Path, default=Path('global_discovery_live.json'))
    args=p.parse_args()
    if not 1<=args.pages<=10: p.error('--pages must be 1..10')
    if args.max_queries < 1: p.error('--max-queries must be >=1')
    if args.offset < 0: p.error('--offset must be >=0')
    if args.pause < 0: p.error('--pause must be >=0')
    token=os.getenv('GITHUB_TOKEN')
    if not token:
        print('GITHUB_TOKEN not set: unauthenticated GitHub API limits apply. Set a token if rate-limited.')
    collected={}
    failures=[]
    all_queries=list(queries(args))
    planned=[all_queries[(args.offset+i)%len(all_queries)] for i in range(min(args.max_queries,len(all_queries)))]
    rate_limited = False
    for qidx,(query,source_tag) in enumerate(planned,1):
        for page in range(1,args.pages+1):
            params=urllib.parse.urlencode({'q':query,'per_page':100,'page':page,'sort':'updated','order':'desc'})
            endpoint='https://api.github.com/search/repositories?'+params
            try:
                payload=get_json(endpoint,token)
                items=payload.get('items',[])
                print(f'[{qidx}/{len(planned)}] {source_tag} page={page}: {len(items)} results')
                for x in items:
                    key=x['full_name'].lower()
                    if x.get('archived') or x.get('disabled') or x.get('private'): continue
                    if key not in collected:
                        collected[key]={
                            'repository':x['full_name'], 'url':x['html_url'],
                            'description':x.get('description'),
                            'primary_language':x.get('language'),
                            'license_spdx':(x.get('license') or {}).get('spdx_id'),
                            'stars':x.get('stargazers_count'), 'forks':x.get('forks_count'),
                            'last_push':x.get('pushed_at'),
                            'default_branch':x.get('default_branch'),
                            'topics':x.get('topics',[]),'matched_by':[],
                            'cloudflare_compatible':'not_checked',
                            'license_review':'required',
                            'security_review':'required',
                            'run_status':'not_checked',
                        }
                    if source_tag not in collected[key]['matched_by']:
                        collected[key]['matched_by'].append(source_tag)
                if not items or len(items)<100: break
            except urllib.error.HTTPError as exc:
                message=exc.read(500).decode('utf-8','replace')
                failures.append({'query':source_tag,'page':page,'status':exc.code,'error':message})
                print(f'API error {exc.code} on {source_tag} page {page}; continuing')
                if exc.code in (403,429):
                    print('GitHub request budget hit. Saving partial results; resume with a token or later.')
                    rate_limited = True
                    break
            except (urllib.error.URLError,TimeoutError, ValueError) as exc:
                failures.append({'query':source_tag,'page':page,'error':str(exc)})
                print(f'Connection/data error on {source_tag}: {exc}')
                break
            finally:
                time.sleep(args.pause)
        if rate_limited:
            break
    result={
        'as_of_utc':datetime.now(timezone.utc).isoformat(),
        'scope':'public GitHub repository metadata only',
        'comprehensive':False,
        'search_queries_attempted':[q for q,_ in planned],
        'unique_repository_count':len(collected),
        'entries':sorted(collected.values(),key=lambda x:(-(x.get('stars') or 0),x['repository'].lower())),
        'errors':failures,
    }
    args.output.parent.mkdir(parents=True,exist_ok=True)
    args.output.write_text(json.dumps(result,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
    print(f'Saved {len(collected)} repository entries to {args.output}')

if __name__=='__main__': main()