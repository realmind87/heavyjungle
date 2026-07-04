import type { Instrumentation } from "next";
import { logger } from "@/lib/logger";

/**
 * 모든 서버 측 오류(RSC 렌더·라우트 핸들러·서버 액션)를 구조화 로그로 남긴다.
 * 운영에서 digest만 노출되는 "Server Components render" 오류의 실제 원인을
 * 서버 로그(docker logs)에서 추적할 수 있게 한다.
 */
export const onRequestError: Instrumentation.onRequestError = (err, request, context) => {
  logger.error("server request error", err, {
    path: request.path,
    method: request.method,
    routerKind: context.routerKind,
    routePath: context.routePath,
    routeType: context.routeType,
    renderSource: context.renderSource,
  });
};
