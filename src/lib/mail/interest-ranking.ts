import {rankRecommendations,type RecommendationItem} from '@/lib/product-recommendations';
export type ProductInterest={slug:string;weight:number;last_seen:Date|string};
export function rankEmailInterests<T extends RecommendationItem>(history:ProductInterest[],all:T[],excluded=new Set<string>(),now=Date.now()){
 const scores=new Map<string,number>();
 for(const h of history){const age=(now-new Date(h.last_seen).getTime())/86400000;if(age<0||age>30)continue;const seed=all.find(p=>p.slug===h.slug);if(!seed)continue;const score=Math.min(20,Math.max(0,Number(h.weight)))/(1+age);if(!excluded.has(seed.slug))scores.set(seed.slug,(scores.get(seed.slug)||0)+score*2);
 rankRecommendations(seed,all).similar.filter(p=>!excluded.has(p.slug)).slice(0,4).forEach((p,index)=>scores.set(p.slug,(scores.get(p.slug)||0)+score/(index+1)));}
 return [...scores].sort((a,b)=>b[1]-a[1]).map(([slug])=>slug);
}
