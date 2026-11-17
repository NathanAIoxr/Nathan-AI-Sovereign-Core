#!/usr/bin/env python3
"""Assign five existing specialist bees to bounded public build-metadata work."""
import argparse,json,sqlite3,sys
from pathlib import Path
HERE=Path(__file__).resolve().parent
REPO=HERE.parents[2]
HIVE=REPO/'app-factory/nathan-ai/personal-intelligence/minds/federation/hive-swarm'
sys.path.insert(0,str(HIVE))
import specialist_bees as bees

def main():
 parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--db',type=Path,required=True);parser.add_argument('--out',type=Path,required=True);parser.add_argument('--owner-authorized',action='store_true');args=parser.parse_args()
 if not args.owner_authorized:parser.error('Explicit authorization for these five metadata jobs is required')
 catalog=json.loads((HERE/'public/apps.json').read_text());payload=json.dumps({'mission':'ONE Cloudflare shared foundation metadata audit','catalog_entries':catalog['count'],'contracts':['half-open ranges','signed owners and agents','idempotent sync','bounded recovery'],'scope':'public metadata only; no deployment, private data or external messaging'},sort_keys=True)
 args.db.parent.mkdir(parents=True,exist_ok=True)
 with sqlite3.connect(args.db) as db:
  bees.init(db);bees.seed(db,owner_yes=True);outcomes=[]
  for handler in ('source_scout','source_verifier','boundary_sentinel','error_resolver','audit_librarian'):
   row=db.execute('SELECT a.bee_id,a.role_id FROM specialist_assignments a JOIN specialist_roles r ON a.role_id=r.role_id WHERE r.handler=?',(handler,)).fetchone()
   task=bees.propose(db,row[0],payload);bees.approve(db,row[0],task['task_id'],owner_yes=True);outcomes.append(bees.execute(db,row[0],task['task_id']))
 result={'scope':'five existing deterministic bee handlers on public build metadata','executed':len(outcomes),'states':[row['state'] for row in outcomes],'results':outcomes,'independent_model_instances':0}
 args.out.parent.mkdir(parents=True,exist_ok=True);args.out.write_text(json.dumps(result,indent=2)+'\n');print('Completed existing bee metadata tasks:',result['executed'])
if __name__=='__main__':main()
