import {NextRequest,NextResponse} from 'next/server';
import {z} from 'zod';
import {transaction,event,insertRecord} from '@/lib/experience/store';
import {sameRequestOrigin} from '@/lib/experience/request-origin';
const schema=z.object({token:z.string().regex(/^[A-Za-z0-9_-]{43}$/),rating:z.number().int().min(1).max(5),comment:z.string().trim().min(1).max(3000),needsHelp:z.boolean(),decline:z.boolean()}).strict();
export async function POST(request:NextRequest){
 if(!sameRequestOrigin(request))return NextResponse.json({error:'Use the feedback form'},{status:403});
 try{
 if(Number(request.headers.get('content-length')||0)>12000)return NextResponse.json({error:'Message too long'},{status:413});
 const b=schema.parse(await request.json());
 await transaction(async client=>{
 const j=(await client.query("SELECT * FROM mail_lifecycle WHERE token=$1 AND kind='FEEDBACK' AND status='ACCEPTED' AND accepted_at>now()-interval '30 days' FOR UPDATE",[b.token])).rows[0];
 if(!j||j.responded_at)throw new Error('INVALID_LINK');
 const o=(await client.query("SELECT * FROM experience_records WHERE id=$1 AND kind='ORDER' FOR UPDATE",[j.order_id])).rows[0];if(!o)throw new Error('INVALID_LINK');
 await client.query('UPDATE mail_lifecycle SET responded_at=now() WHERE id=$1',[j.id]);
 await event(client,o.id,null,'CUSTOMER_PRODUCT_FEEDBACK',b.comment,{productScore:b.rating,needsHelp:b.needsHelp,source:'DELIVERY_EMAIL'});
 if(b.decline)await client.query("UPDATE experience_records SET data=jsonb_set(data,'{followUpConsent}','false'),version=version+1,updated_at=now() WHERE id=$1",[o.id]);
 if(b.needsHelp||b.rating<=2){const c=await insertRecord(client,{kind:'CASE',status:'OPEN',orderId:o.id,teamId:o.team_id,ownerId:o.owner_id,dueAt:new Date(Date.now()+6*3600000),data:{title:'Customer requested product support',category:'CARE',priority:'HIGH',customerName:o.data.customerName,description:b.comment,productScore:b.rating,source:'DELIVERY_EMAIL'}});await event(client,c.id,null,'RECOVERY_CREATED',b.comment);}
 });return NextResponse.json({saved:true},{headers:{'Cache-Control':'no-store'}});
 }catch{return NextResponse.json({error:'Feedback could not be saved. Link may be expired or already used.'},{status:400});}
}
