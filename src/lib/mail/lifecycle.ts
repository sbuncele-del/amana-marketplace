import 'server-only';
import {randomBytes} from 'node:crypto';
import {ensureExperienceSchema,experiencePool} from '@/lib/experience/store';
import {followupDue,businessDay} from './timing';
import {sendMail,mailConfigured} from './send';
import {discoveryProducts} from './discovery-products';
import {welcomeRecommendations} from './welcome-products';
import {welcomeEmail,campaignEmail,oneClickUnsubscribe} from './templates';
import {layout,paragraph,button} from './layout';
import {siteUrl} from '@/lib/site';

async function sendWithRetry(mail:Parameters<typeof sendMail>[0]){for(let attempt=0;;attempt++){try{return await sendMail(mail);}catch(error){if(attempt===2)throw error;await new Promise(resolve=>setTimeout(resolve,700));}}}
export async function sendWelcomeTracked(sub:{id:string;email:string;token:string;market_code:string|null}){
 const db=experiencePool(),id='welcome:'+sub.id;
 const claimed=(await db.query("INSERT INTO mail_lifecycle(id,kind,subscriber_id,due_at,status,attempts,claimed_at,first_attempt_at) VALUES($1,'WELCOME',$2,now(),'SENDING',1,now(),now()) ON CONFLICT DO NOTHING RETURNING id",[id,sub.id])).rowCount;
 if(!claimed)return;
 try{const products=await welcomeRecommendations(sub.market_code).catch(()=>[]);const mail=welcomeEmail(sub.token,products,sub.market_code);
 const provider=await sendWithRetry({to:sub.email,...mail,unsubscribeUrl:oneClickUnsubscribe(sub.token),idempotencyKey:'lifecycle-'+id,tags:{type:'welcome'}});
 await db.query("UPDATE mail_lifecycle SET status='ACCEPTED',recipient=$2,provider_id=$3,accepted_at=now() WHERE id=$1",[id,sub.email,provider]);
 }catch{await db.query("UPDATE mail_lifecycle SET last_error='Welcome send requires retry/review' WHERE id=$1",[id]);}
}
/** Discovery is repeatable: unique keys prevent duplicate enrolment. No historical blasts. */
export async function discoverLifecycle(){
 await ensureExperienceSchema();const db=experiencePool();
 const subscribers=(await db.query("SELECT id,confirmed_at FROM marketing_subscribers WHERE status='ACTIVE' AND market_code='ZA' AND confirmed_at>=now()-interval '7 days'")).rows;
 for(const s of subscribers)await db.query("INSERT INTO mail_lifecycle(id,kind,subscriber_id,due_at) VALUES($1,'DAY3',$2,$3) ON CONFLICT DO NOTHING",['day3:'+s.id,s.id,followupDue(new Date(s.confirmed_at),3)]);
 const orders=(await db.query(`SELECT r.id,r.data->>'deliveredAt' AS delivered FROM experience_records r WHERE r.kind='ORDER' AND r.status='DELIVERED' AND r.data->>'followUpConsent'='true' AND r.data->>'email' LIKE '%@%' AND r.updated_at>=now()-interval '7 days'`)).rows;
 for(const o of orders){const delivered=new Date(o.delivered);if(!Number.isFinite(delivered.getTime())||delivered.getTime()>Date.now()||delivered.getTime()<Date.now()-7*86400000)continue;
 await db.query("INSERT INTO mail_lifecycle(id,kind,order_id,due_at,token) VALUES($1,'FEEDBACK',$2,$3,$4) ON CONFLICT DO NOTHING",['feedback:'+o.id,o.id,followupDue(delivered,2,true),randomBytes(32).toString('base64url')]);}
}
export async function runLifecycle(){
 if(!mailConfigured())throw new Error('MAIL_NOT_CONFIGURED');
 if(!businessDay(new Date(Date.now()+2*3600000)))return {processed:0};
 await discoverLifecycle();const db=experiencePool();
 await db.query("DELETE FROM mail_product_interests WHERE last_seen<now()-interval '30 days'");
 await db.query("UPDATE mail_lifecycle SET status='SKIPPED',last_error='Opportunity expired; no stale follow-up sent' WHERE status='QUEUED' AND due_at<now()-interval '7 days'");
 // A crashed send is only retried inside Resend's 24-hour idempotency window.
 await db.query("UPDATE mail_lifecycle SET status='FAILED',last_error='Send outcome requires review' WHERE status='SENDING' AND first_attempt_at<now()-interval '20 hours'");
 const jobs=(await db.query(`WITH selected AS (SELECT id FROM mail_lifecycle WHERE due_at<=now() AND due_at>=now()-interval '7 days' AND ((status='QUEUED' AND attempts<4) OR (status='SENDING' AND claimed_at<now()-interval '20 minutes' AND first_attempt_at>now()-interval '20 hours')) ORDER BY due_at FOR UPDATE SKIP LOCKED LIMIT 20) UPDATE mail_lifecycle j SET status='SENDING',claimed_at=now(),first_attempt_at=COALESCE(first_attempt_at,now()),attempts=attempts+1 FROM selected WHERE j.id=selected.id RETURNING j.*`)).rows;
 for(const j of jobs){try{
 let email:string,mail:{subject:string;html:string},unsubscribeUrl:string|undefined;
 if(j.kind==='WELCOME'||j.kind==='DAY3'){
 const s=(await db.query("SELECT email,token,market_code FROM marketing_subscribers WHERE id=$1 AND status='ACTIVE'",[j.subscriber_id])).rows[0];
 if(!s){await db.query("UPDATE mail_lifecycle SET status='SKIPPED',last_error='Subscription no longer eligible' WHERE id=$1",[j.id]);continue;}
 email=s.email;unsubscribeUrl=oneClickUnsubscribe(s.token);
 if(j.kind==='WELCOME'){const products=await welcomeRecommendations(s.market_code).catch(()=>[]);mail=welcomeEmail(s.token,products,s.market_code);}else{
 const relevant=s.market_code==='ZA'?await discoveryProducts(email):[];
 const currentFinds=relevant.length?[]:await welcomeRecommendations(s.market_code).catch(()=>[]);
 mail=relevant.length?welcomeEmail(s.token,relevant,'ZA',true):currentFinds.length?welcomeEmail(s.token,currentFinds,s.market_code,'general'):campaignEmail({subject:'What would make your everyday easier?',preheader:'A little help finding your next good thing.',body:'A few days in, we wanted to help you find your way around Plentovo. Explore useful finds for cooking, making room at home, family life and everyday convenience.\n\nLooking for something specific? Our team can help you choose. Tell us what you need through our contact page.\n\nGood things. Plenty of choice.',ctaLabel:'Explore Plentovo',ctaUrl:siteUrl+'/browse?utm_source=email&utm_medium=lifecycle&utm_campaign=day3',token:s.token});}
 }else{
 const o=(await db.query("SELECT reference,data FROM experience_records WHERE id=$1 AND status='DELIVERED' AND data->>'followUpConsent'='true'",[j.order_id])).rows[0];
 if(!o){await db.query("UPDATE mail_lifecycle SET status='SKIPPED',last_error='Order no longer eligible' WHERE id=$1",[j.id]);continue;}
 email=String(o.data.email||'');
 const suppressed=(await db.query("SELECT 1 FROM marketing_subscribers WHERE lower(email)=lower($1) AND status IN ('BOUNCED','COMPLAINED','UNSUBSCRIBED')",[email])).rowCount;
 const deliverySuppressed=(await db.query("SELECT 1 FROM mail_lifecycle j JOIN mail_webhook_events e ON e.email_id=j.provider_id WHERE lower(j.recipient)=lower($1) AND e.type IN ('email.bounced','email.complained') LIMIT 1",[email])).rowCount;
 if(suppressed||deliverySuppressed||!email.includes('@')){await db.query("UPDATE mail_lifecycle SET status='SKIPPED',last_error='Contact suppressed or unavailable' WHERE id=$1",[j.id]);continue;}
 mail={subject:'How is your Plentovo find working out?',html:layout({preheader:'Your honest feedback helps us improve.',content:paragraph('You have had a little time with your delivery. How does the product feel in everyday use? What works well, and what could we improve?')+paragraph('Positive or critical, we want your honest experience. If something is wrong, tell us so our customer-care team can help.')+button('Share your experience',siteUrl+'/feedback#token='+j.token)+paragraph('This feedback is private to our team. It will not be published as a product review.')})};
 }
 // Prevent two lifecycle messages landing together after a scheduler delay.
 const recent=(await db.query("SELECT 1 FROM mail_lifecycle WHERE id<>$1 AND lower(recipient)=lower($2) AND accepted_at>now()-interval '48 hours'",[j.id,email])).rowCount;
 if(recent){await db.query("UPDATE mail_lifecycle SET status='QUEUED',due_at=now()+interval '2 days' WHERE id=$1",[j.id]);continue;}
 const provider=await sendWithRetry({to:email,...mail,unsubscribeUrl,idempotencyKey:'lifecycle-'+j.id,tags:{type:'lifecycle',step:j.kind.toLowerCase()}});
 await db.query("UPDATE mail_lifecycle SET status='ACCEPTED',recipient=$2,provider_id=$3,accepted_at=now(),last_error=NULL WHERE id=$1",[j.id,email,provider]);
 }catch{await db.query("UPDATE mail_lifecycle SET status=CASE WHEN attempts>=4 THEN 'FAILED' ELSE 'SENDING' END,last_error='Provider send or persistence failed; retry/review required' WHERE id=$1",[j.id]);}}
 return {processed:jobs.length};
}
