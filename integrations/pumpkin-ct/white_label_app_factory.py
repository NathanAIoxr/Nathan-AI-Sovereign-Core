"""Opt-in tenant configuration generator. No live DNS, KV or D1 changes."""
from dataclasses import dataclass
from typing import List
import json,re
@dataclass(frozen=True)
class WhiteLabelAppModule:
 app_id:str
 internal_engine_name:str
 default_public_title:str
 category:str
 core_features:tuple
 fundraising_hook:str
WHITE_LABEL_APP_CATALOG=[
 WhiteLabelAppModule("APP-CHURCH-OPS","CT Inc. + Hop In Chatbox","{ORG_NAME} Connect & Interactive Bulletin","Church Operations",("bulletins","RSVPs","potlucks","sermons","announcements","visitor followup"),"Money-Back catalog"),
 WhiteLabelAppModule("APP-DATING-SINGLES","Nathan AI Dating","{ORG_NAME} / {REGION} Singles & Fellowship","Adults-only Dating",("adult profiles","group hangouts","community-vouched matching","report and block"),"Optional membership revenue share"),
 WhiteLabelAppModule("APP-COMMUNITY-HELP","Handling Life + iCU Buddy + Daily Cup of Hope + Daily Plate of Love","{ORG_NAME} Care & Helping Hands","Community Aid",("groceries","rides","meals","yard work","volunteer hours","holiday hospitality"),"Buy One Bless One"),
 WhiteLabelAppModule("APP-YOUTH-GAMES","Tabor World + Castles & Unicorns + Dirk & Tavern Puzzles + Sorting Hats","{ORG_NAME} Youth, Kids & Family Hub","Youth Games",("Sorting Hats & Hatettes/Huffettes","KJV trivia","Scramble","Three Sisters badges","read-along books"),"Fundraising leagues"),
 WhiteLabelAppModule("APP-STUDY-AI","Nathan AI + Tabor Concordance + WORDS","{ORG_NAME} Scripture & Study Companion","Study AI",("KJV roots","Strong's","church sermon references","reading plans"),"Bible and curriculum catalog"),
 WhiteLabelAppModule("APP-BLESSING-STORE","ChristmasToyDrive.com","{ORG_NAME} Year-Round Toy & Blessing Drive","Outreach",("toy and coat tiers","honor cards","Thanksgiving meals","donor receipts"),"Sponsor-a-neighbor"),
 WhiteLabelAppModule("APP-DRIVER-KIOSK","Collyn Driver Command + Lot Kiosk","{ORG_NAME} Lot Kiosk & Delivery","Fleet",("voice notes","delivery invoice","photo proof","stock alerts","backhauls","QR self-pay"),"Lot sales"),
 WhiteLabelAppModule("APP-FUNDRAISING","Pumpkin Patch Fundraiser + Tabor 1-2-3 Factory","{ORG_NAME} Fundraising & Supplies","Commerce",("pumpkins","trees","holiday catalogs","Money-Off / Money-Back","church supplies"),"Church cash or supply credit")
]
def provision_white_label_tenant(org_id,org_name,custom_domain,primary_color,enabled_app_ids,region_name="Local Community"):
 if not re.fullmatch(r"[a-zA-Z0-9_-]{2,80}",org_id): raise ValueError("invalid org_id")
 if not org_name.strip(): raise ValueError("org_name required")
 if not re.fullmatch(r"#[0-9a-fA-F]{6}",primary_color): raise ValueError("invalid color")
 if not re.fullmatch(r"(?=.{4,253}$)[a-z0-9.-]+\.[a-z]{2,}",custom_domain.lower()): raise ValueError("invalid domain")
 available={a.app_id:a for a in WHITE_LABEL_APP_CATALOG}
 if len(set(enabled_app_ids))!=len(enabled_app_ids) or set(enabled_app_ids)-set(available): raise ValueError("duplicate or unknown app")
 apps=[{"app_id":a.app_id,"branded_title":a.default_public_title.format(ORG_NAME=org_name,REGION=region_name),"engine":a.internal_engine_name,"category":a.category,"features":list(a.core_features),"fundraising_hook":a.fundraising_hook} for a in WHITE_LABEL_APP_CATALOG if a.app_id in enabled_app_ids]
 return {"tenant_id":org_id,"brand_name":org_name,"custom_domain":custom_domain.lower(),"theme":{"primary_color":primary_color,"attribution":"Developed by Pumpkin Patch Network"},"enabled_apps":apps,"fundraising_and_supply_wallet":{"enabled":"APP-FUNDRAISING" in enabled_app_ids,"tracks":["TRUCK_DROP_PRODUCE_AND_PLANTS","POD_CATALOG_AND_HOLIDAY_WRAP","CHURCH_SUPPLIES_AND_SUNDAY_SCHOOL"]},"status":"DRAFT_NOT_PROVISIONED"}
if __name__=="__main__":
 print(json.dumps(provision_white_label_tenant("ORG-NC-2026-01","Kernersville Community Church","app.kernersvillecommunity.org","#C84B11",["APP-CHURCH-OPS","APP-DATING-SINGLES","APP-COMMUNITY-HELP","APP-YOUTH-GAMES","APP-STUDY-AI","APP-BLESSING-STORE"],"Piedmont Triad"),indent=2))
