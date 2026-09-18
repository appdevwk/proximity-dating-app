import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  // 禁用 Next.js 热重载，由 nodemon 处理重编译
  reactStrictMode: false,
  serverExternalPackages: [
    '@tensorflow/tfjs-node',
    '@vladmandic/face-api',
    'tesseract.js',
    'tesseract.js-core',
    'sharp',
  ],
  // Vercel: keep the ML/OCR runtime out of serverless bundles. The dockerized
  // home-server deployment performs face recognition + document OCR in-process,
  // but a Vercel function tracing @tensorflow/tfjs-node (~390MB native),
  // face-api, and tesseract.js would blow past the 250MB unzipped limit. Those
  // routes are DB-backed and only work on the SQLite deployment anyway.
  outputFileTracingExcludes: {
    '/api/verification/photo': [
      './node_modules/@tensorflow/**/*',
      './node_modules/@vladmandic/face-api/**/*',
    ],
    '/api/verification/id': [
      './node_modules/@tensorflow/**/*',
      './node_modules/@vladmandic/face-api/**/*',
      './node_modules/tesseract.js/**/*',
      './node_modules/tesseract.js-core/**/*',
      './node_modules/@tesseract.js/**/*',
    ],
    '/api/verification/liveness': [
      './node_modules/@tensorflow/**/*',
      './node_modules/@vladmandic/face-api/**/*',
    ],
  },
  webpack: (config, { dev }) => {
    if (dev) {
      // 禁用 webpack 的热模块替换
      config.watchOptions = {
        ignored: ['**/*'], // 忽略所有文件变化
      };
    }
    return config;
  },
  eslint: {
    // 构建时忽略ESLint错误
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
