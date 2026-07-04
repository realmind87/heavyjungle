import Image, { type ImageProps } from "next/image";

type RemoteImageProps = Omit<ImageProps, "src" | "alt"> & {
  src: string;
  alt: string;
};

/** S3·YouTube 등 원격 이미지 — next/image 최적화 래퍼 */
export function RemoteImage({ src, alt, className, ...rest }: RemoteImageProps) {
  return <Image src={src} alt={alt} className={className} {...rest} />;
}
