#!/usr/bin/env python3
"""Nathan AI 12-Line Guardian: read-only file integrity and heuristic inspection."""
import argparse, hashlib, json, os, pathlib, stat, time
SUSPICIOUS_SUFFIXES={'.exe','.dll','.ps1','.bat','.cmd','.vbs','.js','.sh'}
MAX_FILE=32*1024*1024
def inspect(root):
    root=pathlib.Path(root).resolve(strict=True)
    if not root.is_dir(): raise ValueError('scan root must be directory')
    out=[]
    for parent,dirs,files in os.walk(root,followlinks=False):
        dirs[:]=[d for d in dirs if not (pathlib.Path(parent)/d).is_symlink()]
        for name in files:
            p=pathlib.Path(parent)/name
            try:
                st=p.lstat()
                if not stat.S_ISREG(st.st_mode):continue
                checks={'01_path_containment':True,'02_regular_file':True,'03_size_limit':st.st_size<=MAX_FILE,'04_executable_extension':p.suffix.lower() in SUSPICIOUS_SUFFIXES,'05_world_writable':bool(st.st_mode & stat.S_IWOTH),'06_owner_executable':bool(st.st_mode & stat.S_IXUSR),'07_hidden_name':name.startswith('.'),'08_double_extension':len(p.suffixes)>1,'09_empty_file':st.st_size==0,'10_symlink':False,'11_content_hash':None,'12_content_readable':False}
                if st.st_size<=MAX_FILE:
                    h=hashlib.sha256()
                    with p.open('rb') as f:
                        for chunk in iter(lambda:f.read(1024*1024),b''):h.update(chunk)
                    checks['11_content_hash']=h.hexdigest()
                    checks['12_content_readable']=True
                flags=[k for k in ['04_executable_extension','05_world_writable','08_double_extension'] if checks[k]]
                out.append({'file':str(p.relative_to(root)),'size':st.st_size,'checks':checks,'flags':flags,'status':'review' if flags else 'observed'})
            except (OSError,ValueError) as exc:out.append({'file':str(p),'status':'error','error':type(exc).__name__})
    return {'engine':'Nathan AI 12-Line Security Guardian','mode':'read-only heuristic baseline','root':str(root),'generated_at':int(time.time()),'files':out,'notice':'Flags are not malware verdicts. No files were deleted, executed, or quarantined.'}
if __name__=='__main__':
    ap=argparse.ArgumentParser();ap.add_argument('directory');ap.add_argument('--output');args=ap.parse_args()
    report=json.dumps(inspect(args.directory),indent=2)
    if args.output:pathlib.Path(args.output).write_text(report,encoding='utf-8')
    else:print(report)
