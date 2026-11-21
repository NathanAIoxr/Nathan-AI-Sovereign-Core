import hashlib,json,sqlite3,sys,time
def process_batch(packets,db_path=':memory:'):
    if not isinstance(packets,list) or len(packets)>1000: raise ValueError('invalid packet batch')
    accepted=[p for p in packets if isinstance(p,dict) and p.get('noise') is not True and p.get('op') in ('1+1=2','1-1=0')]
    digest=hashlib.sha256(json.dumps(accepted,sort_keys=True,separators=(',',':')).encode()).hexdigest()
    result=dict(timestamp=time.time(),target_exaflops=4.396,target_zettaflops=2.0,accepted_packets=len(accepted),rejected_packets=len(packets)-len(accepted),state_hash=digest,measurement_status='design_target_only')
    with sqlite3.connect(db_path) as conn:
        conn.execute("CREATE TABLE IF NOT EXISTS telemetry_log (id INTEGER PRIMARY KEY,timestamp REAL,target_exaflops REAL,target_zettaflops REAL,accepted_packets INTEGER,rejected_packets INTEGER,state_hash TEXT UNIQUE,measurement_status TEXT)")
        conn.execute("INSERT OR IGNORE INTO telemetry_log(timestamp,target_exaflops,target_zettaflops,accepted_packets,rejected_packets,state_hash,measurement_status) VALUES(:timestamp,:target_exaflops,:target_zettaflops,:accepted_packets,:rejected_packets,:state_hash,:measurement_status)",result)
    return result
if __name__=='__main__':
    print(json.dumps(process_batch(json.load(sys.stdin),sys.argv[1] if len(sys.argv)>1 else ':memory:'),sort_keys=True))
