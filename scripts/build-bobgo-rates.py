"""Turn a Bob Go rate-card export (local / main / regional CSVs, prices incl. VAT) into src/data/delivery/bobgo-rates.json.

    python3 scripts/build-bobgo-rates.py <folder with the three CSVs> <rate card name> <export date YYYY-MM-DD>

Prices are stored in cents. A blank or "N/A" cell means that service does not carry that weight or zone.
"""
import csv, glob, json, os, sys

folder, name, exported = sys.argv[1], sys.argv[2], sys.argv[3]
zones = {}
for zone in ("local", "main", "regional"):
    path = glob.glob(os.path.join(folder, f"*_{zone}_*.csv"))
    if len(path) != 1:
        sys.exit(f"Expected exactly one {zone} CSV in {folder}")
    rows = list(csv.reader(open(path[0], encoding="utf-8-sig")))
    couriers, codes = rows[0][1:], [c.split(" (")[0].strip() for c in rows[1][1:]]
    table = []
    for r in rows[2:]:
        if not r or not r[0].strip():
            continue
        cells = [None if v.strip() in ("", "N/A") else round(float(v) * 100) for v in r[1:]]
        table.append([float(r[0]), cells])
    zones[zone] = {"services": [[c, s] for c, s in zip(couriers, codes)], "rows": table}
out = {"rateCard": name, "exportedOn": exported, "currency": "ZAR", "vatIncluded": True, "zones": zones}
target = os.path.join(os.path.dirname(__file__), "..", "src", "data", "delivery", "bobgo-rates.json")
json.dump(out, open(target, "w"), separators=(",", ":"))
print("wrote", os.path.normpath(target), {z: len(v["rows"]) for z, v in zones.items()})
