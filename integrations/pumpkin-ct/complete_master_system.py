"""Pumpkin Patch + CT Inc. + Nathan AI + Handling Life: master handoff.
Proposed integrations are NOT evidence of deployment. Tier percentages are draft assumptions.
"""
import json
from decimal import Decimal, ROUND_HALF_UP
from white_label_app_factory import WHITE_LABEL_APP_CATALOG
from fun_and_community_layer import build_complete_handoff_manifest
CORE_LOGISTICS_AND_FLEET={
"delivery_and_carrier_engine":["ranked church delivery slots","four-hour carrier approve/deny/counter SLA","SMS nudges, phone escalation and fallback reassignment","HOS-aware tracking and breakdown/accident workflow","backhaul relief freight matching"],
"collyn_driver_and_kiosk_suite":["hands-free routing and unload notes","curbside invoices, digital signatures, bin counts and Bluetooth POS","GPS/photo damage reporting and append-only audit","solar/QR lot kiosk; offline draft orders only, never unconfirmed charges","masked phone bridges; reviewed driver suspension rather than automatic punitive blacklisting"]}
TIER_SCHEDULES={
"TRUCK_DROP_PRODUCE_AND_PLANTS":[(0,249999,25,5),(250000,749999,30,7),(750000,1499999,35,10),(1500000,2999999,40,12),(3000000,None,45,15)],
"POD_CATALOG_AND_HOLIDAY_WRAP":[(0,99999,35,10),(100000,299999,40,10),(300000,749999,45,12),(750000,1499999,50,15),(1500000,None,55,15)],
"CHURCH_SUPPLIES_AND_SUNDAY_SCHOOL":[(0,99999,20,30),(100000,249999,25,35),(250000,499999,30,40),(500000,999999,35,45),(1000000,None,40,50)]}
MASTER_CATALOG={
"TRACK_A_BULK_TRUCK_DROPS":["pumpkins and gourds","Christmas trees, wreaths, garland, firewood","bedding plants, hanging baskets, ferns","mulch, pine straw, topsoil","peaches, citrus, Vidalia onions, apples, watermelons","detergent pails and trash bags","fireworks where permitted","frozen bakery, cookie dough, pies and popcorn"],
"TRACK_B_POD_AND_1980S_TAKE_HOME_CATALOG":["holiday wrapping paper, bags and ribbons","children's custom artwork gift wrap","congregation, Diné with Pumpkins, 101 Lost Pumpkin Recipes and Three Sisters cookbooks","children's books, coloring and read-along packs","Three Sisters seed kits","safe yard games, Scramble and trivia","church/VBS apparel","stationery, calendars, tumblers, candles","ChristmasToyDrive.com gift sponsorship","discount cards and memorial bricks"],
"TRACK_C_B2B_CHURCH_SUPPLIES_AND_SUNDAY_SCHOOL":["quarterly nursery/kids/youth/adult teacher and student curriculum","VBS kits, crafts and awards","communion cups, juice, wafers and gluten-free bread","bulletins, envelopes and visitor cards","choir robes, stoles, clergy shirts and baptismal garments","candles, oils, banners, flags and altar linens","pew/outreach Bibles, covers and certificates","church websites, event kits and supplies"]}
CHURCH_OS_AND_NATHAN_AI={
"native_video_streaming":["Cloudflare Stream integration target","post-service VOD and transcript proposal","live digital bulletin, prayer and giving sidebar"],
"voice_to_month_automation":["opt-in voice note -> editable monthly events and bulletin draft","human review before publishing"],
"nathan_ai_omnichannel_comms":["phone receptionist proposal","two-way SMS commands GIVE 10, RSVP THANKSGIVING, HELP GROCERIES","weekly email bulletins and receipts","separate email, text and phone consent toggles"],
"consumer_first_secured_giving":["explicit donor confirmation for amount, recipient, recurrence and payment method","transparent fee coverage default zero","self-service pause/edit/cancel","tax receipt only after confirmed payment and eligibility checks","Stripe Connect splits subject to onboarding and settlement rules"]}
FUN_AND_WHITE_LABEL_MODULES={"WHITE_LABEL_APP_FACTORY":[{"id":x.app_id,"title":x.default_public_title,"engine":x.internal_engine_name} for x in WHITE_LABEL_APP_CATALOG],"GAMIFICATION_AND_FESTIVALS":build_complete_handoff_manifest()["optional_fun_layer"]}
SYSTEM_BRIDGES_AND_GUARDRAILS={
"safety_and_consent_protocols":["Yes is Yes / No is No","adult-only singles; consent and age verification","report/block and human moderation","family spending caps","rain checks","private contact relay and data retention controls"],
"external_webhooks":["Stripe Connect signed webhooks","QuickBooks and Xero reconciliation","Printful/Lulu/IngramSpark fulfillment adapters","Twilio/Telnyx SMS and voice; email routing","carrier ELD/HOS vendor adapters"],
"compliance":["distinguish donations from product sales","501(c)(3) and eligible-church substantiation review","do not issue tax-deductibility claims automatically","tax receipt generation after payment confirmation","access controls and audit records"]}
def cents(amount):
 x=Decimal(str(amount))
 if not x.is_finite() or x<0: raise ValueError("amount must be finite and nonnegative")
 return int((x*100).quantize(Decimal("1"),rounding=ROUND_HALF_UP))
def calculate_settlement(track,amount,mode="CASH"):
 n=cents(amount)
 if track not in TIER_SCHEDULES: raise ValueError("unknown track")
 if mode not in ("CASH","SUPPLY_CREDIT","DIRECT_CHURCH_BUY","SPONSOR"): raise ValueError("unknown mode")
 for index,(low,high,primary,bonus) in enumerate(TIER_SCHEDULES[track],1):
  if n>=low and (high is None or n<=high): break
 else: raise ValueError("no tier")
 if track=="CHURCH_SUPPLIES_AND_SUNDAY_SCHOOL":
  if mode not in ("DIRECT_CHURCH_BUY","SPONSOR"): raise ValueError("church supplies require DIRECT_CHURCH_BUY or SPONSOR")
  benefit=(n*(primary if mode=="DIRECT_CHURCH_BUY" else bonus)+50)//100
  return {"tier":index,"amount_cents":n,"mode":mode,"benefit_cents":benefit,"church_pays_cents":n-benefit if mode=="DIRECT_CHURCH_BUY" else None,"draft_rates":True}
 if mode not in ("CASH","SUPPLY_CREDIT"): raise ValueError("invalid payout mode")
 cash=(n*primary+50)//100
 credit=(n*(primary+bonus)+50)//100
 return {"tier":index,"amount_cents":n,"mode":mode,"benefit_cents":cash if mode=="CASH" else credit,"cash_option_cents":cash,"supply_credit_option_cents":credit,"draft_rates":True}
def build_manifest():
 return {"core_logistics":CORE_LOGISTICS_AND_FLEET,"tiers":TIER_SCHEDULES,"catalog":MASTER_CATALOG,"church_os_and_nathan_ai":CHURCH_OS_AND_NATHAN_AI,"fun_and_white_label":FUN_AND_WHITE_LABEL_MODULES,"bridges_and_guardrails":SYSTEM_BRIDGES_AND_GUARDRAILS,"status":"DRAFT_SOURCE_HANDOFF_NOT_DEPLOYED"}
if __name__=="__main__": print(json.dumps(build_manifest(),indent=2))
