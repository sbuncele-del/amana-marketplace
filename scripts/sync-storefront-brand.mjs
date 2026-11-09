import {cpSync,existsSync,mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
const source=path.join(root,'public/brand');
const target=path.join(root,'apps/tunisia/public/brand');
// Both North African deployments use this app. Copy only approved Plentovo assets.
const assets=['plentovo.svg','plentovo-light.svg','plentovo-hero-v2.webp','plentovo-living.webp','heroes','categories','campaigns'];
for(const asset of assets)if(!existsSync(path.join(source,asset)))throw new Error(`Shared brand asset missing: ${asset}`);
mkdirSync(target,{recursive:true});
for(const asset of assets)cpSync(path.join(source,asset),path.join(target,asset),{recursive:true,force:true});
console.log('Shared Plentovo brand assets synced for the North African storefront builds.');
