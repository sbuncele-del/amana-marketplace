import {NextRequest,NextResponse} from 'next/server';
import {commerceActor,requireAdmin,CommerceError} from '@/lib/commerce/access';
import {validResearchToken} from '@/lib/marketing/demand.mjs';
import {getDemandOpening} from '@/lib/catalogue';
export const maxDuration=60;
export async function GET(request:NextRequest){
 try{
  if(!validResearchToken(request.headers.get('authorization'),process.env.MARKETING_RESEARCH_TOKEN,process.env.MARKETING_RESEARCH_TOKEN_EXPIRES_AT))requireAdmin(await commerceActor());
  const {products,...report}=await getDemandOpening();
  return NextResponse.json({...report,productCount:products.length,socialBrief:report.entries.slice(0,3).map(p=>({slug:p.slug,price:p.price,theme:p.lane,hook:p.creativeAngle,approvalRequired:true,marginVerified:false}))},{headers:{'Cache-Control':'no-store'}});
 }catch(e){return NextResponse.json({error:e instanceof CommerceError?e.message:'Priority research unavailable'},{status:e instanceof CommerceError?e.status:503,headers:{'Cache-Control':'no-store'}});}
}
