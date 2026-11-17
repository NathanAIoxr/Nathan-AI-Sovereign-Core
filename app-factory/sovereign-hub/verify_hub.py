#!/usr/bin/env python3
"""Run integrated local acceptance and save bounded, inspectable evidence."""
import argparse
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import re
import subprocess
import sys


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--out',type=Path,required=True)
    args=parser.parse_args()
    here=Path(__file__).resolve().parent
    repo=here.parents[1]
    boundary=repo/'app-factory/nathan-ai/personal-intelligence/minds/federation/fencepost-error-syndrome'
    args.out.parent.mkdir(parents=True,exist_ok=True)
    boundary_report=args.out.with_name(args.out.stem+'-boundaries.json')
    commands=[
      [sys.executable,str(boundary/'verify_boundaries.py'),'--out',str(boundary_report)],
      [sys.executable,'-m','unittest','discover','-s',str(here),'-p','test_hub.py','-v'],
      ['node','--test',str(repo/'app-factory/app-shell/server.test.cjs')],
      ['node','--check',str(here/'app.js')],
      ['node','--check',str(here/'service-worker.js')]
    ]
    results=[]
    for command in commands:
        try:
            process=subprocess.run(command,cwd=repo,capture_output=True,text=True,timeout=120)
            result={'command':command,'passed':process.returncode==0,'exit_code':process.returncode,'output':process.stdout+process.stderr}
        except (OSError,subprocess.TimeoutExpired) as exc:
            result={'command':command,'passed':False,'output':str(exc)}
        results.append(result)
        print(('PASS ' if result['passed'] else 'FAIL ')+' '.join(command),flush=True)
    baseline=json.loads(boundary_report.read_text()) if boundary_report.exists() else {'passed':False,'python_tests':0}
    report={'generated_at':datetime.now(timezone.utc).isoformat(),'passed':all(item['passed'] for item in results) and baseline['passed'],
       'scope':'local sovereign hub, existing boundary library and App Shell registration',
       'python_tests':baseline['python_tests']+sum(int(match.group(1)) for result in results[1:] for match in re.finditer(r'Ran (\d+) tests?',result['output'])),
       'results':results,'boundary_report':boundary_report.name,
       'source_sha256':{path.name:hashlib.sha256(path.read_bytes()).hexdigest() for path in sorted(here.iterdir()) if path.is_file() and not path.name.startswith('.')},
       'deployment':'local source only; no remote service or hardware deployment',
       'provider_status':'external accounts, model weights, camera/human issuers, native packaging and live payment providers require configuration',
       'browser':'separate browser_acceptance.py; not inferred from unit tests'}
    args.out.write_text(json.dumps(report,indent=2)+'\n')
    if not report['passed']:
        for result in results:
            if not result['passed']:print(result['output'])
        raise SystemExit(1)
    print(f"Verified {report['python_tests']} Python tests, plus Node regressions and syntax checks")


if __name__=='__main__':main()
