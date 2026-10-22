import { createServerFn } from "@tanstack/react-start";
import type { CommunityEvent } from "@/lib/domain";
import { budgetTotal, formatWhen, money } from "@/lib/domain";

const NOTION_VERSION = "2022-06-28";

type Rich = { type: "text"; text: { content: string } };
type Block = Record<string, unknown>;

function text(content: string): Rich[] {
  const chunks: Rich[] = [];
  const clean = content.replace(/\s+/g, " ").trim() || " ";
  for (let i = 0; i < clean.length; i += 1800) {
    chunks.push({ type: "text", text: { content: clean.slice(i, i + 1800) } });
  }
  return chunks;
}

function heading(content: string): Block {
  return { object: "block", type: "heading_2", heading_2: { rich_text: text(content) } };
}

function para(content: string): Block {
  return { object: "block", type: "paragraph", paragraph: { rich_text: text(content) } };
}

function bullet(content: string): Block {
  return { object: "block", type: "bulleted_list_item", bulleted_list_item: { rich_text: text(content) } };
}

function blocksFor(event: CommunityEvent): Block[] {
  const total = budgetTotal(event.budget);
  const gap = event.budgetCap - total;
  const place = [event.venue || "Venue to confirm", event.area].filter(Boolean).join(", ");
  return [
    para(formatWhen(event.date, event.start, event.end) + " · " + place),
    para(event.theme || event.idea),
    heading("Run sheet"),
    ...event.runSheet.map((item) => bullet(item.time + " " + item.title + " — " + item.owner + ". " + item.detail)),
    heading("Budget"),
    ...event.budget.map((line) => bullet(line.label + ": " + money(line.amount) + " (" + line.source + "). " + line.note)),
    para("Total " + money(total) + ". Cap " + money(event.budgetCap) + ". " + (gap >= 0 ? "Under cap by " + money(gap) + "." : "Over cap by " + money(Math.abs(gap)) + ".")),
    heading("Rota"),
    ...event.rota.map((slot) => bullet(slot.role + " (" + slot.window + "): " + (slot.open ? "OPEN" : slot.person) + ". " + slot.note)),
    heading("Interest replies"),
    ...(event.interests.length ? event.interests.map((row) => bullet(row.name + " — " + row.dietary + ", alcohol " + row.alcohol + (row.canHelp ? ", can help" : "") + ". " + row.tablePref + " " + row.notes)) : [para("No replies yet.")]),
    heading("Event page"),
    para(event.promo.page),
  ].slice(0, 90);
}

export const pushToNotion = createServerFn({ method: "POST" })
  .validator((data: unknown): CommunityEvent => {
    if (!data || typeof data !== "object") throw new Error("Missing event.");
    const event = data as CommunityEvent;
    if (!event.title || !event.id) throw new Error("That pack has no title.");
    return event;
  })
  .handler(async ({ data }) => {
    const token = process.env.NOTION_TOKEN;
    const parent = process.env.NOTION_PARENT_PAGE_ID;
    if (!token || !parent) {
      return { ok: false as const, error: "Notion isn't configured. Set NOTION_TOKEN and NOTION_PARENT_PAGE_ID, then redeploy." };
    }
    try {
      const res = await fetch("https://api.notion.com/v1/pages", {
        method: "POST",
        signal: AbortSignal.timeout(20000),
        headers: { Authorization: "Bearer " + token, "Notion-Version": "2022-06-28", "Content-Type": "application/json" },
        body: JSON.stringify({ parent: { page_id: parent }, properties: { title: { title: text(data.title) } }, children: blocksFor(data) }),
      });
      const body = await res.json() as { url?: string; message?: string };
      if (!res.ok) return { ok: false as const, error: body.message || "Notion returned " + res.status + "." };
      return { ok: true as const, url: body.url || "https://www.notion.so" };
    } catch {
      return { ok: false as const, error: "Couldn't reach Notion." };
    }
  });
