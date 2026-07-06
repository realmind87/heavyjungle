import Script from "next/script";
import { getUmamiPublicConfig } from "@/lib/umami-env";

export function UmamiScript() {
  const config = getUmamiPublicConfig();
  if (!config) return null;

  return (
    <Script
      async
      defer
      data-website-id={config.websiteId}
      src={`${config.src}/script.js`}
      strategy="afterInteractive"
    />
  );
}
