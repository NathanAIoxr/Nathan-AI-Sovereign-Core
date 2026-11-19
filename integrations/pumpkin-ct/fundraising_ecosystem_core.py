"""Year-round fundraising and church supplies. Proposed tiers, NOT approved rates."""
from decimal import Decimal, ROUND_HALF_UP
from dataclasses import dataclass
from typing import Optional
import json

SCHEDULES = {
 "TRUCK_DROP_PRODUCE_AND_PLANTS": {
  "thresholds": [0,2500,7500,15000,30000],
  "cash": ["0.25","0.30","0.35","0.40","0.45"],
  "credit_bonus": ["0.05","0.07","0.10","0.12","0.15"]},
 "POD_CATALOG_AND_HOLIDAY_WRAP": {
  "thresholds": [0,1000,3000,7500,15000],
  "cash": ["0.35","0.40","0.45","0.50","0.55"],
  "credit_bonus": ["0.10","0.10","0.12","0.15","0.15"]},
 "CHURCH_SUPPLIES_AND_SUNDAY_SCHOOL": {
  "thresholds": [0,1000,2500,5000,10000],
  "money_off": ["0.20","0.25","0.30","0.35","0.40"],
  "sponsor_rebate": ["0.30","0.35","0.40","0.45","0.50"]}
}
MASTER_CATALOG = {
 "TRACK_A_BULK_TRUCK_DROPS": [
 ("LOT-PUMP-01","Flagship Pumpkin Patch (Bins & Specialty Gourds)","Fall"),
 ("LOT-TREE-02","Christmas Trees, Wreaths, Garland & Firewood","Winter"),
 ("LOT-SPRG-03","Spring Bedding Plants, Hanging Baskets & Ferns","Spring"),
 ("LOT-MULC-04","Mulch, Pine Straw & Topsoil Pallets","Spring"),
 ("LOT-PROD-05","Peaches, Citrus, Vidalia Onions, Apples & Watermelons","Summer/Fall"),
 ("LOT-HOME-06","5-Gallon Laundry Detergent Pails & Trash Bags","Year-round"),
 ("LOT-FIRE-07","Fireworks Tent Assortment (Where Permitted)","Summer"),
 ("LOT-BAKE-08","Frozen Cookie Dough, Pies, Cinnamon Rolls & Popcorn","Fall/Winter")],
 "TRACK_B_POD_AND_1980S_TAKE_HOME_CATALOG": [
 ("POD-WRAP-01","Every-Holiday Wrapping Paper, Gift Bags & Ribbons","Year-round"),
 ("POD-WRAP-02","Custom Youth & Kids Artwork Wrapping Paper","Year-round"),
 ("POD-COOK-03","Congregation, Diné with Pumpkins, 101 Lost Pumpkin Recipes & Three Sisters Cookbooks","Fall"),
 ("POD-KIDS-04","Kids Books, Coloring & QR Read-Along","Year-round"),
 ("POD-SEED-05","Three Sisters Seed & Story Kits","Spring/Summer"),
 ("POD-GAME-06","Safe Yard Darts, Scramble & Trivia Game Packs","Year-round"),
 ("POD-APPR-07","Church, Youth & VBS Apparel","Year-round"),
 ("POD-HOME-08","Stationery, Calendars, Tumblers, Mugs & Candles","Year-round"),
 ("POD-TOYS-09","ChristmasToyDrive.com Sponsor-a-Gift Bundles","Year-round"),
 ("POD-CARD-10","Discount Cards, Donation Cards & Memorial Bricks","Year-round")],
 "TRACK_C_B2B_CHURCH_SUPPLIES_AND_SUNDAY_SCHOOL": [
 ("CHU-SSCH-01","Quarterly Sunday School Curriculum: Nursery to Adult","Quarterly"),
 ("CHU-VBSK-02","VBS Starter Kits, Crafts & Awards","Summer"),
 ("CHU-COMM-03","Communion Cups, Prefilled Sets, Bread, Wafers & Gluten-Free","Monthly"),
 ("CHU-BULL-04","Church Bulletins, Offering Envelopes & Visitor Cards","Weekly"),
 ("CHU-ROBE-05","Choir, Pulpit & Baptismal Robes, Stoles & Clergy Shirts","On demand"),
 ("CHU-SANC-06","Candles, Oils, Banners, Feather Flags & Altar Linens","Seasonal"),
 ("CHU-BIBL-07","Bulk Bibles, Bible Covers & Certificates","On demand"),
 ("CHU-TECH-08","CT Inc. Websites, Digital Bulletin & Lot Kiosk","Monthly")],
}
PLATFORM_MODULES = {
 "COLLYN_DRIVER_COMMAND_APP": ["Hands-free AI voice chat","Instant invoicing and signatures","GPS-stamped proof of delivery","One-tap dispatch","Low-stock reorder triggers","Backhaul matcher"],
 "ZERO_RISK_TRUST_CONTROLS": ["Rain checks","Optional family spending caps","Consignment and POD options","Cash or supply-credit settlement"],
 "ENGAGEMENT_AND_GAMIFICATION": ["Golden Ticket promotions","Sorting Hats & Huffettes leagues","Scramble and safe yard games","Buy One Bless One"],
 "OPTIONAL_WHITE_LABEL_APPS": ["Dating apps (adults only)","Community apps","Handling Life","Daily Cup of Hope","Daily Plate of Love","Other separately approved existing apps"],
}
def money(value):
    v=Decimal(str(value))
    if not v.is_finite() or v<0: raise ValueError("amount must be finite and nonnegative")
    return v
def round_money(v):
    return str(v.quantize(Decimal("0.01"),rounding=ROUND_HALF_UP))
def calculate_settlement(track_key,gross_amount,payout_preference="CASH",purchase_mode="CONGREGATION_FUNDRAISER",annual_qualifying_spend=None):
    schedule=SCHEDULES[track_key]
    gross=money(gross_amount)
    qualifying=money(annual_qualifying_spend) if annual_qualifying_spend is not None else gross
    tier=max(i for i,t in enumerate(schedule["thresholds"]) if qualifying>=t)
    result={"track":track_key,"tier":tier+1,"gross":round_money(gross),"qualifying_volume":round_money(qualifying),"proposal_only":True}
    if track_key=="CHURCH_SUPPLIES_AND_SUNDAY_SCHOOL":
        if purchase_mode=="DIRECT_CHURCH_BUY":
            discount=gross*Decimal(schedule["money_off"][tier])
            result.update(mode="MONEY_OFF",discount=round_money(discount),net_church_pays=round_money(gross-discount))
        elif purchase_mode=="CONGREGATION_FUNDRAISER":
            result.update(mode="MONEY_BACK",church_rebate=round_money(gross*Decimal(schedule["sponsor_rebate"][tier])))
        else: raise ValueError("invalid purchase_mode")
    else:
        cash=gross*Decimal(schedule["cash"][tier])
        bonus=gross*Decimal(schedule["credit_bonus"][tier])
        if payout_preference=="CASH":
            result.update(mode="CASH",church_cash_payout=round_money(cash),optional_supply_credit=round_money(cash+bonus))
        elif payout_preference=="SUPPLY_CREDIT":
            result.update(mode="SUPPLY_CREDIT",base_earned=round_money(cash),credit_bonus=round_money(bonus),total_supply_credit=round_money(cash+bonus))
        else: raise ValueError("invalid payout_preference")
    return result
if __name__=="__main__":
    print(json.dumps({"examples":[calculate_settlement("TRUCK_DROP_PRODUCE_AND_PLANTS",18500),calculate_settlement("POD_CATALOG_AND_HOLIDAY_WRAP",4200,"SUPPLY_CREDIT"),calculate_settlement("CHURCH_SUPPLIES_AND_SUNDAY_SCHOOL",3000,purchase_mode="DIRECT_CHURCH_BUY")],"catalog_counts":{k:len(v) for k,v in MASTER_CATALOG.items()}},indent=2))
