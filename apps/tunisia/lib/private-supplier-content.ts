import 'server-only';
import {unstable_cache} from 'next/cache';
import {gzip,gunzip} from 'node:zlib';
import {promisify} from 'node:util';
import {Pool} from 'pg';
import {bindAccountContent,type AccountBinding} from './shipper-content';
import type {SupplierContent} from './shipper-normalise';
let pool:Pool|undefined;
type MetadataRow={name:string;payload:unknown};
const pack=promisify(gzip),unpack=promisify(gunzip);
const interval=60*60*1000,retryInterval=5*60*1000;
let metadata:MetadataRow[]|undefined,nextRead=0,pending:Promise<MetadataRow[]>|undefined;
const chunkSize=128;
const cacheOptions={revalidate:3600,tags:['tunisia-shipper-metadata']};
function database(){
 const connectionString=process.env.DATABASE_URL||process.env.POSTGRES_URL;
 if(!connectionString)return null;
 return pool??=new Pool({connectionString,max:2,idleTimeoutMillis:10000,connectionTimeoutMillis:10000});
}
type Manifest={name:string;version:string;count:number};
const readManifest=unstable_cache(async()=>{
 const db=database();if(!db)return [];
 const result=await db.query<Manifest>(
  "SELECT name,xmin::text AS version,jsonb_array_length(payload) AS count FROM public.plentovo_tn_catalogue_metadata WHERE name IN ('bindings','content') AND jsonb_typeof(payload)='array'");
 return result.rows;
},['tunisia-supplier-metadata-manifest-v3'],cacheOptions);
const readChunk=unstable_cache(async(name:string,version:string,offset:number,limit:number)=>{
 const db=database();if(!db)throw new Error('Metadata database unavailable');
 const result=await db.query<{entry:unknown}>(
  'SELECT element.entry FROM public.plentovo_tn_catalogue_metadata m CROSS JOIN LATERAL jsonb_array_elements(m.payload) WITH ORDINALITY AS element(entry,n) WHERE m.name=$1 AND m.xmin::text=$2 AND element.n>$3::integer AND element.n<=$3::integer+$4::integer ORDER BY element.n',
  [name,version,offset,limit]);
 if(result.rows.length!==limit)throw new Error('Metadata changed during refresh');
 return (await pack(JSON.stringify(result.rows.map(row=>row.entry)))).toString('base64');
},['tunisia-supplier-metadata-chunk-v3'],cacheOptions);
async function readPackedMetadata():Promise<MetadataRow[]>{
 const manifest=await readManifest();
 const rows:MetadataRow[]=[];
 for(const {name,version,count} of manifest){
  const payload:unknown[]=[];
  for(let offset=0;offset<count;offset+=chunkSize){
   const packed=await readChunk(name,version,offset,Math.min(chunkSize,count-offset));
   payload.push(...JSON.parse((await unpack(Buffer.from(packed,'base64'))).toString('utf8')) as unknown[]);
  }
  rows.push({name,payload});
 }
 return rows;
}
function readMetadata(){
 if(Date.now()<nextRead)return Promise.resolve(metadata??[]);
 if(!pending)pending=(async()=>{
  try{
   metadata=await readPackedMetadata();
   nextRead=Date.now()+interval;
   return metadata;
  }catch{
   nextRead=Date.now()+retryInterval;
   console.warn('[Tunisia Shipper] metadata refresh unavailable; retaining last verified content.');
   return metadata??[];
  }
 })().finally(()=>{pending=undefined;});
 return pending;
}
export async function supplierContent(base:SupplierContent[]):Promise<SupplierContent[]>{
 try{
  const rows=await readMetadata();
  const bindings=rows.find(r=>r.name==='bindings')?.payload;
  const extra=rows.find(r=>r.name==='content')?.payload;
  if(!Array.isArray(bindings)||!Array.isArray(extra))return base;
  return bindAccountContent([...base,...extra as SupplierContent[]],bindings as AccountBinding[]);
 }catch{console.warn('[Tunisia Shipper] private metadata unavailable; retaining verified base content.');return base;}
}
