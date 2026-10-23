import {PGlite} from '@electric-sql/pglite';
import assert from 'node:assert/strict';
import {experienceSchema} from '../../src/lib/experience/schema';
async function main() {
 const db = new PGlite();
 await db.exec('CREATE TABLE "User"(id text PRIMARY KEY)');
 await db.exec(experienceSchema);
 await db.exec(experienceSchema);
 await db.exec("INSERT INTO marketing_subscribers(id,email,source,token,consent_text,consent_ip_hash) VALUES('legacy','legacy@example.com','test','token','yes','hash')");
 assert.equal((await db.query<{market_code: string|null}>("SELECT market_code FROM marketing_subscribers WHERE id='legacy'")).rows[0].market_code,null);
 await db.exec("UPDATE marketing_subscribers SET market_code='ZA' WHERE id='legacy'");
 await assert.rejects(db.exec("UPDATE marketing_subscribers SET market_code='invalid' WHERE id='legacy'"));
 await db.close();
 console.log('PASS: migration replays, existing subscribers remain unknown, country constraint holds.');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
