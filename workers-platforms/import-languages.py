"""Generate idempotent Cloudflare D1 import SQL from the pinned Glottolog CLDF release."""
import argparse
import csv
import hashlib
import io
from pathlib import Path
import urllib.request

URL = "https://raw.githubusercontent.com/glottolog/glottolog-cldf/v5.4/cldf/languages.csv"
SHA256 = "ecadbfd440f3d0c28182f676b7e49c6e38fd3d40774c7ae3d90bf28ca137fe90"

def sql(value):
    return "'" + value.replace("'", "''") + "'" if value else "NULL"

def year(value):
    return str(int(value)) if value and value.lstrip("-").isdigit() else "NULL"

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("output", type=Path)
    parser.add_argument("--csv", type=Path)
    args = parser.parse_args()
    if args.csv:
        content = args.csv.read_bytes()
    else:
        with urllib.request.urlopen(URL, timeout=30) as response:
            content = response.read()
    if hashlib.sha256(content).hexdigest() != SHA256:
        raise SystemExit("Glottolog source checksum mismatch")
    records = list(csv.DictReader(io.StringIO(content.decode("utf-8-sig"))))
    sign_ids = {row["ID"] for row in records if row["Family_ID"] == "sign1238"}
    with args.output.open("w", encoding="utf-8") as out:
        out.write(Path(__file__).with_name("languages.sql").read_text())
        for i in range(0, len(records), 100):
            values = []
            for row in records[i:i + 100]:
                fields = [sql(row[column]) for column in (
                    "ID", "Name", "Level", "ISO639P3code", "Family_ID",
                    "Language_ID", "Macroarea",
                )]
                fields.extend([
                    year(row["First_Year_Of_Documentation"]),
                    year(row["Last_Year_Of_Documentation"]),
                    str(int(row["ID"] in sign_ids or row["Language_ID"] in sign_ids)),
                ])
                values.append("(" + ",".join(fields) + ")")
            out.write("INSERT OR REPLACE INTO languoid VALUES\n" + ",\n".join(values) + ";\n")
        out.write(f"INSERT OR REPLACE INTO catalog_release VALUES ('glottolog-cldf-v5.4',{len(records)});\n")

if __name__ == "__main__":
    main()
