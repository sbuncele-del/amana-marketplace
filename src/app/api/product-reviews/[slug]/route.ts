import {NextRequest,NextResponse} from 'next/server';
import {randomUUID} from 'node:crypto';
import {limitPublicRequest} from '@/lib/experience/public-rate-limit';
import {auth} from '@/lib/auth';
import {prisma} from '@/lib/prisma';
import {getCatalogueSnapshot} from '@/lib/catalogue';
import {getProductReviews} from '@/lib/product-reviews';
import {ensureExperienceSchema,experiencePool} from '@/lib/experience/store';
import {sameRequestOrigin} from '@/lib/experience/request-origin';
type Context={params:Promise<{slug:string}>};
export async function POST(request:NextRequest,{params}:Context){
 if(!sameRequestOrigin(request))return NextResponse.json({error:'Invalid request origin.'},{status:403});
 const session=await auth();
 if(!session?.user?.id)return NextResponse.json({error:'Please sign in to write a review.'},{status:401});
 const {slug}=await params;
 if(!(await getCatalogueSnapshot()).some(p=>p.slug===slug))return NextResponse.json({error:'Product not found.'},{status:404});
 let body;try{body=await request.json();}catch{return NextResponse.json({error:'Invalid review.'},{status:400});}
 const comment=typeof body.comment==='string'?body.comment.trim():'';
 if(!Number.isInteger(body.rating)||body.rating<1||body.rating>5||comment.length<10||comment.length>2000)return NextResponse.json({error:'Choose 1–5 stars and write between 10 and 2,000 characters.'},{status:400});
 try{
  await limitPublicRequest(request,'product-review');
  const user=await prisma.user.findUnique({where:{id:session.user.id},select:{isActive:true}});
  if(!user?.isActive)return NextResponse.json({error:'Account unavailable.'},{status:403});
  const order=await prisma.order.findFirst({where:{buyerId:session.user.id,status:{in:['DELIVERED','BUYER_VERIFYING','COMPLETED']},items:{some:{product:{slug}}}},select:{id:true}});
  await ensureExperienceSchema();
  await experiencePool().query('INSERT INTO catalogue_reviews(id,slug,user_id,rating,comment,verified) VALUES($1,$2,$3,$4,$5,$6)',[randomUUID(),slug,session.user.id,body.rating,comment,!!order]);
  return NextResponse.json(await getProductReviews(slug),{status:201});
 }catch(e){if(e instanceof Error&&e.message==='RATE_LIMIT')return NextResponse.json({error:'Please wait a little before submitting another review.'},{status:429});if((e as {code?:string}).code==='23505')return NextResponse.json({error:'You have already reviewed this product.'},{status:409});return NextResponse.json({error:'Reviews are temporarily unavailable. Please try again.'},{status:503});}
}
export async function DELETE(request:NextRequest,{params}:Context){
 if(!sameRequestOrigin(request))return NextResponse.json({error:'Invalid request origin.'},{status:403});
 const session=await auth();
 if(!session?.user?.id||session.user.role!=='ADMIN')return NextResponse.json({error:'Unauthorized'},{status:403});
 const {slug}=await params;
 const id=request.nextUrl.searchParams.get('id');
 if(!id)return NextResponse.json({error:'Review ID required.'},{status:400});
 await ensureExperienceSchema();
 await experiencePool().query('DELETE FROM catalogue_reviews WHERE id=$1 AND slug=$2',[id,slug]);
 return NextResponse.json({ok:true});
}
