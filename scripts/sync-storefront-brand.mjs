import {cpSync,existsSync,mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
const source=path.join(root,'public/brand');
const targets=['tunisia','algeria'].map(market=>path.join(root,'apps',market,'public/brand'));
// Copy only approved Plentovo assets into both independent country apps.
const assets=['plentovo.svg','plentovo-light.svg','plentovo-hero-v2.webp','plentovo-living.webp','heroes','categories','campaigns'];
for(const asset of assets)if(!existsSync(path.join(source,asset)))throw new Error(`Shared brand asset missing: ${asset}`);
for(const target of targets){
 mkdirSync(target,{recursive:true});
 for(const asset of assets)cpSync(path.join(source,asset),path.join(target,asset),{recursive:true,force:true});
}
console.log('Shared Plentovo brand assets synced for the North African storefront builds.');
