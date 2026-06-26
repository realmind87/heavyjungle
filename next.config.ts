import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async redirects() {
    return [
      { source: "/board/:slug/:postId/edit", destination: "/posts/:postId/edit", permanent: true },
      { source: "/board/:slug/:postId", destination: "/posts/:postId", permanent: true },
      { source: "/board/:slug/write", destination: "/write", permanent: true },
      { source: "/board/:slug", destination: "/", permanent: true },
      { source: "/boards/manage", destination: "/", permanent: true },
      { source: "/boards/new", destination: "/", permanent: true },
      { source: "/boards/:slug/edit", destination: "/", permanent: true },
    ];
  },
};

export default nextConfig;
