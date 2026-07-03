/**
 * S3 호환 스토리지 클라이언트 (MinIO).
 * @aws-sdk/client-s3, @aws-sdk/s3-request-presigner 사용.
 */
import "server-only";

import { DeleteObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "@/lib/env";

const globalForS3 = globalThis as unknown as { s3Client?: S3Client; s3PresignClient?: S3Client };

/** 브라우저 업로드용 — S3_PUBLIC_URL 기준 (HTTPS). 서버 내부 통신은 getS3Client() 사용 */
function getS3PresignEndpoint(): string {
  const publicBase = new URL(env.S3_PUBLIC_URL);
  const bucketPath = `/${env.S3_BUCKET}`;
  let path = publicBase.pathname.replace(/\/$/, "");
  if (path.endsWith(bucketPath)) {
    path = path.slice(0, -bucketPath.length);
  }
  if (!path || path === "/") {
    return publicBase.origin;
  }
  return `${publicBase.origin}${path}`;
}

/** S3Client 싱글톤 — dev HMR 시 globalThis 캐싱 (서버 → MinIO 내부 통신) */
export function getS3Client(): S3Client {
  if (!globalForS3.s3Client) {
    globalForS3.s3Client = new S3Client({
      endpoint: env.S3_ENDPOINT,
      region: env.S3_REGION,
      credentials: {
        accessKeyId: env.S3_ACCESS_KEY_ID,
        secretAccessKey: env.S3_SECRET_ACCESS_KEY,
      },
      forcePathStyle: env.S3_FORCE_PATH_STYLE,
    });
  }
  return globalForS3.s3Client;
}

function getS3PresignClient(): S3Client {
  if (!globalForS3.s3PresignClient) {
    globalForS3.s3PresignClient = new S3Client({
      endpoint: getS3PresignEndpoint(),
      region: env.S3_REGION,
      credentials: {
        accessKeyId: env.S3_ACCESS_KEY_ID,
        secretAccessKey: env.S3_SECRET_ACCESS_KEY,
      },
      forcePathStyle: env.S3_FORCE_PATH_STYLE,
    });
  }
  return globalForS3.s3PresignClient;
}

export async function createPresignedPutUrl(
  key: string,
  contentType: string,
  size: number,
  expiresInSeconds = 60,
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: key,
    ContentType: contentType,
    ContentLength: size,
  });
  return getSignedUrl(getS3PresignClient(), command, { expiresIn: expiresInSeconds });
}

export async function headObject(key: string) {
  return getS3Client().send(
    new HeadObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: key,
    }),
  );
}

export async function deleteObject(key: string): Promise<void> {
  await getS3Client().send(
    new DeleteObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: key,
    }),
  );
}
