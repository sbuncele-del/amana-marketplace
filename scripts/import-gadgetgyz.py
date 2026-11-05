"""Build the Gadgetgyz catalogue snapshot from the dropshipper feed CSV (path argument). Never places orders; wholesale costs are not written to the repo."""
import csv, json, math, re, sys, gzip, base64
from html import unescape
from pathlib import Path
from datetime import datetime, timezone
root = Path(__file__).resolve().parents[1]
src = Path(sys.argv[1])
SMART, STANDARD = 0.35, 0.15
MIN_COST = 50   # below this the 15% margin is under R8, not worth handling
def clean(t): return re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', unescape(t or ''))).strip()
def slugify(permalink, sku):
    s = permalink.rstrip('/').split('/')[-1]
    return 'gg-' + (s or sku.lower())
smart_cat = re.compile(r'Smart Home|Smart Lighting|Smart Cameras|Smart Appliances|Smart Sensors|Wi-Fi cameras', re.I)
smart_name = re.compile(r'smart\s+(?:wifi\s+)?(?:bulb|light|lamp|plug|lock|led)', re.I)
parts = re.compile(r'\b(?:filter|brush|mop pad|brush cover|disposable bag|side brush|spare|replacement|bracket|mounting|cable|case|cover)\b', re.I)
wear = re.compile(r'watch|smart band|fitness tracker|charger for', re.I)
b2b = re.compile(r'conferenc|video audio|commercial display|kiosk', re.I)
dept_rules = [
 ('stationery-office-supplies', r'board|marker|stapler|dispenser|sign\b|signs|whiteboard|stationery|folder|pen\b|paper|label'),
 ('kitchen-dining', r'kitchen|air fryer|blender|kettle|cookware'),
 ('health-beauty', r'grooming|shaver|trimmer|hair|beauty'),
 ('tools', r'\btools?\b|drill|screwdriver'),
 ('security', r'security|camera|cctv|alarm'),
 ('backup-power', r'power bank|ups\b|inverter'),
 ('lighting-lamps', r'bulb|lamp|lighting|light\b'),
 ('cleaning-laundry', r'vacuum|mop|clean'),
 ('home-decor-gifts', r'wall tile|glass wall|decor'),
 ('toys-kids-baby', r'educational|toy|kids'),
]
def dept(name, cat):
    text = f'{name} {cat}'
    for slug, pat in dept_rules:
        if re.search(pat, text, re.I): return slug
    return 'electronics'
rows = [r for r in csv.DictReader(src.open(encoding='utf-8-sig'))]
out, seen, stats = [], set(), {'sale': 0, 'smart': 0, 'standard': 0}
for r in rows:
    try: cost, reg = float(r['price']), float(r['regular_price'] or 0)
    except ValueError: continue
    name = clean(unescape(r['name']))
    if r['stock_status'] != 'instock' or cost <= 0 or not r['image'] or cost < MIN_COST or b2b.search(name): continue
    gap = 1 - cost / reg if reg else 0
    on_sale = not (0.0665 <= gap <= 0.0755)   # public price is the feed price, so no wholesale margin unless we list the original
    floor = math.ceil(cost * (1 + STANDARD))
    smart = (smart_cat.search(r['category']) or smart_name.search(name)) and not parts.search(name) and not wear.search(name) and reg < 2000
    if on_sale:
        price, kind = max(math.ceil(reg), floor), 'sale'
    elif smart:
        price, kind = math.ceil(cost * (1 + SMART)), 'smart'
    else:
        price, kind = floor, 'standard'
    assert price >= floor
    slug = slugify(r['permalink'], r['sku'])
    if slug in seen: continue
    seen.add(slug); stats[kind] += 1
    category = clean(unescape(r['category'].split(',')[0])); d = dept(name, category)
    qty = r.get('stock_quantity')
    desc = clean(r['description']) or name
    out.append({'id': slug, 'slug': slug, 'name': name, 'price': price, 'priceOnRequest': False, 'currency': 'ZAR', 'images': [r['image']], 'colours': ['Standard'],
        'variants': [{'id': r['sku'], 'title': 'Standard', 'price': price, 'supplierAvailable': True}], 'sku': r['sku'], 'description': desc[:550], 'details': desc,
        'category': {'name': category, 'slug': d}, 'collections': [d], 'originCountry': 'South Africa',
        'seller': {'name': 'Plentovo', 'country': 'South Africa', 'sellerProfile': {'storeName': 'Plentovo', 'storeSlug': 'plentovo', 'trustScore': 0, 'isVerified': False}},
        'stock': 0, 'supplierAvailable': True, 'avgRating': 0, 'reviewCount': 0, 'totalSold': 0,
        'fulfilmentStatus': 'Supplier-listed availability; reconfirm before payment',
        'deliveryNote': 'Estimated 3–7 business days after supplier payment. Delivery cost confirmed before payment.', 'specifications': [],
        'sourceCheckedAt': datetime.now(timezone.utc).isoformat(), 'sourceUrl': r['permalink']})
encoded = base64.b64encode(gzip.compress(json.dumps(out, ensure_ascii=False, separators=(',', ':')).encode(), mtime=0)).decode()
n = max(1, math.ceil(len(encoded) / 400000)); size = math.ceil(len(encoded) / n)
for old in (root / 'src/data').glob('gadgetgyz-packed-*.json'): old.unlink()
for i in range(n): (root / f'src/data/gadgetgyz-packed-{i}.json').write_text(json.dumps(encoded[i*size:(i+1)*size]) + '\n')
imports = '\n'.join(f"import part{i} from './gadgetgyz-packed-{i}.json';" for i in range(n))
(root / 'src/data/gadgetgyz-catalogue.ts').write_text(imports + "\nimport {gunzipSync} from 'node:zlib';\nimport type snapshot from './catalogue.json';\nexport default JSON.parse(gunzipSync(Buffer.from([" + ','.join(f'part{i}' for i in range(n)) + "].join(''),'base64')).toString('utf8')) as typeof snapshot;\n")
print(json.dumps({'products': len(out), 'parts': n, **stats}))
