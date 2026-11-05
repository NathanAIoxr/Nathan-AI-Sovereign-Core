#!/usr/bin/env python3
"""Read-only inspection of owner-selected local originals; never executes source."""
import argparse, collections, csv, hashlib, json, pathlib, sqlite3, zipfile
def inspect(path):
    result = {"path": str(path), "size_bytes": path.stat().st_size}
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for block in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(block)
    result["sha256"] = digest.hexdigest()
    result["byte_verified"] = True
    try:
        if zipfile.is_zipfile(path):
            with zipfile.ZipFile(path) as archive:
                result["archive_members"] = [{"name": i.filename, "bytes": i.file_size,
                    "compressed_bytes": i.compress_size, "crc32": i.CRC,
                    "encrypted": bool(i.flag_bits & 1)} for i in archive.infolist()]
                result["archive_payload_verified"] = False
        with path.open("rb") as source:
            signature = source.read(16)
        if signature == b"SQLite format 3\x00":
            connection = sqlite3.connect(path.resolve().as_uri() + "?mode=ro", uri=True)
            try:
                connection.execute("PRAGMA query_only=ON")
                tables = connection.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()
                result["tables"] = []
                for (name,) in tables:
                    quoted = '"' + name.replace('"', '""') + '"'
                    try:
                        count = connection.execute("SELECT COUNT(*) FROM " + quoted).fetchone()[0]
                        columns = connection.execute("PRAGMA table_info(" + quoted + ")").fetchall()
                        result["tables"].append({"name": name, "rows": count,
                            "columns": [{"name": c[1], "type": c[2]} for c in columns]})
                    except sqlite3.Error as error:
                        result["tables"].append({"name": name, "error": str(error)})
            finally:
                connection.close()
        suffix = path.suffix.lower()
        if suffix == ".csv":
            with path.open(encoding="utf-8-sig", newline="") as source:
                reader = csv.reader(source)
                result["csv_header"] = next(reader, [])
                result["csv_data_rows"] = sum(1 for _ in reader)
        if suffix in {".txt", ".md", ".py", ".js", ".html", ".css", ".sql"}:
            with path.open(encoding="utf-8") as source:
                text = source.read()
            result.update(text_characters=len(text), whitespace_words=len(text.split()),
                          text_lines=len(text.splitlines()))
        if suffix == ".json":
            with path.open(encoding="utf-8") as source:
                value = json.load(source)
            result["json_root_type"] = type(value).__name__
            result["json_root_items"] = len(value) if isinstance(value, (dict, list)) else None
        if suffix in {".png", ".jpg", ".jpeg", ".webp", ".gif", ".tiff"}:
            try:
                from PIL import Image
                with Image.open(path) as picture:
                    picture.verify()
                with Image.open(path) as picture:
                    result["image"] = {"width": picture.width, "height": picture.height,
                        "pixels_per_frame": picture.width * picture.height, "mode": picture.mode,
                        "frames": getattr(picture, "n_frames", 1), "structural_check": "passed",
                        "decoded_pixel_hash": None}
            except ImportError:
                result["image_inspection"] = "unavailable: install Pillow"
    except Exception as error:
        result["inspection_error"] = str(error)
    return result
def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("root", type=pathlib.Path)
    parser.add_argument("--output", required=True, type=pathlib.Path)
    args = parser.parse_args()
    root = args.root.resolve()
    if not root.is_dir():
        parser.error("root must be an existing directory")
    output = args.output.resolve()
    if output.is_relative_to(root):
        parser.error("output must be outside the inspected root")
    output.parent.mkdir(parents=True, exist_ok=True)
    count = 0
    with output.open("w", encoding="utf-8") as destination:
        for path in sorted(root.rglob("*")):
            if path.is_symlink() or not path.is_file():
                continue
            try:
                row = inspect(path)
            except Exception as error:
                row = {"path": str(path), "byte_verified": False, "error": str(error)}
            destination.write(json.dumps(row, ensure_ascii=False) + "\n")
            count += 1
    print(json.dumps({"files_attempted": count, "output": str(output)}))
if __name__ == "__main__":
    main()
