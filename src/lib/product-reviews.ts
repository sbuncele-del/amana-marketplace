import 'server-only';
import {ensureExperienceSchema, experiencePool} from '@/lib/experience/store';

export type ProductReview = {id:string; rating:number; comment:string; name:string; verified:boolean; createdAt:string};
export async function getProductReviews(slug:string):Promise<{reviews:ProductReview[];count:number;average:number|null;available:boolean;distribution:{rating:number;count:number}[]}> {
  try {
    await ensureExperienceSchema();
    const result=await experiencePool().query(`SELECT r.id,r.rating,r.comment,r.verified,r.created_at,u."firstName" AS name FROM catalogue_reviews r JOIN "User" u ON u.id=r.user_id WHERE slug=$1 ORDER BY created_at DESC LIMIT 100`,[slug]);
    const buckets=await experiencePool().query('SELECT rating,count(*)::int AS count FROM catalogue_reviews WHERE slug=$1 GROUP BY rating',[slug]);
    const stats=await experiencePool().query('SELECT count(*)::int AS count,avg(rating)::float AS average FROM catalogue_reviews WHERE slug=$1',[slug]);
    return {distribution:[5,4,3,2,1].map(rating=>({rating,count:buckets.rows.find(r=>r.rating===rating)?.count||0})),available:true,reviews:result.rows.map(r=>({id:r.id,rating:r.rating,comment:r.comment,verified:r.verified,name:r.name||'Plentovo customer',createdAt:r.created_at.toISOString()})),count:stats.rows[0].count,average:stats.rows[0].average};
  } catch { return {distribution:[],available:false,reviews:[],count:0,average:null}; }
}
