import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

const fallbackCspHeader = `
  default-src 'none';
  script-src 'self'${isDev ? " 'unsafe-eval'" : ""} https://apis.google.com https://kit.fontawesome.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://ka-f.fontawesome.com;
  img-src 'self' blob: data: https://lh3.googleusercontent.com;
  font-src 'self' data: https://fonts.gstatic.com https://ka-f.fontawesome.com;
  connect-src 'self' https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://*.firebaseapp.com https://generativelanguage.googleapis.com https://ka-f.fontawesome.com;
  frame-src 'self' https://*.firebaseapp.com https://accounts.google.com;
  manifest-src 'self';
  worker-src 'self' blob:;
  media-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`
  .replace(/\s{2,}/g, " ")
  .trim();

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), browsing-topics=(), payment=(), usb=()",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
};

export default nextConfig;
