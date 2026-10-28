import 'server-only';
import {Pool} from 'pg';
import {validateCatalogue} from './catalogue';
// Dated visual-review data stays in the existing private database, never in source control.
export async function getStorefrontPreviewProducts(){
 if(process.env.VERCEL_ENV!=='preview')return [];
 const connectionString=process.env.DATABASE_URL||process.env.POSTGRES_URL;
 if(!connectionString)return [];
 const pool=new Pool({connectionString,max:1,connectionTimeoutMillis:10000});
 try{const {rows}=await pool.query("SELECT payload FROM public.plentovo_tn_storefront_preview WHERE name='shared-layout-2026-10-28'");return validateCatalogue(rows[0]?.payload||[]);}
 catch{console.warn('[Tunisia preview] private layout sample unavailable');return [];}
 finally{await pool.end();}
}
