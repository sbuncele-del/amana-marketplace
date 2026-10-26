import 'server-only';
import {experiencePool} from '@/lib/experience/store';
import {getCatalogueSnapshot,getCatalogueProduct} from '@/lib/catalogue';
import {rankEmailInterests} from './interest-ranking';
import type {WelcomeProduct} from './templates';
export async function discoveryProducts(email:string):Promise<WelcomeProduct[]>{
 const history=(await experiencePool().query(`SELECT i.slug,i.weight,i.last_seen FROM mail_product_interests i JOIN mail_interest_preferences p ON p.user_id=i.user_id AND p.enabled=true JOIN "User" u ON u.id=i.user_id AND u."isActive"=true WHERE lower(u.email)=lower($1) AND i.last_seen>now()-interval '30 days' AND i.last_seen>=p.updated_at ORDER BY i.last_seen DESC LIMIT 8`,[email])).rows;
 if(!history.length)return [];
 const purchased=(await experiencePool().query("SELECT item->>'slug' AS slug FROM experience_records r CROSS JOIN LATERAL jsonb_array_elements(CASE WHEN jsonb_typeof(r.data->'items')='array' THEN r.data->'items' ELSE '[]'::jsonb END) item WHERE r.kind='ORDER' AND r.status IN ('PAID','FULFILMENT','SHIPPED','DELIVERED') AND lower(r.data->>'email')=lower($1) AND r.created_at>now()-interval '30 days'",[email])).rows;
 const all=getCatalogueSnapshot();const candidates=rankEmailInterests(history,all,new Set(purchased.map(p=>String(p.slug)))).slice(0,18);const products:WelcomeProduct[]=[];
 for(let i=0;i<candidates.length&&products.length<6;i+=6){const checked=await Promise.all(candidates.slice(i,i+6).map(slug=>getCatalogueProduct(slug,false,true,'ZA').catch(()=>null)));
 for(const p of checked){if(!p)continue;const v=p.variants.filter(v=>v.supplierAvailable&&v.price>0).sort((a,b)=>a.price-b.price)[0];if(!v||!(v.image||p.images[0]))continue;products.push({name:p.name,slug:p.slug,image:v.image||p.images[0],price:v.price,currency:'ZAR',department:p.category.name});if(products.length===6)break;}}
 return products;
}
