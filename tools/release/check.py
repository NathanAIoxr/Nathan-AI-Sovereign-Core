#!/usr/bin/env python3
"""Run the repository's Node suites, Python suites and bounded runtime smoke checks."""
import argparse, json, os, pathlib, re, subprocess, tempfile

ROOT=pathlib.Path(__file__).resolve().parents[2]
def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--out',required=True,type=pathlib.Path);a=p.parse_args();out=a.out.resolve()
    if out.is_relative_to(ROOT):p.error('Keep release reports outside the source checkout.')
    out.mkdir(parents=True,exist_ok=True);results=[];env=os.environ.copy();env['PYTHONDONTWRITEBYTECODE']='1'
    def run(name,args,cwd=ROOT):
        try:
            r=subprocess.run(args,cwd=cwd,text=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,timeout=180,env=env)
            text=r.stdout;code=r.returncode
        except subprocess.TimeoutExpired as e:text='Timed out after 180 seconds';code=124
        matches=re.findall(r'(?:ℹ|#) tests (\d+)',text)
        result={'name':name,'passed':code==0,'exit_code':code,'reported_node_cases':int(matches[-1]) if matches else 0}
        results.append(result);(out/(str(len(results)).zfill(3)+'.log')).write_text(text)
        if code:print('FAILED '+name+'\n'+text[-3500:])
    node=sorted(p for p in (ROOT/'app-factory').rglob('*') if p.name.endswith(('.test.cjs','.test.mjs')))
    if not node:raise RuntimeError('No Node test suites discovered.')
    for path in node:run(str(path.relative_to(ROOT)),['node',str(path)])
    python_dirs=sorted({p.parent for folder in [ROOT/'app-factory',ROOT/'tools'] for p in folder.rglob('test_*.py')})
    for directory in python_dirs:run(str(directory.relative_to(ROOT))+' Python',['python3','-B','-m','unittest','discover','-s',str(directory),'-p','test_*.py'])
    scanner=ROOT/'app-factory/nathan-ai/eyeprints-handprints'
    if scanner.exists():
        for file in ['tests/crypto.mjs','tests/analysis.mjs']:run('hand-eye '+file,['node',file],scanner)
        run('hand-eye static privacy',['python3','-B','tests/static_check.py'],scanner)
    run('bounded activation',['node','app-factory/nathan-ai/activation/runtime-cli.mjs','--activate','--ticks=8'])
    run('historical mining vector',['node','app-factory/nathan-ai/sovereign-coins/phi-mining/cli.mjs','--run','--start=2083236891','--attempts=5'])
    commit=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip()
    report={'commit':commit,'node_files':len(node),'reported_node_cases':sum(r['reported_node_cases'] for r in results),'python_suites':len(python_dirs),'checks':len(results),'passed':all(r['passed'] for r in results),'results':results}
    (out/'checks.json').write_text(json.dumps(report,indent=2));print(json.dumps({k:v for k,v in report.items() if k!='results'},indent=2))
    raise SystemExit(0 if report['passed'] else 1)
if __name__=='__main__':main()
