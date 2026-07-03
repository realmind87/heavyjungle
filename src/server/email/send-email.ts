import "server-only";

import { env } from "@/lib/env";

type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

export async function sendEmail({ to, subject, text, html }: SendEmailInput): Promise<void> {
  if (env.RESEND_API_KEY && env.EMAIL_FROM) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: env.EMAIL_FROM,
        to: [to],
        subject,
        text,
        html,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`이메일 발송에 실패했습니다: ${body}`);
    }

    return;
  }

  if (env.NODE_ENV === "development") {
    console.info("\n--- Email (dev) ---");
    console.info(`To: ${to}`);
    console.info(`Subject: ${subject}`);
    console.info(text);
    console.info("---\n");
    return;
  }

  throw new Error("이메일 발송이 설정되지 않았습니다.");
}
