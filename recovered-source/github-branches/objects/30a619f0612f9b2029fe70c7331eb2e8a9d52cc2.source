from pathlib import Path
import sys
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
import pytest
from fastapi.testclient import TestClient
from app import create_app

@pytest.fixture
def api(tmp_path):return TestClient(create_app(db_path=str(tmp_path/'data.sqlite'),admin_key='correct-long-test-key'))

def test_public(api):
 assert api.get('/').status_code==200
 assert api.get('/api/health').json()['payments']=='disabled'
 assert len(api.get('/api/catalog').json()['tiers'])==24
 assert api.get('/api/impact').json()['settled_donations'] is None
 assert "frame-ancestors 'none'" in api.get('/').headers['content-security-policy']

def test_planning_not_money(api):
 plan={'amount_usd':120,'designation':'combined','cadence':'monthly'}
 h={'Idempotency-Key':'idempotent-test-123'}
 r=api.post('/api/plans',json=plan,headers=h);assert r.status_code==201
 assert r.json()['is_payment'] is False
 assert api.post('/api/plans',json=plan,headers=h).json()['id']==r.json()['id']
 assert api.post('/api/plans',json={**plan,'amount_usd':300},headers=h).status_code==409
 assert api.get('/api/impact').json()['settled_donations'] is None

def test_validation(api):
 for value in [-20,1,100001]:
  assert api.post('/api/plans',json={'amount_usd':value,'designation':'toys','cadence':'one_time'}).status_code==422
 assert api.post('/api/plans',json={'amount_usd':20,'designation':'private_family_record','cadence':'monthly'}).status_code==422

def test_security_and_stock(api):
 assert api.get('/api/admin/overview').status_code==401
 h={'X-Admin-Key':'correct-long-test-key'}
 assert api.get('/api/admin/overview',headers=h).status_code==200
 item=api.post('/api/admin/inventory',json={'sku':'TOY-001','title':'Blocks','category':'toys'},headers=h)
 assert item.status_code==201
 ident=item.json()['id']
 assert api.post('/api/admin/inventory',json={'sku':'TOY-001','title':'More blocks','category':'toys'},headers=h).status_code==409
 received=api.post('/api/admin/movements',json={'item_id':ident,'delta':8,'reason':'receipt','reference':'NEW-BOX-1'},headers=h)
 assert received.status_code==201
 assert api.post('/api/admin/movements',json={'item_id':ident,'delta':-2,'reason':'distribution','reference':'OUT-BOX-1'},headers=h).status_code==409
 cleared=api.post(f'/api/admin/inventory/{ident}/safety',json={'safety':'cleared'},headers=h)
 assert cleared.status_code==200
 out=api.post('/api/admin/movements',json={'item_id':ident,'delta':-2,'reason':'distribution','reference':'OUT-BOX-1'},headers=h)
 assert out.status_code==201
 assert api.get('/api/admin/overview',headers=h).json()['inventory_units']==6
 assert len(api.get('/api/admin/audit',headers=h).json())==4

def test_campaign_batch(api):
 h={'X-Admin-Key':'correct-long-test-key'}
 assert api.post('/api/admin/campaigns',json={'name':'Winter Kindness','category':'combined','goal_cents':50000},headers=h).status_code==201
 r=api.post('/api/admin/batches',json={'reference':'BATCH-01','category':'food','items':9,'partner_batch':'PARTNER-01','verified':False},headers=h)
 assert r.status_code==201
 assert api.get('/api/admin/overview',headers=h).json()['verified_batch_count']==0
 assert api.post('/api/admin/batches',json={'reference':'BATCH-01','category':'food','items':9,'partner_batch':'PARTNER-01','verified':False},headers=h).status_code==409
