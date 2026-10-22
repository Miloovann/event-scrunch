import { createServerFn } from "@tanstack/react-start";

interface PolishInput {
  kind: string;
  draft: string;
  context: string;
}

export const polishCopy = createServerFn({ method: "POST" })
  .validator((data: unknown): PolishInput => {
    if (!data || typeof data !== "object") throw new Error("Missing copy.");
    const raw = data as Partial<PolishInput>;
    const draft = String(raw.draft ?? "").trim();
    const kind = String(raw.kind ?? "copy").slice(0, 40);
    const context = String(raw.context ?? "").slice(0, 2500);
    if (!draft) throw new Error("Nothing to polish.");
    return { kind, draft: draft.slice(0, 6000), context };
  })
  .handler(async ({ data }) => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) {
      return { ok: false as const, error: "Grok isn't available in this preview. The template draft still stands." };
    }
    try {
      const res = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        signal: AbortSignal.timeout(25000),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "grok-4.5",
          temperature: 0.4,
          max_tokens: 700,
          messages: [
            {
              role: "system",
              content:
                "You rewrite community-event copy for a host to approve. UK English. Keep every fact in the draft and context. Do not invent sponsors, prices, headcounts, venues or times. No hashtag stacks. No emoji. Return only the rewritten copy.",
            },
            {
              role: "user",
              content: `Channel: ${data.kind}\n\nContext:\n${data.context}\n\nDraft:\n${data.draft}`,
            },
          ],
        }),
      });
      if (!res.ok) {
        return { ok: false as const, error: `Grok didn't answer (${res.status}). The template draft still stands.` };
      }
      const body = (await res.json()) as {
        choices?: { message?: { content?: unknown } }[];
      };
      const content = body.choices?.[0]?.message?.content;
      const text =
        typeof content === "string"
          ? content
          : Array.isArray(content)
            ? content.map((part) => (typeof part === "object" && part && "text" in part ? String(part.text ?? "") : "")).join("")
            : "";
      const cleaned = text.trim();
      if (!cleaned) return { ok: false as const, error: "Grok returned an empty draft." };
      return { ok: true as const, text: cleaned };
    } catch {
      return { ok: false as const, error: "Grok took too long. The template draft still stands." };
    }
  });
