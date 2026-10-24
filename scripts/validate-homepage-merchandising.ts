import {readFileSync,readdirSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {merchandisingSchema,readMerchandising} from '../src/lib/homepage-merchandising';
import {isRetailProduct} from '../src/lib/catalogue-eligibility';
const dir=new URL('../src/data/',import.meta.url);
function packed(prefix:string){const files=readdirSync(dir).filter(f=>f.startsWith(prefix+'-')&&f.endsWith('.json')).sort((a,b)=>Number(a.split('-').at(-1)?.split('.')[0])-Number(b.split('-').at(-1)?.split('.')[0]));return JSON.parse(gunzipSync(Buffer.from(files.map(f=>JSON.parse(readFileSync(new URL(f,dir),'utf8'))).join(''),'base64')).toString());}
const products=[...packed('catalogue-packed'),...JSON.parse(readFileSync(new URL('personal-safety.json',dir),'utf8')),...packed('kids-packed'),...packed('departments-packed'),...packed('supplier-refresh-packed')];
const catalogue=new Map(products.filter(p=>isRetailProduct(p.name)).map(p=>[p.slug,p]));
const config=merchandisingSchema.parse(JSON.parse(readFileSync(new URL('homepage-merchandising.json',dir),'utf8')));
const departments=new Set(JSON.parse(readFileSync(new URL('departments.json',dir),'utf8')).map((d:{slug:string})=>d.slug));
if(new Set(config.products.map(p=>p.slug)).size!==config.products.length)throw Error('Duplicate product handles');
if(config.departmentOrder.some(d=>!departments.has(d)))throw Error('Unknown department');
if(config.products.length&&!readMerchandising(config)?.products.length)throw Error('No fresh demand evidence');
for(const item of config.products){const product=catalogue.get(item.slug);if(!product||!product.images.length||product.currency!=='ZAR')throw Error('Unknown or unsuitable product: '+item.slug);}
console.log('Homepage merchandising validated: '+config.products.length+' ranked product candidates');
