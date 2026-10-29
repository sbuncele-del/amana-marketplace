import {marketChat} from '../../../../../packages/storefront/market-chat-handler';
import {careSearchScore,careBudget} from '../../../../../packages/storefront/care-search';
import {products} from '@/lib/catalogue';
export const maxDuration=45;
export async function POST(request:Request){return marketChat(request,{country:'Algeria',basePath:'/algeria',context:async(messages,locale)=>{const query=messages.filter(m=>m.role==='user').slice(-3).map(m=>m.content).join(' '),budget=careBudget(query);return products.filter(p=>(!budget||p.priceCentimes/100<=budget)&&careSearchScore(query,Object.values(p.title).join(' '))>0).slice(0,5).map(p=>({name:p.title[locale],href:`/${locale}/product/${p.slug}`,price:p.priceCentimes/100,hasOptions:false,available:p.stock>0,description:p.description[locale].slice(0,500),variants:[]}));}});}
