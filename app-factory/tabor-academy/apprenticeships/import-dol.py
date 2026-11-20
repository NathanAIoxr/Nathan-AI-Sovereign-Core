"""Build the published U.S. Department of Labor occupation snapshot from its workbook."""
import base64
import gzip
import hashlib
import json
import sys
from pathlib import Path

from openpyxl import load_workbook


def export_snapshot(path, retrieved):
    source = Path(path)
    workbook = load_workbook(source, read_only=True, data_only=True)
    try:
        sheet = workbook["Approved Occupations"]
        header, *rows = sheet.values
    finally:
        workbook.close()

    expected = (
        "RAPIDS CODE", "ONET SOC CODE", "RAPIDS TITLE", "ONET SOC TITLE",
        "OCCUPATION TYPE", "Version", "MINIMUM TERM-LENGTH", "MAXIMUM TERM-LENGTH",
        "BULLETINS", "CAREER LATICE",
    )
    if header != expected:
        raise ValueError("The source workbook headings have changed. Review before importing.")
    records = [[str(value) if value is not None else "" for value in row]
               for row in rows if any(value not in ("", None) for value in row)]
    if not records or any(not row[2] for row in records):
        raise ValueError("The workbook has a missing occupation title or no records.")
    grouped = {}
    for code, soc, title, soc_title, *terms in records:
        grouped.setdefault((code, title), []).append([soc, soc_title, *terms])
    groups = [[code, title, terms] for (code, title), terms in grouped.items()]
    data = json.dumps(groups, ensure_ascii=False, separators=(",", ":")).encode()
    compressed = base64.b64encode(gzip.compress(data, mtime=0)).decode()
    summary = {
        "retrieved": retrieved, "rows": len(records), "entries": len(groups),
        "distinctCodes": len({row[0] for row in records if row[0]}),
        "rowsWithoutCode": sum(not row[0] for row in records),
        "sha256": hashlib.sha256(source.read_bytes()).hexdigest(),
        "source": "https://www.apprenticeship.gov/sites/default/files/wps/approved-occupations.xlsx",
    }
    print("// Generated from the published U.S. Department of Labor workbook by import-dol.py.")
    print("export const occupationSnapshot = " + json.dumps(summary, ensure_ascii=False) + ";")
    print("export const occupationsGzip = " + json.dumps(compressed) + ";")


if __name__ == "__main__":
    export_snapshot(*sys.argv[1:])
