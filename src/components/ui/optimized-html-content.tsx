"use client";

import parse, { Element, type DOMNode } from "html-react-parser";
import { RemoteImage } from "@/components/ui/remote-image";

type OptimizedHtmlContentProps = {
  html: string;
  className?: string;
  imageClassName?: string;
};

function isGifSrc(src: string): boolean {
  try {
    const pathname = new URL(src, "http://local").pathname.toLowerCase();
    return pathname.endsWith(".gif");
  } catch {
    return src.toLowerCase().includes(".gif");
  }
}

/** sanitize된 HTML — img는 next/image(RemoteImage), GIF는 unoptimized */
export function OptimizedHtmlContent({ html, className = "", imageClassName = "" }: OptimizedHtmlContentProps) {
  const content = parse(html, {
    replace(domNode: DOMNode) {
      if (!(domNode instanceof Element) || domNode.name !== "img") return;

      const src = domNode.attribs.src;
      if (!src) return;

      const alt = domNode.attribs.alt ?? "";
      const classNameFromAttr = domNode.attribs.class ?? "";
      const mergedClass = [imageClassName, classNameFromAttr].filter(Boolean).join(" ") || undefined;

      return (
        <RemoteImage
          src={src}
          alt={alt}
          width={800}
          height={600}
          sizes="(max-width: 768px) 100vw, 720px"
          className={mergedClass ?? "max-w-full h-auto"}
          unoptimized={isGifSrc(src)}
        />
      );
    },
  });

  return <div className={className}>{content}</div>;
}
