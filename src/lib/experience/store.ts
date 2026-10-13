import 'server-only';
import {Pool,type PoolClient} from 'pg';
import {randomUUID} from 'node:crypto';
import {experienceSchema} from './schema';
import type {OpsRecord} from './culture';
let pool:Pool|undefined;
let ready:Promise<void>|undefined;
export function experiencePool(){if(!process.env.DATABASE_URL)throw new Error('EXPERIENCE_DATABASE_NOT_CONFIGURED');return pool??=new Pool({connectionString:process.env.DATABASE_URL,max:3,connectionTimeoutMillis:8000,idleTimeoutMillis:10000});}
export async function ensureExperienceSchema(){if(!ready){ready=(async()=>{const client=await experiencePool().connect();try{await client.query('BEGIN');await client.query("SELECT pg_advisory_xact_lock(792046321)");await client.query(experienceSchema);await client.query('COMMIT');}catch(e){await client.query('ROLLBACK');throw e;}finally{client.release();}})().catch(e=>{ready=undefined;throw e;});}return ready;}
export async function transaction<T>(work:(client:PoolClient)=>Promise<T>){await ensureExperienceSchema();const client=await experiencePool().connect();try{await client.query('BEGIN');const value=await work(client);await client.query('COMMIT');return value;}catch(e){await client.query('ROLLBACK');throw e;}finally{client.release();}}
export function recordFromRow(r:Record<string,any>):OpsRecord{return {id:r.id,kind:r.kind,reference:r.reference,orderId:r.order_id,teamId:r.team_id,ownerId:r.owner_id,status:r.status,dueAt:r.due_at?.toISOString()||null,data:r.data,version:r.version,createdAt:r.created_at.toISOString(),updatedAt:r.updated_at.toISOString()};}
export async function event(client:PoolClient,id:string,actor:string|null,type:string,note:string,data:Record<string,unknown>={}){await client.query('INSERT INTO experience_events(id,record_id,actor_id,type,note,data) VALUES($1,$2,$3,$4,$5,$6)',[randomUUID(),id,actor,type,note,JSON.stringify(data)]);}
export async function insertRecord(client:PoolClient,{kind,status,data,orderId=null,teamId='za-customer-care',ownerId=null,dueAt=null}:{kind:string;status:string;data:Record<string,unknown>;orderId?:string|null;teamId?:string|null;ownerId?:string|null;dueAt?:Date|null}){const id=randomUUID();const reference=`AM-${kind[0]}-${id.replace(/-/g,'').slice(0,16).toUpperCase()}`;const r=await client.query('INSERT INTO experience_records(id,kind,reference,order_id,team_id,owner_id,status,due_at,data) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *',[id,kind,reference,orderId,teamId,ownerId,status,dueAt,JSON.stringify(data)]);return recordFromRow(r.rows[0]);}
