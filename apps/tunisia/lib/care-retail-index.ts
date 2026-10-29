import 'server-only';
import {Pool} from 'pg';
import type {StoreProduct} from './catalogue';
let pool:Pool|undefined;
function db(){const connectionString=process.env.DATABASE_URL||process.env.POSTGRES_URL;if(!connectionString)return null;return pool??=new Pool({connectionString,max:2,connectionTimeoutMillis:3000,query_timeout:3000,idleTimeoutMillis:10000});}
let ready:Promise<void>|undefined;
async function ensure(){const client=db();if(!client)return null;await (ready??=client.query('CREATE TABLE IF NOT EXISTS public.plentovo_tn_retail_index (name text PRIMARY KEY, payload jsonb NOT NULL, published_at timestamptz NOT NULL DEFAULT now())').then(()=>{}).catch(e=>{ready=undefined;throw e;}));return client;}
// Only the public storefront allowlist enters this index. No wholesale costs or account mappings.
export async function publishCareRetailIndex(products:StoreProduct[]){
 if(!products.length)return;
 try{const client=await ensure();if(!client)return;
 const payload=products.map(p=>({id:p.id,supplierProductId:p.id,slug:p.slug,groupId:p.groupId,groupSlug:p.groupSlug,groupTitle:p.groupTitle,optionLabel:p.optionLabel,title:p.title,category:p.category,image:p.image,priceMillimes:p.priceMillimes,stock:p.stock,active:p.active,description:{en:p.description?.en.slice(0,400)||'',fr:p.description?.fr.slice(0,400)||'',ar:p.description?.ar.slice(0,400)||''}}));
 await client.query("INSERT INTO public.plentovo_tn_retail_index(name,payload) VALUES('published-storefront',$1::jsonb) ON CONFLICT(name) DO UPDATE SET payload=EXCLUDED.payload,published_at=now() WHERE plentovo_tn_retail_index.payload IS DISTINCT FROM EXCLUDED.payload",[JSON.stringify(payload)]);
 }catch(e){console.warn('[market-care] retail index write unavailable',e instanceof Error?e.name:'unknown');}
}
export async function readCareRetailIndex():Promise<StoreProduct[]>{
 try{const client=await ensure();if(!client)return [];const result=await client.query("SELECT payload FROM public.plentovo_tn_retail_index WHERE name='published-storefront'");const value=result.rows[0]?.payload;return Array.isArray(value)?value:[];}
 catch(e){console.warn('[market-care] retail index read unavailable',e instanceof Error?e.name:'unknown');return [];}
}
