import 'server-only';
import {ensureExperienceSchema,experiencePool} from '@/lib/experience/store';
import {readMerchandising} from './homepage-merchandising';
export async function getHomepageMerchandising(){
 try {
  await ensureExperienceSchema();
  const result=await experiencePool().query("SELECT payload FROM homepage_merchandising WHERE market='ZA'");
  return result.rows.length?readMerchandising(result.rows[0].payload):readMerchandising();
 }catch(error){console.error('[merchandising] Selection unavailable',error instanceof Error?error.message:'Unknown error');return readMerchandising();}
}
