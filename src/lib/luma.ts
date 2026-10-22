import { createServerFn } from "@tanstack/react-start";
import type { Listing } from "@/lib/domain";

const SAMPLE: Listing[] = [
  {
    name: "Agentic AI in Financial Services and Insurance",
    start: "2026-10-22T16:00:00.000Z",
    venue: "IFX Payments, City of London",
    url: "https://lu.ma/gkmdzbk9",
    guests: null,
  },
  {
    name: "Community office hours",
    start: "2026-10-24T11:00:00.000Z",
    venue: "Shoreditch",
    url: "https://lu.ma/",
    guests: 18,
  },
  {
    name: "Thursday builders' social",
    start: "2026-10-29T18:00:00.000Z",
    venue: "London",
    url: "https://lu.ma/",
    guests: 40,
  },
];

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function readListings(payload: unknown): Listing[] {
  const root = asRecord(payload);
  const entries = Array.isArray(root?.entries) ? root.entries : [];
  const listings: Listing[] = [];
  for (const entry of entries) {
    const row = asRecord(entry);
    const event = asRecord(row?.event);
    if (!event) continue;
    const name = String(event.name ?? "").trim();
    const start = String(event.start_at ?? "").trim();
    if (!name || !start) continue;
    const geo = asRecord(event.geo_address_info);
    const venue =
      String(geo?.short_address ?? geo?.address ?? geo?.full_address ?? event.location_type ?? "London").trim() ||
      "London";
    const slug = String(event.url ?? "").trim();
    const guestsRaw = row?.guest_count ?? event.guest_count;
    const guests = typeof guestsRaw === "number" ? guestsRaw : null;
    listings.push({
      name,
      start,
      venue,
      url: slug ? `https://lu.ma/${slug}` : "https://lu.ma/",
      guests,
    });
    if (listings.length >= 8) break;
  }
  return listings;
}

export const pullLumaWeek = createServerFn({ method: "POST" })
  .validator(() => ({}))
  .handler(async () => {
    try {
      const res = await fetch(
        "https://api.lu.ma/discover/get-paginated-events?discover_place_api_id=discplace-QCcNk3HXowOR97j&pagination_limit=20",
        {
          signal: AbortSignal.timeout(12000),
          headers: { Accept: "application/json", "User-Agent": "EventScrunch/0.1" },
        },
      );
      if (!res.ok) {
        return {
          ok: true as const,
          source: "sample" as const,
          note: `Luma returned ${res.status}, so this is a sample week — not live.`,
          events: SAMPLE,
        };
      }
      const events = readListings(await res.json());
      if (!events.length) {
        return {
          ok: true as const,
          source: "sample" as const,
          note: "Luma came back empty, so this is a sample week — not live.",
          events: SAMPLE,
        };
      }
      return {
        ok: true as const,
        source: "luma" as const,
        note: "Live from the public Luma London discover feed. Read-only.",
        events,
      };
    } catch {
      return {
        ok: true as const,
        source: "sample" as const,
        note: "Couldn't reach Luma, so this is a sample week — not live.",
        events: SAMPLE,
      };
    }
  });
