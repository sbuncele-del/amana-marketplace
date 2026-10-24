import {z} from 'zod';
import data from '@/data/homepage-merchandising.json';
const evidence=z.object({url:z.string().url().refine(u=>u.startsWith('https://')),observedAt:z.string().datetime({offset:true}),signal:z.enum(['bestseller-rank','category-rank','search-trend','corroborated-demand']),note:z.string().min(10).max(600)}).strict();
export const merchandisingSchema=z.object({version:z.literal(1),market:z.literal('ZA'),updatedAt:z.string().datetime({offset:true}).nullable(),headline:z.string().min(3).max(70),description:z.string().max(160),heroHeadline:z.string().min(3).max(80),heroDescription:z.string().max(160),products:z.array(z.object({slug:z.string().regex(/^[a-z0-9-]+$/),evidence:z.array(evidence).min(1).max(5)}).strict()).max(20),departmentOrder:z.array(z.string().regex(/^[a-z0-9-]+$/)).max(12)}).strict();
export function readMerchandising(input:unknown=data,now=Date.now()){
 const result=merchandisingSchema.safeParse(input);
 if(!result.success)return null;
 const config=result.data;const age=config.updatedAt?now-Date.parse(config.updatedAt):Infinity;
 if(age<0||age>7*86400000)return null;
 const products=config.products.filter(p=>p.evidence.some(e=>{const age=now-Date.parse(e.observedAt);return age>=0&&age<=7*86400000;}));
 return {...config,products:[...new Map(products.map(p=>[p.slug,p])).values()]};
}
