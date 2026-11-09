import 'server-only';
import {experiencePool} from '@/lib/experience/store';
import {rankDemand} from './demand-priority.mjs';
export async function demandEvidence(){
 try {return (await experiencePool().query("SELECT payload FROM marketing_demand_cache WHERE observed_at > now()-interval '7 days'")).rows.map(r=>r.payload);}
 catch {return [];}
}
export async function demandPriority(products:{slug:string;name:string;price:number;images:string[];priceOnRequest?:boolean}[]){return rankDemand(products,await demandEvidence(),Date.now(),100);}
