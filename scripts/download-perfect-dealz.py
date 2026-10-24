"""Download a fresh, complete public feed snapshot; then run reconcile-perfect-dealz.py DIR."""
import concurrent.futures,json,pathlib,sys,urllib.request,time
folder=pathlib.Path(sys.argv[1]);folder.mkdir(parents=True,exist_ok=False)
def read(path):
 for attempt in range(3):
  try:
   with urllib.request.urlopen('https://perfectdealz.co.za'+path,timeout=45) as response:return json.load(response)
  except Exception:
   if attempt==2:raise
   time.sleep(2)
collections=read('/collections.json?limit=250');(folder/'collections.json').write_text(json.dumps(collections))
if len(collections['collections'])==250:raise ValueError('Collection pagination requires review')
def download(handle):
 for page in range(1,101):
  path=f'/collections/{handle}/products.json' if handle else '/products.json'
  data=read(path+f'?limit=250&page={page}')
  assert isinstance(data['products'],list)
  name=f'collection-{handle}-{page}' if handle else f'products-{page}'
  (folder/(name+'.json')).write_text(json.dumps(data))
  if len(data['products'])<250:return handle
 raise ValueError('Product pagination limit exceeded')
handles=[c['handle'] for c in collections['collections'] if c['handle'] not in ['best-sellers','new-arrivals']]+['']
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
 for handle in pool.map(download,handles):print('Complete:',handle or 'global',flush=True)
