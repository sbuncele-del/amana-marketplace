"""Import public supplier catalogue snapshots; never place orders or collect payments."""
import json, math, re, urllib.request, time, sys, gzip, base64
from pathlib import Path
from html import unescape
from html.parser import HTMLParser
from datetime import datetime,timezone
class Text(HTMLParser):
 def __init__(self):super().__init__();self.parts=[]
 def handle_data(self,data):self.parts.append(data)
def text(html):
 p=Text();p.feed(html or '');return re.sub(r'\s+',' ',unescape(' '.join(p.parts))).strip()
root=Path(__file__).resolve().parents[1]
packed=[root/f'src/data/catalogue-packed-{i}.json' for i in range(8)]
source=json.loads(gzip.decompress(base64.b64decode(''.join(json.loads(p.read_text()) for p in packed)))) if packed[0].exists() else json.loads((root/'src/data/catalogue.json').read_text())
safety=root/'src/data/personal-safety.json'
if safety.exists():source.extend(json.loads(safety.read_text()))
existing={p['slug']:p for p in source}
collection=sys.argv[1] if len(sys.argv)>1 else 'kitchen-dining'
category_name={'health-beauty':'Health & Beauty','security':'Personal Safety & Security','toys-kids-baby':'Kids, Toys & Baby'}.get(collection,'Kitchen & Dining')
all_products=[];page=1
while True:
 url=f'https://perfectdealz.co.za/collections/{collection}/products.json?limit=250&page={page}'
 with urllib.request.urlopen(url,timeout=60) as response:products=json.load(response)['products']
 print(f'Page {page}: {len(products)} products',flush=True)
 if not products:break
 all_products.extend(products);page+=1
 if page>30:raise RuntimeError('Unexpected pagination size')
 time.sleep(.25)
seen=set();out=[];costs=[]
for p in all_products:
 if collection=='security' and re.search(r'stun.?gun|taser|pepper.?spray|firearm|pistol|rifle|baton|knuckle',p['title'],re.I):continue
 if p['handle'] in seen:continue
 seen.add(p['handle'])
 variants=p.get('variants',[])
 if not variants:raise ValueError('Missing variants: '+p['handle'])
 raw=[]
 for v in variants:
  cost=float(v['price']);previous=existing.get(p['handle'])
  # Apply the launch retail pricing rule; retain previously agreed item prices.
  price=math.ceil((max(cost*1.35,cost+50)-9)/10)*10+9
  raw.append({'id':str(v['id']),'title':'Standard' if v['title']=='Default Title' else v['title'],'price':price,'supplierAvailable':bool(v.get('available'))})
 images=[i['src'] for i in p.get('images',[])[:5]]
 previous=existing.get(p['handle'])
 images=previous['images'] if previous else images
 description=text(p.get('body_html'))
 tags=p.get('tags',[])
 if isinstance(tags,str):tags=[x.strip() for x in tags.split(',')]
 item={'id':p['handle'],'slug':p['handle'],'name':p['title'],'price':min(v['price'] for v in raw),'priceOnRequest':False,'currency':'ZAR','images':images,'colours':[v['title'] for v in raw],'variants':raw,'sku':variants[0].get('sku') or '', 'description':description[:550] if description else 'Product supplied locally. Ask Amana to confirm specifications, availability and the delivered price before payment.','details':description,'category':{'name':category_name,'slug':collection},'collections':[collection]+(['home-living'] if collection=='kitchen-dining' else [])+(['air-fryers'] if re.search(r'air[ -]?fryer',p['title'],re.I) else []),'originCountry':'South Africa','seller':{'name':'Amana Marketplace','country':'South Africa','sellerProfile':{'storeName':'Amana Marketplace','storeSlug':'amana','trustScore':0,'isVerified':False}},'stock':0,'supplierAvailable':any(v['supplierAvailable'] for v in raw),'avgRating':0,'reviewCount':0,'totalSold':0,'fulfilmentStatus':'Supplier-listed availability; reconfirm before payment','deliveryNote':'Estimated 3–7 business days after supplier payment. Delivery cost confirmed before payment.','specifications':[],'sourceCheckedAt':datetime.now(timezone.utc).isoformat(),'sourceUrl':'https://perfectdealz.co.za/products/'+p['handle']}
 if previous:item['collections']=list(dict.fromkeys(previous['collections']+item['collections']))
 out.append(item)
 costs.append({'slug':p['handle'],'variants':[{'id':str(v['id']),'title':v['title'],'sku':v.get('sku'),'cost':float(v['price']),'grams':v.get('grams'),'available':bool(v.get('available'))} for v in variants]})
if collection=='security':
 (root/'src/data/personal-safety.json').write_text(json.dumps(out,ensure_ascii=False,separators=(',',':'))+'\n')
elif collection=='toys-kids-baby':
 encoded=base64.b64encode(gzip.compress(json.dumps(out,ensure_ascii=False).encode(),mtime=0)).decode()
 chunk=math.ceil(len(encoded)/4)
 for i in range(4):(root/f'src/data/kids-packed-{i}.json').write_text(json.dumps(encoded[i*chunk:(i+1)*chunk])+'\n')
else:
 # Preserve products belonging to other collections.
 for slug,p in existing.items():
  if slug not in seen:out.append(p)
 encoded=base64.b64encode(gzip.compress(json.dumps(out,ensure_ascii=False).encode(),mtime=0)).decode()
 chunk=math.ceil(len(encoded)/8)
 for i,p in enumerate(packed):p.write_text(json.dumps(encoded[i*chunk:(i+1)*chunk])+'\n')
(root/f'src/data/sourcing/perfect-dealz-{collection}-costs.json').write_text(json.dumps({'checkedAt':datetime.now(timezone.utc).isoformat(),'collectionUrl':'https://perfectdealz.co.za/collections/'+collection,'products':costs},ensure_ascii=False,indent=2)+'\n')
# Legacy cart snapshot is unused by the live cart.
(root/'src/data/cart-catalogue.json').write_text(json.dumps([{k:p[k] for k in ['id','slug','name','price','priceOnRequest','images','colours','variants','supplierAvailable']} for p in out],ensure_ascii=False)+'\n')
print(json.dumps({'supplierProducts':len(seen),'catalogueProducts':len(out),'supplierAvailable':sum(p['supplierAvailable'] for p in out),'quoteOnly':sum(p['priceOnRequest'] for p in out)}),flush=True)
