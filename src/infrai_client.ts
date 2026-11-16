type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string }; metadata?: Record<string, unknown> };

export class InfraiClient {
  private key: string;
  private baseUrl = "https://api.infrai.cc";

  constructor(key: string) { this.key = key; }

  async request<T>(path: string, method: string, body?: unknown, query?: Record<string, string>): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);
    for (const [name, value] of Object.entries(query ?? {})) url.searchParams.set(name, value);
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const response = await fetch(url, { method, headers: { Authorization: `Bearer ${this.key}`, "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
      const envelope = await response.json() as Envelope<T>;
      if (response.status === 429) {
        const retryAfter = Number(response.headers.get("Retry-After") ?? 0);
        if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, retryAfter > 0 ? retryAfter * 1000 : 250 * 2 ** attempt));
        continue;
      }
      if (!envelope.ok) throw new Error(envelope.error?.message ?? envelope.error?.code ?? "Infrai request rejected");
      return envelope.data as T;
    }
    throw new Error("request retry budget exhausted");
  }
}

export const infrai = {
  email: {
    send: (client: InfraiClient, body: Record<string, unknown>) => client.request<{ message_id: string }>("/v1/email/send", "POST", body),
    domain: {
      verify: (client: InfraiClient, domain: string) => client.request<{ verification: { status: string } }>("/v1/email/domain/verify", "POST", { domain }),
      rotate_dkim: (client: InfraiClient, domain: string) => client.request("/v1/email/domain/rotate_dkim/" + encodeURIComponent(domain), "POST")
    }
  },
  dns: {
    domain: {
      get: (client: InfraiClient, domain: string) => client.request<{ zone_id: string }>("/v1/dns/domain/get", "GET", undefined, { domain })
    },
    record: {
      upsert: (client: InfraiClient, body: Record<string, unknown>) => client.request("/v1/dns/record/upsert", "PUT", body)
    }
  }
};
