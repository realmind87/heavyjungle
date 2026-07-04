/**
 * 경량 구조화 로거 (외부 의존성 없음).
 * - production: JSON 한 줄 — 로그 수집/파싱 용이 (docker logs 등)
 * - development: 사람이 읽기 쉬운 형태
 */
type LogLevel = "debug" | "info" | "warn" | "error";
type LogContext = Record<string, unknown>;

function serializeError(error: unknown): LogContext {
  if (error instanceof Error) {
    return { errorName: error.name, errorMessage: error.message, stack: error.stack };
  }
  return { error: String(error) };
}

function write(level: LogLevel, message: string, context?: LogContext) {
  const entry = { level, message, time: new Date().toISOString(), ...context };
  const isProd = process.env.NODE_ENV === "production";
  const line = isProd
    ? JSON.stringify(entry)
    : `[${level}] ${message}${context ? ` ${JSON.stringify(context)}` : ""}`;

  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
}

export const logger = {
  debug: (message: string, context?: LogContext) => write("debug", message, context),
  info: (message: string, context?: LogContext) => write("info", message, context),
  warn: (message: string, context?: LogContext) => write("warn", message, context),
  /** error 인자를 넘기면 name/message/stack을 자동 직렬화 */
  error: (message: string, error?: unknown, context?: LogContext) =>
    write("error", message, { ...(error !== undefined ? serializeError(error) : {}), ...context }),
};
