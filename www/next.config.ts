import { fileURLToPath } from 'url';
import type { NextConfig } from "next";
import webpack from 'webpack';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const __filename = fileURLToPath(import.meta.url);
const __dirname = import.meta.dirname || fileURLToPath(new URL('.', import.meta.url));

const isNetlify = process.env.NETLIFY === 'true' ||
  process.env.CONTEXT === 'production' ||
  process.env.NETLIFY_LOCAL === 'true' ||
  (process.env.DEPLOY_URL && process.env.DEPLOY_URL.includes('netlify'));

const isVercel = process.env.VERCEL === 'true';
const isDev = process.env.NODE_ENV === 'development';

console.log('✅ Is Netlify environment:', isNetlify);
console.log('✅ Is Vercel environment:', isVercel);

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['subconverter-wasm', '../pkg'],
  webpack: (config, { isServer }) => {
    console.log(`⚙️ Configuring webpack (isServer: ${isServer})`);
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
      topLevelAwait: true,
    };
    if (config.output) {
      config.output.webassemblyModuleFilename = isServer
        ? '../static/wasm/[modulehash].wasm'
        : 'static/wasm/[modulehash].wasm';
    }
    config.plugins = config.plugins || [];
    config.plugins.push(
      new webpack.DefinePlugin({
        'process.env.WASM_DEBUG': JSON.stringify(true),
        'process.env.DEPLOY_ENV': JSON.stringify(
          isNetlify ? 'netlify' : (isVercel ? 'vercel' : 'standard')
        ),
      })
    );
    return config;
  },
  outputFileTracingIncludes: {
    '/api/': ['./node_modules/subconverter-wasm/**/*'],
  },
};

export default withNextIntl(nextConfig);
