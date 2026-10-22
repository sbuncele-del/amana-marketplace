import {NextResponse} from 'next/server';
import {ensureExperienceSchema,experiencePool} from '@/lib/experience/store';
export async function GET(){try{await ensureExperienceSchema();await experiencePool().query('SELECT 1');return NextResponse.json({enquiriesAvailable:true},{headers:{'Cache-Control':'no-store'}});}catch{return NextResponse.json({enquiriesAvailable:false},{status:503,headers:{'Cache-Control':'no-store'}});}}
