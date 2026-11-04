"""ChristmasToyDrive development platform: no live payments or child data."""
import hashlib, json, os, re, secrets, sqlite3, time, uuid
from pathlib import Path
from collections import defaultdict, deque
from fastapi import FastAPI, Request, Header, HTTPException, Depends
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field, field_validator
from typing import Literal, Optional
ROOT=Path(__file__).resolve().parent
CATALOG=json.loads((ROOT/'catalog.json').read_text())
TIERS=CATALOG['tiers']
DEFAULT_DB=str(ROOT/'toy-drive.sqlite3')
DDL='''
PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS giving_plans(id TEXT PRIMARY KEY, amount_cents INTEGER NOT NULL, designation TEXT NOT NULL, cadence TEXT NOT NULL, tier TEXT NOT NULL, idempotency_key TEXT UNIQUE, fingerprint TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'planned', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS inventory(id TEXT PRIMARY KEY, sku TEXT UNIQUE NOT NULL, title TEXT NOT NULL, category TEXT NOT NULL, quantity INTEGER NOT NULL DEFAULT 0 CHECK(quantity>=0), safety TEXT NOT NULL DEFAULT 'pending', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS movements(id TEXT PRIMARY KEY, inventory_id TEXT NOT NULL REFERENCES inventory(id), quantity_delta INTEGER NOT NULL, reason TEXT NOT NULL, reference TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS campaigns(id TEXT PRIMARY KEY, name TEXT NOT NULL, category TEXT NOT NULL, goal_cents INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'draft', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS batches(id TEXT PRIMARY KEY, reference TEXT UNIQUE NOT NULL, category TEXT NOT NULL, items INTEGER NOT NULL, partner_batch TEXT NOT NULL, verified INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS audit(id TEXT PRIMARY KEY, action TEXT NOT NULL, subject TEXT NOT NULL, detail TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
'''
DESIGNATIONS=('toys','clothing','food','combined','where_needed_most')

class PlanInput(BaseModel):
 amount_usd:float=Field(ge=5,le=100000)
 designation:Literal['toys','clothing','food','combined','where_needed_most']
 cadence:Literal['one_time','monthly','annually']
 @field_validator('amount_usd')
 @classmethod
 def cents(cls,v):
  if abs(v*100-round(v*100))>1e-7:raise ValueError('Whole cents only')
  return v
class InventoryInput(BaseModel):
 sku:str=Field(min_length=3,max_length=64,pattern=r'^[A-Za-z0-9_-]+$')
 title:str=Field(min_length=2,max_length=120)
 category:Literal['toys','clothing','food']
class MovementInput(BaseModel):
 item_id:str=Field(max_length=36)
 delta:int=Field(ge=-10000,le=10000)
 reason:Literal['receipt','distribution','correction']
 reference:str=Field(min_length=3,max_length=64,pattern=r'^[A-Za-z0-9_.:-]+$')
class SafetyInput(BaseModel):
 safety:Literal['pending','cleared','blocked']
class CampaignInput(BaseModel):
 name:str=Field(min_length=3,max_length=120)
 category:Literal['toys','clothing','food','combined','where_needed_most']
 goal_cents:int=Field(ge=100,le=100000000)
class BatchInput(BaseModel):
 reference:str=Field(min_length=4,max_length=64,pattern=r'^[A-Za-z0-9_.:-]+$')
 category:Literal['toys','clothing','food']
 items:int=Field(ge=1,le=10000)
 partner_batch:str=Field(min_length=3,max_length=64,pattern=r'^[A-Za-z0-9_.:-]+$')
 verified:bool=False

def create_app(db_path=None,admin_key=None):
 path=db_path or os.environ.get('CTD_DATABASE_PATH',DEFAULT_DB)
 key=admin_key if admin_key is not None else os.environ.get('CTD_ADMIN_KEY','')
 db=sqlite3.connect(path);db.executescript(DDL);db.close()
 app=FastAPI(title='Christmas Toy Drive — planning and operations',docs_url=None,redoc_url=None,openapi_url=None)
 rate=defaultdict(deque)
 def conn():
  c=sqlite3.connect(path,timeout=15, isolation_level=None);c.row_factory=sqlite3.Row;c.execute('PRAGMA foreign_keys=ON');return c
 def require_staff(x_admin_key:Optional[str]=Header(default=None)):
  if not key or len(key)<16:raise HTTPException(503,'Staff access disabled until server secret configured')
  if not x_admin_key or not secrets.compare_digest(key,x_admin_key):raise HTTPException(401,'Staff credential required')
  return True
 def audit(c,action,subject,details=None):c.execute('INSERT INTO audit(id,action,subject,detail) VALUES(?,?,?,?)',(str(uuid.uuid4()),action,subject,json.dumps(details or {})))
 @app.middleware('http')
 async def secure(request:Request,call_next):
  if request.method=='POST' and request.url.path=='/api/plans':
   address=request.client.host if request.client else 'unknown';q=rate[address];now=time.monotonic()
   while q and now-q[0]>60:q.popleft()
   if len(q)>=15:raise HTTPException(429,'Too many requests')
   q.append(now)
  response=await call_next(request)
  response.headers['X-Content-Type-Options']='nosniff'
  response.headers['X-Frame-Options']='DENY'
  response.headers['Referrer-Policy']='no-referrer'
  response.headers['Content-Security-Policy']="default-src 'self'; style-src 'self'; script-src 'self'; img-src 'self' data:; base-uri 'none'; frame-ancestors 'none'"
  response.headers['Cache-Control']='no-store' if request.url.path.startswith('/api/') else 'no-cache'
  return response
 @app.get('/api/health')
 def health():return {'ok':True,'mode':'development','payments':'disabled','private_intake':'disabled'}
 @app.get('/api/catalog')
 def catalog():return {'tiers':TIERS,'categories':list(DESIGNATIONS),'status':'proposed'}
 @app.get('/api/impact')
 def impact():return {'status':'not_verified','settled_donations':None,'families_served':None,'distributed_items':None,'note':'No verified financial or distribution source is connected.'}
 @app.post('/api/plans',status_code=201)
 def create_plan(body:PlanInput,idempotency_key:Optional[str]=Header(default=None)):
  cents=round(body.amount_usd*100);fingerprint=hashlib.sha256(f'{cents}|{body.designation}|{body.cadence}'.encode()).hexdigest()
  if idempotency_key and not (8<=len(idempotency_key)<=128):raise HTTPException(422,'Idempotency key length must be 8–128')
  c=conn()
  try:
   if idempotency_key:
    old=c.execute('SELECT * FROM giving_plans WHERE idempotency_key=?',(idempotency_key,)).fetchone()
    if old:
     if old['fingerprint']!=fingerprint:raise HTTPException(409,'Idempotency key already used for another plan')
     return {'id':old['id'],'status':'planned','is_payment':False}
   tier=next((t['tier_name'] for t in TIERS if round(t['amount_usd']*100)==cents),'Custom giving level')
   pid=str(uuid.uuid4())
   c.execute('INSERT INTO giving_plans(id,amount_cents,designation,cadence,tier,idempotency_key,fingerprint) VALUES(?,?,?,?,?,?,?)',(pid,cents,body.designation,body.cadence,tier,idempotency_key,fingerprint))
   return {'id':pid,'status':'planned','is_payment':False,'note':'No charge occurred. This is not a receipt.'}
  finally:c.close()
 @app.get('/api/admin/overview',dependencies=[Depends(require_staff)])
 def overview():
  c=conn()
  try:
   def val(q):return c.execute(q).fetchone()[0] or 0
   return {'planned_gifts':val('SELECT COUNT(*) FROM giving_plans'),'planned_amount_cents':val('SELECT SUM(amount_cents) FROM giving_plans'),'inventory_skus':val('SELECT COUNT(*) FROM inventory'),'inventory_units':val('SELECT SUM(quantity) FROM inventory'),'draft_campaigns':val('SELECT COUNT(*) FROM campaigns'),'verified_batch_count':val('SELECT COUNT(*) FROM batches WHERE verified=1'),'settled_donations':None}
  finally:c.close()
 @app.get('/api/admin/inventory',dependencies=[Depends(require_staff)])
 def inventory():
  c=conn()
  try:return [dict(r) for r in c.execute('SELECT id,sku,title,category,quantity,safety FROM inventory ORDER BY sku')]
  finally:c.close()
 @app.post('/api/admin/inventory',dependencies=[Depends(require_staff)],status_code=201)
 def add_inventory(body:InventoryInput):
  c=conn()
  try:
   ident=str(uuid.uuid4());c.execute('BEGIN')
   try:
    c.execute('INSERT INTO inventory(id,sku,title,category) VALUES(?,?,?,?)',(ident,body.sku,body.title,body.category));audit(c,'inventory.created',ident,{'sku':body.sku});c.commit()
   except sqlite3.IntegrityError:c.rollback();raise HTTPException(409,'SKU already exists')
   return {'id':ident,'sku':body.sku,'quantity':0,'safety':'pending'}
  finally:c.close()
 @app.post('/api/admin/inventory/{item_id}/safety',dependencies=[Depends(require_staff)])
 def safety(item_id:str,body:SafetyInput):
  c=conn()
  try:
   c.execute('BEGIN IMMEDIATE');item=c.execute('SELECT id FROM inventory WHERE id=?',(item_id,)).fetchone()
   if not item:raise HTTPException(404,'Unknown item')
   c.execute('UPDATE inventory SET safety=? WHERE id=?',(body.safety,item_id));audit(c,'inventory.safety',item_id,{'safety':body.safety});c.commit();return {'status':'updated','safety':body.safety}
  finally:c.close()
 @app.post('/api/admin/movements',dependencies=[Depends(require_staff)],status_code=201)
 def movement(body:MovementInput):
  if body.delta==0:raise HTTPException(422,'Delta cannot be zero')
  if body.reason=='receipt' and body.delta<0:raise HTTPException(422,'Receipt must increase stock')
  if body.reason=='distribution' and body.delta>0:raise HTTPException(422,'Distribution must decrease stock')
  c=conn()
  try:
   c.execute('BEGIN IMMEDIATE');item=c.execute('SELECT * FROM inventory WHERE id=?',(body.item_id,)).fetchone()
   if not item:raise HTTPException(404,'Unknown item')
   if body.delta<0 and item['safety']!='cleared':raise HTTPException(409,'Item requires clearance before release')
   if item['quantity']+body.delta<0:raise HTTPException(409,'Insufficient stock')
   mid=str(uuid.uuid4());c.execute('UPDATE inventory SET quantity=quantity+? WHERE id=?',(body.delta,body.item_id))
   c.execute('INSERT INTO movements(id,inventory_id,quantity_delta,reason,reference) VALUES(?,?,?,?,?)',(mid,body.item_id,body.delta,body.reason,body.reference))
   audit(c,'inventory.movement',body.item_id,{'delta':body.delta,'reference':body.reference});c.commit()
   return {'id':mid,'quantity':item['quantity']+body.delta}
  finally:c.close()
 @app.post('/api/admin/campaigns',dependencies=[Depends(require_staff)],status_code=201)
 def campaign(body:CampaignInput):
  c=conn()
  try:
   ident=str(uuid.uuid4());c.execute('BEGIN');c.execute('INSERT INTO campaigns(id,name,category,goal_cents) VALUES(?,?,?,?)',(ident,body.name,body.category,body.goal_cents));audit(c,'campaign.created',ident);c.commit();return {'id':ident,'status':'draft'}
  finally:c.close()
 @app.post('/api/admin/batches',dependencies=[Depends(require_staff)],status_code=201)
 def batch(body:BatchInput):
  c=conn()
  try:
   ident=str(uuid.uuid4());c.execute('BEGIN')
   try:c.execute('INSERT INTO batches(id,reference,category,items,partner_batch,verified) VALUES(?,?,?,?,?,?)',(ident,body.reference,body.category,body.items,body.partner_batch,int(body.verified)));audit(c,'batch.recorded',ident,{'verified':body.verified});c.commit()
   except sqlite3.IntegrityError:c.rollback();raise HTTPException(409,'Duplicate reference')
   return {'id':ident,'verified':body.verified}
  finally:c.close()
 @app.get('/api/admin/audit',dependencies=[Depends(require_staff)])
 def audit_log():
  c=conn()
  try:return [dict(r) for r in c.execute('SELECT action,subject,detail,created_at FROM audit ORDER BY created_at DESC LIMIT 100')]
  finally:c.close()
 @app.get('/')
 def homepage():return FileResponse(ROOT/'frontend'/'index.html')
 app.mount('/assets',StaticFiles(directory=ROOT/'frontend'),name='assets')
 return app
app=create_app()
