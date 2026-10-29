import type { NextConfig } from 'next';
import path from 'node:path';
const root=path.resolve(process.cwd(),'../..');
const config: NextConfig = {basePath:'/algeria', turbopack:{root},outputFileTracingRoot:root, output:'standalone', poweredByHeader:false};
export default config;
