/**
 * HelixLab production build configuration.
 * Paper.js ships Node-only jsdom shims even when consumed by Ketcher in a browser.
 * Webpack must not bundle those shims into the client bundle; they are never
 * needed for browser canvas rendering. See paperjs/paper.js issue #2050.
 */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  webpack(config) {
    {
      config.resolve.alias = {
        ...config.resolve.alias,
        'jsdom/lib/jsdom/living/generated/utils': false,
        'jsdom': false,
        'canvas': false,
        'paper/dist/node/self.js': false,
        'paper/dist/node/canvas.js': false,
        'paper/dist/node/extend.js': false,
      };
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
  async headers() {
    return [{
      source: '/:path*',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      ],
    }];
  },
};
export default nextConfig;
