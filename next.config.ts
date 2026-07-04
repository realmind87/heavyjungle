import type { NextConfig } from "next";

type RemotePattern = NonNullable<NonNullable<NextConfig["images"]>["remotePatterns"]>[number];

function parseRemotePattern(url: string): RemotePattern | null {
  try {
    const parsed = new URL(url);
    return {
      protocol: parsed.protocol.replace(":", "") as "http" | "https",
      hostname: parsed.hostname,
      port: parsed.port || undefined,
      pathname: "/**",
    };
  } catch {
    return null;
  }
}

function buildImageRemotePatterns(): RemotePattern[] {
  const patterns: RemotePattern[] = [
    { protocol: "https", hostname: "i.ytimg.com", pathname: "/**" },
    { protocol: "https", hostname: "img.youtube.com", pathname: "/**" },
  ];

  for (const envKey of ["S3_PUBLIC_URL", "NEXT_PUBLIC_S3_PUBLIC_URL"] as const) {
    const value = process.env[envKey];
    if (!value) continue;
    const pattern = parseRemotePattern(value);
    if (pattern && !patterns.some((p) => p.hostname === pattern.hostname && p.port === pattern.port)) {
      patterns.push(pattern);
    }
  }

  return patterns;
}

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: buildImageRemotePatterns(),
  },
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
