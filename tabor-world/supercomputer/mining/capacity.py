#!/usr/bin/env python3
"""Power/thermal planning only; no device provisioning or mining."""
import argparse,json,math
def plan(miners, watts_each, power_limit_kw, pue=1.2, ths_each=200):
    if miners<0 or watts_each<=0 or power_limit_kw<=0 or pue<1 or ths_each<=0: raise ValueError("Invalid capacity assumptions")
    capacity=math.floor(power_limit_kw*1000/(watts_each*pue))
    active=min(miners,capacity)
    return {"requested_miners":miners,"max_miners_within_site_power":capacity,"supported_miners":active,
      "assumed_asic_watts":watts_each,"assumed_site_pue":pue,
      "estimated_total_kw":round(active*watts_each*pue/1000,3),
      "estimated_heat_btu_per_hour":round(active*watts_each*3.412142,1),
      "assumed_ths_each":ths_each,"estimated_hashrate_ths":active*ths_each,
      "measured":False,"note":"Illustrative assumptions; nameplate, cooling, electricity, site and hashrate must be verified"}
if __name__=="__main__":
    p=argparse.ArgumentParser()
    p.add_argument("--miners",type=int,required=True)
    p.add_argument("--watts-each",type=float,required=True)
    p.add_argument("--power-limit-kw",type=float,required=True)
    p.add_argument("--pue",type=float,default=1.2)
    p.add_argument("--ths-each",type=float,default=200)
    print(json.dumps(plan(**vars(p.parse_args())),indent=2))
