import 'server-only';
import {unstable_cache} from 'next/cache';
import {Pool} from 'pg';
import {bindAccountContent,type AccountBinding} from './shipper-content';
import type {SupplierContent} from './shipper-normalise';
let pool:Pool|undefined;
const readMetadata=unstable_cache(async()=>{
 const connectionString=process.env.DATABASE_URL||process.env.POSTGRES_URL;
 if(!connectionString)return [];
 pool??=new Pool({connectionString,max:2,idleTimeoutMillis:10000,connectionTimeoutMillis:10000});
 const result=await pool.query<{name:string;payload:unknown}>('SELECT name,payload FROM public.plentovo_tn_catalogue_metadata WHERE name IN ($1,$2)',['bindings','content']);
 return result.rows;
},['tunisia-private-supplier-metadata-v1'],{revalidate:300,tags:['tunisia-shipper-metadata']});
export async function supplierContent(base:SupplierContent[]):Promise<SupplierContent[]>{
 try{
  const rows=await readMetadata();
  const bindings=rows.find(r=>r.name==='bindings')?.payload;
  const extra=rows.find(r=>r.name==='content')?.payload;
  if(!Array.isArray(bindings)||!Array.isArray(extra))return base;
  return bindAccountContent([...base,...extra as SupplierContent[]],bindings as AccountBinding[]);
 }catch{console.warn('[Tunisia Shipper] private metadata unavailable; retaining verified base content.');return base;}
}
