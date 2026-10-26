import {NextRequest,NextResponse} from 'next/server';
import {auth} from '@/lib/auth';
import {ensureExperienceSchema,experiencePool} from '@/lib/experience/store';
import {sameRequestOrigin} from '@/lib/experience/request-origin';
import {getCatalogueSnapshot} from '@/lib/catalogue';
import {catalogueSearch} from '@/lib/catalogue-search';
import {z} from 'zod';
const headers={'Cache-Control':'no-store'};
async function actor(){const session=await auth();if(!session?.user?.id)return null;await ensureExperienceSchema();const user=(await experiencePool().query('SELECT id,email FROM "User" WHERE id=$1 AND "isActive"=true',[session.user.id])).rows[0];return user||null;}
export async function GET(){const u=await actor();if(!u)return NextResponse.json({error:'Sign in required'},{status:401});const r=(await experiencePool().query('SELECT enabled FROM mail_interest_preferences WHERE user_id=$1',[u.id])).rows[0];return NextResponse.json({enabled:r?.enabled===true},{headers});}
export async function PUT(request:NextRequest){
 if(!sameRequestOrigin(request))return NextResponse.json({error:'Use your account settings'},{status:403});
 const u=await actor();if(!u)return NextResponse.json({error:'Sign in required'},{status:401});
 try{const b=z.object({enabled:z.boolean()}).strict().parse(await request.json());await experiencePool().query('INSERT INTO mail_interest_preferences(user_id,enabled,updated_at) VALUES($1,$2,now()) ON CONFLICT(user_id) DO UPDATE SET enabled=$2,updated_at=now()',[u.id,b.enabled]);if(!b.enabled)await experiencePool().query('DELETE FROM mail_product_interests WHERE user_id=$1',[u.id]);return NextResponse.json({enabled:b.enabled},{headers});}catch{return NextResponse.json({error:'Could not save preference'},{status:400});}
}
export async function POST(request:NextRequest){
 if(!sameRequestOrigin(request))return NextResponse.json({error:'Use Plentovo'},{status:403});
 try{
 const u=await actor();if(!u)return NextResponse.json({recorded:false},{headers});
 const eligible=(await experiencePool().query("SELECT 1 FROM mail_interest_preferences p JOIN marketing_subscribers s ON lower(s.email)=lower($2) WHERE p.user_id=$1 AND p.enabled=true AND s.status='ACTIVE'",[u.id,u.email])).rowCount;
 if(!eligible)return NextResponse.json({recorded:false},{headers});
 if(Number(request.headers.get('content-length')||0)>1000)return NextResponse.json({recorded:false},{headers});
 const b=z.object({search:z.string().trim().max(100).optional(),slug:z.string().max(200).optional()}).strict().parse(await request.json());
 const all=getCatalogueSnapshot();const slugs=b.slug?all.filter(p=>p.slug===b.slug).map(p=>p.slug):b.search?catalogueSearch(all,b.search).slice(0,3).map(p=>p.slug):[];
 // Never retain raw search text. Keep only matched catalogue IDs for up to 30 days.
 for(const slug of slugs)await experiencePool().query(`INSERT INTO mail_product_interests(user_id,slug,weight,last_seen) VALUES($1,$2,$3,now()) ON CONFLICT(user_id,slug) DO UPDATE SET weight=LEAST(20,mail_product_interests.weight+$3),last_seen=now() WHERE mail_product_interests.last_seen<now()-interval '30 minutes'`,[u.id,slug,b.slug?5:2]);
 return NextResponse.json({recorded:slugs.length>0},{headers});
 }catch{return NextResponse.json({recorded:false},{headers});}
}
