"""Independent Diné education/fundraising planning catalog; no auto-publication."""
from dataclasses import dataclass, asdict
import json

@dataclass(frozen=True)
class Module:
    module_id: str
    title: str
    purpose: str
    status: str = "DRAFT"

MODULES = [
    Module("DIN-EDU", "Diné history and sovereignty", "Long Walk, Bosque Redondo, 1868 Treaty, present-day perspectives"),
    Module("DIN-FARM", "New Mexico farm-to-patch", "Verified provenance, harvest, water, grower interviews, distribution"),
    Module("DIN-COOK", "Cookbooks and food heritage", "Diné with Pumpkins, 101 Lost Pumpkin Recipes, Three Sisters, CPT"),
    Module("DIN-KIDS", "Children's educational materials", "Books, garden kits, art, age-appropriate lessons"),
    Module("DIN-GAME", "Harvest games and festivals", "Scramble, safe yard games, sorting leagues, festivals"),
    Module("DIN-STORE", "Fundraising and supplies", "Bulk/POD products and approved tiered money-off/money-back"),
    Module("DIN-MEDIA", "Oral histories and archives", "Consent-based audio, video, archives, contributor rights"),
    Module("DIN-ATLAS", "Dinétah geographic research", "Maps, sources, timeline, user hypotheses clearly marked"),
    Module("DIN-WHITE-LABEL", "Optional nonprofit rebranding", "Tenant-controlled independent app activation"),
]
PRODUCT_FAMILIES = {
    "truck_drop": ["pumpkins", "winter squash", "produce crates", "plants", "mulch", "trees"],
    "print_on_demand": ["Diné with Pumpkins cookbook", "101 Lost Pumpkin Recipes", "Three Sisters learning book", "CPT cookbook", "congregation cookbook", "kids books", "recipe cards", "holiday wrap"],
    "learning_kits": ["corn-bean-squash garden kit", "soil and water journal", "harvest timeline", "history classroom kit"],
    "community": ["approved interviews", "harvest festivals", "recipe exchange", "garden badges", "scavenger hunt"],
}
def manifest():
    return {"modules": [asdict(x) for x in MODULES], "product_families": PRODUCT_FAMILIES,
            "publishing_policy": "DRAFT until provenance, consent, cultural review and rights cleared",
            "existing_infrastructure": "reference only; do not merge or overwrite"}
if __name__ == "__main__":
    print(json.dumps(manifest(), indent=2))
