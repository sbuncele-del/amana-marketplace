"""Reconcile saved public supplier feeds with the complete imported catalogue.
Run after downloading every collection page into the supplied directory.
Refuses incomplete collection pagination; does not delete retained products.
"""
import base64,gzip,json,math,re,sys
from pathlib import Path
from datetime import datetime,timezone
from html import unescape
from html.parser import HTMLParser
ROOT=Path(__file__).resolve().parents[1]
class Text(HTMLParser):
 def __init__(self):super().__init__();self.parts=[]
 def handle_data(self,data):self.parts.append(data)
def clean(value):
 t=Text();t.feed(value or '');return re.sub(r'\s+',' ',unescape(' '.join(t.parts))).strip()
def unpack(prefix):
 files=sorted((ROOT/'src/data').glob(prefix+'-*.json'),key=lambda p:int(p.stem.rsplit('-',1)[1]))
 return json.loads(gzip.decompress(base64.b64decode(''.join(json.loads(p.read_text()) for p in files))))
def main(folder):
 folder=Path(folder);collections=json.loads((folder/'collections.json').read_text())['collections']
 existing={p['slug']:p for p in unpack('catalogue-packed')+json.loads((ROOT/'src/data/personal-safety.json').read_text())+unpack('kids-packed')+unpack('departments-packed')+(unpack('supplier-refresh-packed') if list((ROOT/'src/data').glob('supplier-refresh-packed-*.json')) else [])}
 excluded=re.compile(re.search(r'const excluded = /(.*)/i;', (ROOT/'src/lib/catalogue-eligibility.ts').read_text()).group(1),re.I)
 source={};members={};coverage=[]
 for c in collections:
  h=c['handle']
  if h in ['best-sellers','new-arrivals']:continue
  pages=sorted(folder.glob(f'collection-{h}-*.json'),key=lambda p:int(p.stem.rsplit('-',1)[1]));count=0
  if not pages:raise ValueError('Missing collection: '+h)
  for n,f in enumerate(pages,1):
   if int(f.stem.rsplit('-',1)[1])!=n:raise ValueError('Missing page: '+h)
   products=json.loads(f.read_text())['products'];count+=len(products)
   for p in products:source[p['handle']]=p;members.setdefault(p['handle'],set()).add(h)
   if len(products)<250:break
  else:raise ValueError('Missing terminal page: '+h)
  coverage.append({'collection':h,'publicFeedProducts':count,'advertisedCount':c['products_count']})
 # Include global-feed products absent from merchandising collections.
 for f in sorted(folder.glob('products-*.json'),key=lambda p:int(p.stem.rsplit('-',1)[1])):
  for p in json.loads(f.read_text())['products']:source.setdefault(p['handle'],p)
 departments=json.loads((ROOT/'src/data/departments.json').read_text());known={d['slug']:d['name'] for d in departments}
 added=[];skipped=[];updated={p['slug']:p for p in (unpack('supplier-refresh-packed') if list((ROOT/'src/data').glob('supplier-refresh-packed-*.json')) else [])};now=datetime.now(timezone.utc).isoformat()
 for h,p in source.items():
  if excluded.search(p['title']) or h == 'assembly-service':skipped.append(h);continue
  collection=sorted(members.get(h,set()))
  parents={'baby-essentials':'toys-kids-baby','toys-games':'toys-kids-baby','educational-toys':'toys-kids-baby','kids-accessories':'toys-kids-baby','ride-ons':'toys-kids-baby','beauty-skincare':'health-beauty','personal-care':'health-beauty','health-care':'health-beauty','shapewear':'health-beauty'}
  collection=sorted(set(collection)|{parents[c] for c in collection if c in parents})
  overrides={'gold-metal-mirror-decor-tray-medium': 'home-decor-gifts', 'rectangle-mirror-vanity-tray-medium-size': 'home-decor-gifts', 'golden-round-style-mirror-tray-medium-size': 'home-decor-gifts', '12v-14ah-gel-battery': 'backup-power', 'portable-mesh-nebulizer': 'health-beauty', 'satin-sleeping-bonnet-night-cap': 'health-beauty', '1-in-1-out-combiner-box-with-surge-protection-breaker': 'electrical-accessories', 'glove-with-built-in-flashlight': 'tools', '100-piece-multifunction-drill-bit-kit-for-wood-metal-and-concrete': 'tools', '3-plates-suction-glass-lifter': 'tools', 'portable-electric-shoe-dryer-machine': 'cleaning-laundry', 'preschool-workbooks-in-maths-and-english-for-kids': 'toys-kids-baby', 'portable-baby-booster-seat-harness': 'toys-kids-baby', 'pest-repelling-aid': 'garden-outdoor', 'kiddies-moon-folding-chair': 'furniture', 'portable-wearable-electric-heated-shawl-blanket': 'bed-bath', 'de-rust-lubricating-spray': 'car-care-tools', 'custom-printing-men-tie-dye-sweatshirt': 'clothing-accessories', 'hd-4k-photography-drone': 'electronics', 'aluminium-portable-laptop-stand': 'electronics', 'air-fryer-silicone-liner': 'kitchen-dining', 'plastic-fish-scale-remover': 'kitchen-dining', 'stainless-steel-2-tier-chocolate-fountain': 'kitchen-dining', '5l-luxury-stainless-steel-silver-buffet-chafing-dish': 'kitchen-dining', '16-piece-tabletop-spice-rack': 'kitchen-dining', 'fragile-warning-packing-tape': 'stationery-office-supplies'}
  if not collection and h in overrides:collection=[overrides[h]]
  relevant=[c for c in collection if c in known]
  if h in existing:
   continue
  variants=[]
  for v in p['variants']:
   cost=float(v['price'])
   if not math.isfinite(cost) or cost<=0:continue
   variants.append({'id':str(v['id']),'title':'Standard' if v['title']=='Default Title' else v['title'],'price':math.ceil((max(cost*1.35,cost+50)-9)/10)*10+9,'supplierAvailable':bool(v.get('available'))})
  images=[i['src'] for i in p.get('images',[])[:5] if i['src'].startswith('https://')]
  if not images or not variants:raise ValueError('Missing usable product data: '+h)
  if not relevant:raise ValueError('Missing department mapping: '+h)
  category='furniture' if 'furniture' in relevant else relevant[0];description=clean(p.get('body_html'))
  item={'id':h,'slug':h,'name':p['title'],'price':min(v['price'] for v in variants),'priceOnRequest':False,'currency':'ZAR','images':images,'colours':[v['title'] for v in variants],'variants':variants,'sku':p['variants'][0].get('sku') or '', 'description':description[:550] or p['title'],'details':description,'category':{'name':known[category],'slug':category},'collections':collection,'originCountry':'South Africa','seller':{'name':'Plentovo','country':'South Africa','sellerProfile':{'storeName':'Plentovo','storeSlug':'plentovo','trustScore':0,'isVerified':False}},'stock':0,'supplierAvailable':any(v['supplierAvailable'] for v in variants),'avgRating':0,'reviewCount':0,'totalSold':0,'fulfilmentStatus':'Supplier-listed availability','deliveryNote':'Furniture handling: 0–5 business days; other items: 0–2 business days. Transit: 3–5 business days.','specifications':[],'sourceCheckedAt':now,'sourceUrl':'https://perfectdealz.co.za/products/'+h}
  existing[h]=item;updated[h]=item;added.append({'slug':h,'name':p['title'],'collections':collection})
 eligible=[p for p in existing.values() if not excluded.search(p['name'])]
 raw=json.dumps(list(updated.values()),ensure_ascii=False,separators=(',',':')).encode();encoded=base64.b64encode(gzip.compress(raw,mtime=0)).decode();parts=max(1,math.ceil(len(encoded)/40000));size=math.ceil(len(encoded)/parts)
 for i in range(parts):(ROOT/f'src/data/supplier-refresh-packed-{i}.json').write_text(json.dumps(encoded[i*size:(i+1)*size])+'\n')
 imports='\n'.join(f"import part{i} from './supplier-refresh-packed-{i}.json';" for i in range(parts))
 (ROOT/'src/data/supplier-refresh-catalogue.ts').write_text(imports+"\nimport {gunzipSync} from 'node:zlib';\nimport type snapshot from './catalogue.json';\nexport default JSON.parse(gunzipSync(Buffer.from(["+','.join(f'part{i}' for i in range(parts))+"].join(''),'base64')).toString('utf8')) as typeof snapshot;\n")
 for d in departments:d['count']=sum(d['slug'] in p['collections'] for p in eligible)
 (ROOT/'src/data/departments.json').write_text(json.dumps(departments,ensure_ascii=False,indent=2)+'\n')
 report={'checkedAt':now,'sourceUnique':len(source),'sourceExcluded':len(skipped),'addedCount':len(added),'eligibleCatalogueTotal':len(eligible),'retainedAbsentFromCurrentFeeds':sorted(set(existing)-set(source)),'coverage':coverage,'added':added,'excluded':skipped}
 (ROOT/'src/data/sourcing/perfect-dealz-coverage.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({k:v for k,v in report.items() if k not in ['added','excluded','coverage']}))
if __name__=='__main__':main(sys.argv[1])
