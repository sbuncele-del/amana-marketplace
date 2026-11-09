import type { NextConfig } from 'next';
import path from 'node:path';
const root=path.resolve(process.cwd(),'../..');
const config: NextConfig = {basePath:'/algeria', turbopack:{root,resolveAlias:{'lucide-react':'./'+path.relative(process.cwd(),path.dirname(require.resolve('lucide-react/package.json')))}},outputFileTracingRoot:root, output:'standalone', poweredByHeader:false};
export default config;
