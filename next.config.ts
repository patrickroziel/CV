import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // iPhone Safari does not paint images served as attachments.
    contentDispositionType: "inline",
    contentSecurityPolicy: "script-src 'none'; frame-src 'none';",
    remotePatterns: [
      // Legacy media still referenced in defaults / localStorage
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
      // Vercel Blob public URLs
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "public.blob.vercel-storage.com",
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
