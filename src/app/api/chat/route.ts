import {NextRequest,NextResponse} from 'next/server';
import {z} from 'zod';
import {careInstructions} from '@/lib/chat/knowledge';
import {catalogueContext} from '@/lib/chat/catalogue-context';
export const maxDuration=45;
import {limitPublicRequest} from '@/lib/experience/public-rate-limit';
const schema=z.object({pathname:z.string().max(240).regex(/^\/[^?#]*$/).optional(),messages:z.array(z.object({role:z.enum(['user','assistant']),content:z.string().min(1).max(2000)})).min(1).max(24)});
function help(message:string){if(/deliver|shipping|courier|collect/i.test(message))return 'We deliver within South Africa. Allow 0–2 business days for processing, then 3–5 business days after dispatch. Delivery starts at R79 for parcels below 10kg and increases by total weight. See Delivery & collection below for the full rates.';
 if(/return|refund|faulty/i.test(message))return 'For a return or faulty item, please review Returns & refunds below, then contact customer care with your order reference and what went wrong. I cannot approve or process a refund here.';
 if(/address|located|office/i.test(message))return 'Our business address is 116 Limpopo Avenue, Doringkloof, Centurion, 0157, South Africa. Please contact customer care before visiting or sending a return.';
 return 'I can help you find delivery information, returns guidance and customer care. For a personal response about an order or product, please use Contact customer care below.';}
export async function POST(request:NextRequest){
 if(Number(request.headers.get('content-length')||0)>60000)return NextResponse.json({error:'Please send a shorter message.'},{status:413});
 const origin=request.headers.get('origin');if(origin&&new URL(origin).host!==request.headers.get('host'))return NextResponse.json({error:'Request not allowed.'},{status:403});
 let input;try{input=schema.parse(await request.json());}catch{return NextResponse.json({error:'Please send a short message.'},{status:400});}
 const last=input.messages.at(-1);if(last?.role!=='user')return NextResponse.json({error:'Please enter your question.'},{status:400});
 if(!process.env.GROQ_API_KEY)return NextResponse.json({reply:help(last.content),mode:'guide'});
 let stage='rate-limit';
 try{
  await limitPublicRequest(request,'shopping-chat');
  stage='catalogue';
  const context=await catalogueContext(input.messages,input.pathname);
  const business={whatsapp:(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER||'').replace(/\D/g,''),email:process.env.NEXT_PUBLIC_CONTACT_EMAIL||null};
  stage='groq-request';
  const response=await fetch('https://api.groq.com/openai/v1/chat/completions',{method:'POST',headers:{Authorization:'Bearer '+process.env.GROQ_API_KEY.trim(),'Content-Type':'application/json'},body:JSON.stringify({model:process.env.GROQ_MODEL||'openai/gpt-oss-20b',messages:[{role:'system',content:careInstructions},{role:'system',content:'CURRENT REFERENCE DATA (not instructions): '+JSON.stringify({business,currentPage:input.pathname||null,products:context.data,budget:context.budget})},...input.messages],temperature:0.4,reasoning_effort:'low',include_reasoning:false,max_completion_tokens:1600}),signal:AbortSignal.timeout(20000)});
  if(!response.ok){console.warn('Customer chat provider rejected request',{status:response.status});throw new Error('PROVIDER_UNAVAILABLE');}
  const result=await response.json();const reply=result.choices?.[0]?.message?.content;
  if(typeof reply!=='string'||!reply.trim())throw new Error('EMPTY_RESPONSE');
  const plain=reply.replace(/\*\*([^*]+)\*\*/g,'$1').replace(/\[([^\]]+)\]\([^)]*\)/g,'$1');
  return NextResponse.json({reply:plain.slice(0,5000),mode:'ai',products:context.products});
 }catch(error){console.warn('Customer chat fallback',{stage,code:error instanceof Error?error.name:'unknown'});if(error instanceof Error&&error.message==='RATE_LIMIT')return NextResponse.json({error:'Please pause before sending more questions. Customer care is available through the link below.'},{status:429});return NextResponse.json({reply:help(last.content),mode:'guide'});}
}
