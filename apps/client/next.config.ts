import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname, "../.."),
  },
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
