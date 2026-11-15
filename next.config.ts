import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // iPhone Safari does not paint images served as attachments.
    contentDispositionType: "inline",
    contentSecurityPolicy: "script-src 'none'; frame-src 'none';",
    remotePatterns: [
      // Existing published files. New uploads go to Cloudflare R2.
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "media.patrickroziel.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/",
        destination: "/notes",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
