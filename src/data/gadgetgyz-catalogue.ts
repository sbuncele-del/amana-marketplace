import part0 from './gadgetgyz-packed-0.json';
import part1 from './gadgetgyz-packed-1.json';
import part2 from './gadgetgyz-packed-2.json';
import part3 from './gadgetgyz-packed-3.json';
import part4 from './gadgetgyz-packed-4.json';
import part5 from './gadgetgyz-packed-5.json';
import {gunzipSync} from 'node:zlib';
import type snapshot from './catalogue.json';
export default JSON.parse(gunzipSync(Buffer.from([part0,part1,part2,part3,part4,part5].join(''),'base64')).toString('utf8')) as typeof snapshot;
