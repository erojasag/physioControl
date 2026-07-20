// Email sender behind an interface so it can be stubbed in dev (build-kit §1).
// ConsoleMailer logs; ResendMailer sends for real when RESEND_API_KEY is set.
export const MAILER = Symbol("MAILER");

export interface Mailer {
  send(msg: {
    to: string;
    subject: string;
    text: string;
  }): Promise<void>;
}

export class ConsoleMailer implements Mailer {
  async send(msg: { to: string; subject: string; text: string }): Promise<void> {
    // eslint-disable-next-line no-console
    console.log(`[mail:console] to=${msg.to} subject="${msg.subject}"`);
  }
}

export class ResendMailer implements Mailer {
  constructor(
    private readonly apiKey: string,
    private readonly from: string,
  ) {}

  async send(msg: { to: string; subject: string; text: string }): Promise<void> {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: this.from,
        to: msg.to,
        subject: msg.subject,
        text: msg.text,
      }),
    });
    if (!res.ok) {
      throw new Error(`Resend send failed: ${res.status}`);
    }
  }
}
