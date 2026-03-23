import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;


/*
import type { NextConfig } from "next";
import NextObfuscator from 'nextjs-obfuscator';

const nextConfig: NextConfig = {
  / config options here /
};

const withObfuscator = NextObfuscator({
    compact: true,
    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 0.75,
    deadCodeInjection: true,
    stringEncoding: true,
    stringEncodingThreshold: 0.75,
    splitStrings: true,
});

export default withObfuscator({
    nextConfig
});
 
 */