import type { NextConfig } from 'next';
const config: NextConfig = {basePath:'/tunisia', turbopack:{root:process.cwd()}, output:'standalone', poweredByHeader:false};
export default config;
