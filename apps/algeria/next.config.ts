import type { NextConfig } from 'next';
const config: NextConfig = {basePath:'/algeria', turbopack:{root:process.cwd()}, output:'standalone', poweredByHeader:false};
export default config;
