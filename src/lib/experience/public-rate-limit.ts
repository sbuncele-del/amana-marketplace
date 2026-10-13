import 'server-only';
import {createHash} from 'node:crypto';
import type {NextRequest} from 'next/server';
import {transaction} from './store';
// Commit the attempt before validation or supplier work, so failed requests also count.
export async function limitPublicRequest(request:NextRequest,channel:string){const ip=request.headers.get('x-forwarded-for')?.split(',')[0]||'unknown';const key=createHash('sha256').update(`${process.env.NEXTAUTH_SECRET||process.env.AUTH_SECRET||'experience'}:${channel}:${ip}:${Math.floor(Date.now()/900000)}`).digest('hex');const hits=await transaction(async client=>{const rate=(await client.query("INSERT INTO experience_rate_limits(key,hits,expires_at) VALUES($1,1,now()+interval '30 minutes') ON CONFLICT(key) DO UPDATE SET hits=experience_rate_limits.hits+1 RETURNING hits",[key])).rows[0];await client.query('DELETE FROM experience_rate_limits WHERE expires_at<now()');return rate.hits;});if(hits>5)throw new Error('RATE_LIMIT');}
