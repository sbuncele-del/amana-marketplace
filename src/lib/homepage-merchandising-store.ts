import 'server-only';
import {getDemandOpening} from '@/lib/catalogue';
import {ensureExperienceSchema,experiencePool} from '@/lib/experience/store';
import {readMerchandising} from './homepage-merchandising';
export async function getHomepageMerchandising(){
 try {
  const opening=await getDemandOpening();
  if(opening.entries.length)return {version:1 as const,market:'ZA' as const,updatedAt:opening.observedAt,headline:'Good finds for right now',description:'Useful picks for your everyday.',heroHeadline:'Good things. Plenty of choice.',heroDescription:'Discover more for your everyday.',products:opening.entries.map(p=>({slug:p.slug,evidence:p.evidence})),departmentOrder:[] as string[]};
  await ensureExperienceSchema();
  const result=await experiencePool().query("SELECT payload FROM homepage_merchandising WHERE market='ZA'");
  return result.rows.length?readMerchandising(result.rows[0].payload):readMerchandising();
 }catch(error){console.error('[merchandising] Selection unavailable',error instanceof Error?error.message:'Unknown error');return readMerchandising();}
}
