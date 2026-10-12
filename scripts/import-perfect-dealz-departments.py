"""Build retail department snapshots from downloaded public collection feeds."""
import json,gzip,base64,math,re,sys
from pathlib import Path
from datetime import datetime,timezone
from html import unescape
from html.parser import HTMLParser
root=Path(__file__).resolve().parents[1]
folder=Path(sys.argv[1] if len(sys.argv)>1 else '/tmp/amana-department-feeds')
class Text(HTMLParser):
 def __init__(self):super().__init__();self.parts=[]
 def handle_data(self,data):self.parts.append(data)
def clean(html):
 p=Text();p.feed(html or '');return re.sub(r'\s+',' ',unescape(' '.join(p.parts))).strip()
def packed(prefix,n):return json.loads(gzip.decompress(base64.b64decode(''.join(json.loads((root/f'src/data/{prefix}-{i}.json').read_text()) for i in range(n)))))
base=packed('catalogue-packed',8)+json.loads((root/'src/data/personal-safety.json').read_text())+packed('kids-packed',4)
excluded_pattern=re.compile('stun[\\s-]*gun|taser|pepper.?spray|\\bfirearm\\b|\\bbaton\\b|knuckle.?knife|knuckle.?duster|brass.?knuckle|rifle.?scope|riflescope|gun.?laser|gun.?cleaning|pistol.?light|(?:tactical|hunting|karambit|kerambit).*knife|knife.*(?:tactical|hunting|karambit|kerambit)|credit.?card.*knife',re.I)
products={p['slug']:p for p in base if not excluded_pattern.search(p['name'])};additional={};excluded=[]
ranked=json.loads((folder/'ranked.json').read_text())
for dept in ranked:
 slug=dept['slug'];accepted=0
 for source in json.loads((folder/f'{slug}.json').read_text()):
  # Keep weapon products out of the retail catalogue.
  if excluded_pattern.search(source['title']):
   excluded.append(source['handle']);continue
  accepted+=1;handle=source['handle']
  if handle in products:
   item=products[handle];item['collections']=list(dict.fromkeys(item['collections']+[slug]));additional[handle]=item;continue
  variants=[{'id':str(v['id']),'title':'Standard' if v['title']=='Default Title' else v['title'],'price':math.ceil((max(float(v['price'])*1.35,float(v['price'])+50)-9)/10)*10+9,'supplierAvailable':bool(v.get('available'))} for v in source['variants']]
  images=[i['src'] for i in source.get('images',[])[:5]]
  if not images or not variants:raise ValueError('Missing images/variants: '+handle)
  description=clean(source.get('body_html'))
  item={'id':handle,'slug':handle,'name':source['title'],'price':min(v['price'] for v in variants),'priceOnRequest':False,'currency':'ZAR','images':images,'colours':[v['title'] for v in variants],'variants':variants,'sku':source['variants'][0].get('sku') or '', 'description':description[:550] or 'Discover this product from Amana Marketplace.','details':description,'category':{'name':dept['name'],'slug':slug},'collections':[slug],'originCountry':'South Africa','seller':{'name':'Amana Marketplace','country':'South Africa','sellerProfile':{'storeName':'Amana Marketplace','storeSlug':'amana','trustScore':0,'isVerified':False}},'stock':0,'supplierAvailable':any(v['supplierAvailable'] for v in variants),'avgRating':0,'reviewCount':0,'totalSold':0,'fulfilmentStatus':'Supplier-listed availability; reconfirm before payment','deliveryNote':'Estimated 3–7 business days after supplier payment. Delivery cost confirmed before payment.','specifications':[],'sourceCheckedAt':datetime.now(timezone.utc).isoformat(),'sourceUrl':'https://perfectdealz.co.za/products/'+handle}
  products[handle]=item;additional[handle]=item
 print(f"Imported {dept['name']}: {accepted} supplier products",flush=True)
encoded=base64.b64encode(gzip.compress(json.dumps(list(additional.values()),ensure_ascii=False,separators=(',',':')).encode(),mtime=0)).decode()
parts=max(1,math.ceil(len(encoded)/400000));size=math.ceil(len(encoded)/parts)
for i in range(parts):(root/f'src/data/departments-packed-{i}.json').write_text(json.dumps(encoded[i*size:(i+1)*size])+'\n')
imports='\n'.join(f"import part{i} from './departments-packed-{i}.json';" for i in range(parts))
loader=imports+"\nimport {gunzipSync} from 'node:zlib';\nimport type snapshot from './catalogue.json';\nexport default JSON.parse(gunzipSync(Buffer.from(["+','.join(f'part{i}' for i in range(parts))+"].join(''),'base64')).toString('utf8')) as typeof snapshot;\n"
(root/'src/data/additional-catalogue.ts').write_text(loader)
icons={'electronics':'📱','home-living':'🏠','clothing-accessories':'👗','tools':'🛠️','garden-outdoor':'🌿','stationery-office-supplies':'✏️','fitness-exercise':'🏋️','furniture':'🛋️','bed-bath':'🛏️','lighting-lamps':'💡','backup-power':'🔋','cleaning-laundry':'🧹','camping-braai-picnic':'🏕️'}
names={d['slug']:d['name'] for d in ranked};names.update({'kitchen-dining':'Kitchen & Dining','air-fryers':'Air Fryers','health-beauty':'Health & Beauty','security':'Personal Safety & Security','toys-kids-baby':'Kids, Toys & Baby'})
nav=[{'slug':s,'name':name,'count':sum(s in p['collections'] for p in products.values()),'icon':icons.get(s,'🛍️')} for s,name in names.items()]
nav.sort(key=lambda d:-d['count'])
(root/'src/data/departments.json').write_text(json.dumps(nav,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'uniqueProducts':len(products),'additionalRecords':len(additional),'compressedParts':parts,'excluded':sorted(set(excluded)),'departments':nav}),flush=True)
