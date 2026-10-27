import {NextRequest,NextResponse} from 'next/server';
import {getCatalogueProduct} from '@/lib/catalogue';
export async function POST(request:NextRequest) {
 let body;try {body=await request.json();}catch{return NextResponse.json({error:'Invalid request'},{status:400});}
 if(!Array.isArray(body.lines)||body.lines.length>50)return NextResponse.json({error:'Invalid cart'},{status:400});
 const lines=await Promise.all(body.lines.map(async (line:{id:string;quantity:number})=>{
  if(typeof line?.id!=='string'||!Number.isInteger(line.quantity)||line.quantity<1||line.quantity>10)return null;
  const [slug,id]=line.id.split(':');const p=await getCatalogueProduct(slug,true);const v=p?.variants.find(v=>v.id===id);
  if(!p||!v?.supplierAvailable||(v.managedStock!==undefined&&line.quantity>v.managedStock))return null;
  return {id:`${p.slug}:${v.id}`,quantity:line.quantity,weightGrams:v.weightGrams??null,merchandise:{id:`${p.slug}:${v.id}`,title:v.title,price:{amount:v.price.toFixed(2),currencyCode:'ZAR'},product:{title:p.name,handle:p.slug,images:[...new Set([...(v.image?[v.image]:[]),...p.images])].map(url=>({url}))}}};
 }));
 return NextResponse.json({lines:lines.filter(Boolean)},{headers:{'Cache-Control':'no-store'}});
}
