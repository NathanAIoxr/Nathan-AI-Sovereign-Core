#!/usr/bin/env python3
"""Add a B/8 discovery crosswalk to an existing owner-local LCC-style archive.

Original source payloads, shelf IDs and classification values remain unchanged.
Only aggregate summaries in --summary-dir are intended for public GitHub.
"""
import argparse,collections,csv,hashlib,io,json,pathlib,zipfile

CAT='02_CATALOG_AND_UNFINISHED_WORK/MASTER_LOC_CATALOG_19317.csv'
PREFIX='04_B8_DISCOVERY_CROSS_REFERENCES/'
def csvrows(data):return list(csv.DictReader(io.StringIO(data.decode('utf-8-sig'))))
def csvbytes(rows,fields):
 s=io.StringIO(newline='');w=csv.DictWriter(s,fieldnames=fields);w.writeheader();w.writerows(rows);return ('\ufeff'+s.getvalue()).encode()
def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--catalog-zip',required=True);p.add_argument('--recovery-zip',required=True);p.add_argument('--output-zip',required=True);p.add_argument('--summary-dir',required=True);p.add_argument('--workbook-data',required=True);p.add_argument('--workbook',help='Optional already-reviewed updated owner worklist XLSX');a=p.parse_args()
 if pathlib.Path(a.output_zip).resolve() in (pathlib.Path(a.catalog_zip).resolve(),pathlib.Path(a.recovery_zip).resolve()):p.error('Output must be distinct from both originals')
 base=zipfile.ZipFile(a.catalog_zip);b8=zipfile.ZipFile(a.recovery_zip);catalog=csvrows(base.read(CAT));by={r['original_relative_path']:r for r in catalog};records=csvrows(b8.read('02_Individual_Record_Candidates.csv'));filehits=csvrows(b8.read('01_File_and_Folder_Candidates.csv'));pointers=csvrows(base.read('02_CATALOG_AND_UNFINISHED_WORK/LIBRARY_POINTERS_CLASSIFIED_SEPARATELY.csv'));pb={r['library_file_id']:r for r in pointers};missing=[];mapped=[];annot={}
 originalzip=zipfile.ZipFile(io.BytesIO(b8.read('MATCHED_ORIGINAL_RECORDS.zip')))
 for r in records:
  c=by.get(r['source_member'])
  if c is None:missing.append(r);continue
  data=originalzip.read(r['source_member']);actual=hashlib.sha256(data).hexdigest()
  if actual!=c['sha256']:raise ValueError('Recovery/catalog source hash mismatch: '+r['source_member'])
  mapped.append({'local_shelf_id':c['local_shelf_id'],'title':r['title'],'class':c['class'],'class_name':c['class_name'],'subclass':c['subclass'],'classification_confidence':c['classification_confidence'],'collection':c['collection'],'record_key':r['key'],'record_stage':r['record_stage'],'completion_status':c['completion_status'],'work_priority':c['work_priority'],'next_action':c['next_action'],'match_routes':r['classes'],'original_relative_path':r['source_member'],'new_relative_path':c['new_relative_path'],'sha256':c['sha256'],'byte_match':'VERIFIED_EXACT_BYTES'})
  annot[c['local_shelf_id']]=r['classes']
 if missing:raise ValueError(str(len(missing))+' recovery records have no catalog identity; stop before writing')
 pointerrows=[]
 for r in filehits:
  old=pb.get(r['library_file_id']);status='EXISTING_POINTER_MATCH' if old else ('FOLDER_NAVIGATION_ONLY' if r['kind']=='folder' else 'NEW_POINTER_PENDING_SUBJECT_REVIEW')
  pointerrows.append({**r,'pointer_match_status':status,'pointer_id':old['pointer_id'] if old else '', 'suggested_class':old['suggested_class'] if old else '', 'suggested_subclass':old['suggested_subclass'] if old else '', 'verification_status':old['verification_status'] if old else 'Metadata only; source bytes and subject not verified'})
 updated=[]
 for r in catalog:updated.append({**r,'b8_discovery_match':bool(annot.get(r['local_shelf_id'])),'b8_match_routes':annot.get(r['local_shelf_id'],'')})
 classes=csvrows(base.read('02_CATALOG_AND_UNFINISHED_WORK/CLASS_SHELF_COUNTS.csv'));counts=collections.Counter(r['class'] for r in mapped);statuses=collections.Counter(r['completion_status'] for r in mapped);direct=sum('B title start' in r['match_routes'] for r in mapped)
 tasks=[
  {'task_id':'B8-001','priority':'P2','collection':'B / 8 / Inversions','issue':'Review visual and cross-script candidate connections','done_when':'Each candidate retained, rejected or linked with the match reason preserved; no inferred shared etymology','actual_evidence':'5851 recovery record candidates; exact source bytes matched','status':'OPEN','responsibility':'Owner / language reviewer','dependencies':'B8 crosswalk'},
  {'task_id':'B8-002','priority':'P2','collection':'B / 8 / Inversions','issue':'Inspect images for stacked circles, mirrored B and glyph variants','done_when':'Each inspected image has a source ID, region coordinates, observation and disposition','actual_evidence':'Image pixels not comprehensively inspected in text recovery','status':'OPEN','responsibility':'Owner / visual reviewer','dependencies':'Original image access'},
  {'task_id':'B8-003','priority':'P2','collection':'B / 8 / Inversions','issue':'Review date/version/ID-only eight matches','done_when':'Incidental numeric matches distinguished from meaningful visual or authored connections','actual_evidence':'Digit-eight text matches include incidental numeric metadata','status':'OPEN','responsibility':'Owner / catalog reviewer','dependencies':'Text evidence CSV'},
  {'task_id':'B8-004','priority':'P2','collection':'B / 8 / Inversions','issue':'Reconcile new file pointers and folder navigation','done_when':'Each unmatched file pointer has a source identity and provisional subject; folder entries remain navigation','actual_evidence':json.dumps(dict(collections.Counter(r['pointer_match_status'] for r in pointerrows))),'status':'OPEN','responsibility':'Owner / archival technician','dependencies':'Library access'},
 ]
 backlogpath='02_CATALOG_AND_UNFINISHED_WORK/CURATED_FINISHING_BACKLOG.csv';backlog=csvrows(base.read(backlogpath));backlog+=tasks
 fields=list(catalog[0])+['b8_discovery_match','b8_match_routes'];newcat=csvbytes(updated,fields)
 summary={'date':'2026-11-05','catalog_basis':'Existing owner LCC-style catalog, unchanged provisional subject assignments','official_lcc_call_numbers_assigned':0,'physical_source_items':len(catalog),'original_source_bytes_preserved':True,'b8_records_crosslinked':len(mapped),'b8_source_hashes_verified':len(mapped),'new_duplicate_source_copies_created':0,'b_title_records_including_language_references':direct,'language_reference_entries_searched':7910,'b_language_name_reference_entries':614,'discovery_file_and_folder_candidates':len(filehits),'pointer_reconciliation_counts':dict(collections.Counter(r['pointer_match_status'] for r in pointerrows)),'shelves':[{'class':r['class'],'class_name':r['class_name'],'physical_items':int(r['files']),'b8_crosslinked_records':counts[r['class']]} for r in classes],'b8_completion_states':dict(statuses),'b8_open_tasks_added':len(tasks),'unmatched_record_identities':len(missing),'public_release_scope':'Aggregate shelf/work-status summaries and local catalog tooling; private source bytes are owner-controlled','coverage_limits':['Provisional local subject shelves; no professional call-number assignment','Not every Library pointer has verified original bytes','No comprehensive image-pixel or stacked-circle inspection','Visual, spelling and numeric candidates do not establish common etymology','Counts include references, proposals and duplicate snapshots; they are not finished-book counts']}
 public=pathlib.Path(a.summary_dir);public.mkdir(parents=True,exist_ok=True);(public/'summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2))
 shelfrows=[{'Class':r['class'],'Subject':r['class_name'],'Existing items':int(r['files']),'B8 crosslinks':counts[r['class']]} for r in classes]
 workbook={'summary':summary,'shelves':shelfrows,'tasks':tasks,'records':mapped};pathlib.Path(a.workbook_data).write_text(json.dumps(workbook,ensure_ascii=False))
 add={PREFIX+'B8_TO_EXISTING_LOC_SHELVES.csv':csvbytes(mapped,list(mapped[0])),PREFIX+'B8_FILE_POINTER_RECONCILIATION.csv':csvbytes(pointerrows,list(pointerrows[0])),PREFIX+'B8_OPEN_WORK.csv':csvbytes(tasks,list(tasks[0])),PREFIX+'SUMMARY.json':json.dumps(summary,ensure_ascii=False,indent=2).encode(),PREFIX+'PREVIOUS_MASTER_CATALOG.csv':base.read(CAT),PREFIX+'ORIGINAL_B8_RECOVERY.zip':pathlib.Path(a.recovery_zip).read_bytes()}
 for letter in counts:
  rr=[r for r in mapped if r['class']==letter];add[PREFIX+'BY_SUBJECT/'+letter+'/B8_FINDING_AID.csv']=csvbytes(rr,list(rr[0]))
 report='# B / 8 / Inversions — existing Library of Congress-style integration\n\nAll '+str(len(mapped))+' record candidates are crosslinked to existing subject shelves, original shelf IDs and exact SHA-256 identities. They add no new physical source items to the existing '+str(len(catalog))+'-item collection.\n\nOpen B8_CATALOG_SEARCH.html, B8_TO_EXISTING_LOC_SHELVES.csv, or BY_SUBJECT/. The original B8 recovery is retained verbatim.\n\nThe existing '+str(len(backlog)-len(tasks))+' finishing tasks remain, with '+str(len(tasks))+' B8-specific review tasks added. Original completion and priority values are unchanged.\n\nSubject shelf B (philosophy/psychology/religion) remains distinct from a title beginning B. The B/8 visual discovery index spans multiple subjects.\n\n## Subject distribution\n\n| Class | Subject | B8 crosslinks |\n|---|---|---:|\n'+''.join(f'| {r["Class"]} | {r["Subject"]} | {r["B8 crosslinks"]} |\n' for r in shelfrows)+'\n## Coverage\n\n'+''.join('- '+s+'\n' for s in summary['coverage_limits'])
 add[PREFIX+'READ_ME.md']=report.encode()
 # Same searchable interface as the public tools, with owner-only data embedded for offline use.
 bundle={'catalog':updated,'b8':mapped,'tasks':backlog,'summary':summary};add[PREFIX+'owner-catalog.json']=json.dumps(bundle,ensure_ascii=False,separators=(',',':')).encode()
 # This private crosswalk opens the existing classified file in the same extracted archive.
 page='<!doctype html><meta charset="utf-8"><title>B / 8 — Subject Catalog</title><style>body{font:16px system-ui;margin:30px;background:#111a2c;color:#eef3ff}input,select{padding:10px;margin:5px}table{width:100%;border-collapse:collapse}td,th{text-align:left;padding:10px;border-bottom:1px solid #40506b}a{color:#91dfd1}code{overflow-wrap:anywhere}</style><h1>B / 8 — existing subject shelves</h1><p>Original subjects, shelf IDs, source status and bytes retained. Search results are candidates.</p><input id="q" placeholder="Search title, key or match"><select id="s"><option value="">All subjects</option>'+''.join('<option>'+r['class']+'</option>' for r in classes)+'</select><p id="n"></p><table><thead><tr><th>Title</th><th>Subject</th><th>Status / work left</th><th>Source</th></tr></thead><tbody id="rows"></tbody></table>'
 browser_js=r'''const data=DATA;
const $=id=>document.getElementById(id),el=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
function render(){const q=$('q').value.toLowerCase(),s=$('s').value;const rows=data.filter(r=>(!q||JSON.stringify(r).toLowerCase().includes(q))&&(!s||r.class===s));$('n').textContent=rows.length+' matches; first 300 shown';$('rows').replaceChildren();for(const r of rows.slice(0,300)){const tr=el('tr'),a=el('td',r.title),b=el('td',r.subclass),c=el('td',r.completion_status+' — '+r.next_action),d=el('td'),link=el('a','Open preserved source');link.href='../'+r.new_relative_path.split('/').map(encodeURIComponent).join('/');d.append(link,el('br'),el('code',r.local_shelf_id));tr.append(a,b,c,d);$('rows').append(tr);}}
$('q').oninput=render;$('s').onchange=render;render();'''
 page=page.split('<script>',1)[0]+'<script>'+browser_js.replace('DATA',json.dumps(mapped,ensure_ascii=False).replace('</','<\\/'))+'</script>'
 add[PREFIX+'B8_CATALOG_SEARCH.html']=page.encode()
 replacements={CAT:newcat,backlogpath:csvbytes(backlog,list(backlog[0]))}
 for path in ('00_START_HERE/READ_ME_FIRST.md','02_CATALOG_AND_UNFINISHED_WORK/FINISHING_PLAN.md'):
  replacements[path]=base.read(path)+b'\n\n## B / 8 / Inversions integration\n\nSee ../04_B8_DISCOVERY_CROSS_REFERENCES/READ_ME.md and B8_CATALOG_SEARCH.html. 5,851 candidates link to existing subject shelves and exact source bytes. Four B8-specific open review tasks are appended; prior statuses and source payloads are preserved.\n'
 replacements['02_CATALOG_AND_UNFINISHED_WORK/ALL_ITEMS_ACTION_AND_STATUS.csv']=csvbytes([{**r,'b8_discovery_match':bool(annot.get(r['local_shelf_id'])),'b8_match_routes':annot.get(r['local_shelf_id'],'')} for r in csvrows(base.read('02_CATALOG_AND_UNFINISHED_WORK/ALL_ITEMS_ACTION_AND_STATUS.csv'))],list(csvrows(base.read('02_CATALOG_AND_UNFINISHED_WORK/ALL_ITEMS_ACTION_AND_STATUS.csv'))[0])+['b8_discovery_match','b8_match_routes'])
 for n in replacements:
  if n!=CAT:add[PREFIX+'PREVIOUS_ADMIN_FILES/'+n]=base.read(n)
 if a.workbook:
  workbook_member='02_CATALOG_AND_UNFINISHED_WORK/LOC_LIBRARY_CATALOG_AND_WORK_TRACKER.xlsx'
  add[PREFIX+'PREVIOUS_ADMIN_FILES/'+workbook_member]=base.read(workbook_member)
  replacements[workbook_member]=pathlib.Path(a.workbook).read_bytes()
 verified=0
 with zipfile.ZipFile(a.output_zip,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
  for info in base.infolist():
   if info.is_dir():continue
   data=base.read(info.filename)
   z.writestr(info.filename,replacements.get(info.filename,data))
  for n,data in add.items():z.writestr(n,data)
 lookup={r['new_relative_path']:r['sha256'] for r in catalog}
 with zipfile.ZipFile(a.output_zip) as z:
  for n,h in lookup.items():
   if hashlib.sha256(z.read(n)).hexdigest()!=h:raise ValueError('Preserved source checksum mismatch: '+n)
   verified+=1
  if z.testzip():raise ValueError('ZIP CRC failure')
 audit={'source_items_verified':verified,'source_hash_mismatches':0,'recovery_record_hash_matches':len(mapped),'new_duplicate_physical_items':0,'record_crosswalk_unmatched':0,'original_master_catalog_columns_preserved':True}
 with zipfile.ZipFile(a.output_zip,'a',zipfile.ZIP_DEFLATED) as z:z.writestr(PREFIX+'INTEGRATION_AUDIT.json',json.dumps(audit,indent=2).encode())
 (public/'verification.json').write_text(json.dumps(audit,indent=2));print(json.dumps({'summary':summary,'audit':audit},indent=2))
if __name__=='__main__':main()
