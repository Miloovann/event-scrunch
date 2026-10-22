import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { CalendarClock, Sparkles } from "lucide-react";
import { Field, GhostButton, PrimaryButton, Shell, StatusMark, controlClass } from "@/components/desk-ui";
import {
  APPROVAL_KEYS,
  type Alcohol,
  type Digest,
  approvedCount,
  emptyBrief,
  formatIso,
  formatWhen,
  hoursLabel,
  leadMinutes,
  pieceTotal,
  savedMinutes,
  writeDigest,
  DIGEST_MINUTES,
  LEAD_MINUTES,
} from "@/lib/domain";
import { pullLumaWeek } from "@/lib/luma";
import { polishCopy } from "@/lib/ai";
import { hydrateDesk, useDesk } from "@/lib/store";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const hydrated = useDesk((s) => s.hydrated);
  const events = useDesk((s) => s.events);
  const digest = useDesk((s) => s.digest);
  const addFromBrief = useDesk((s) => s.addFromBrief);
  const setDigest = useDesk((s) => s.setDigest);
  const setDigestApproval = useDesk((s) => s.setDigestApproval);
  const navigate = useNavigate();

  useEffect(() => {
    void hydrateDesk();
  }, []);

  const [idea, setIdea] = useState("Thursday dumpling social in Shoreditch for 24, boards not slides");
  const [date, setDate] = useState(emptyBrief().date);
  const [start, setStart] = useState("19:00");
  const [end, setEnd] = useState("22:00");
  const [area, setArea] = useState("Shoreditch");
  const [venue, setVenue] = useState("");
  const [capacity, setCapacity] = useState(24);
  const [budgetCap, setBudgetCap] = useState(280);
  const [alcohol, setAlcohol] = useState<Alcohol>("served");
  const [pulling, setPulling] = useState(false);
  const [polishing, setPolishing] = useState(false);
  const [note, setNote] = useState("");

  if (!hydrated) {
    return (
      <Shell>
        <p className="text-muted">Opening the desk…</p>
      </Shell>
    );
  }

  const writing = events.reduce((sum, event) => sum + savedMinutes(event), 0) + (digest ? DIGEST_MINUTES : 0);
  const lead =
    events.reduce((sum, event) => sum + leadMinutes(event), 0) + (digest && digest.approval === "draft" ? LEAD_MINUTES : 0);
  const openApprovals =
    events.reduce((sum, event) => sum + (APPROVAL_KEYS.length - approvedCount(event)), 0) +
    (digest && digest.approval === "draft" ? 1 : 0);

  function build(form: FormEvent) {
    form.preventDefault();
    const base = emptyBrief(idea);
    const id = addFromBrief({
      ...base,
      idea: idea.trim(),
      title: base.title,
      date,
      start,
      end,
      area: area.trim() || base.area,
      venue: venue.trim(),
      capacity,
      budgetCap,
      alcohol,
      interests: [],
      receipts: [],
    });
    void navigate({ to: "/events/$eventId", params: { eventId: id } });
  }

  async function pullWeek() {
    setPulling(true);
    setNote("");
    const result = await pullLumaWeek();
    const copy = writeDigest(result.events);
    const next: Digest = {
      pulledAt: new Date().toISOString(),
      source: result.source,
      note: result.note,
      events: result.events,
      newsletter: copy.newsletter,
      groupMessage: copy.groupMessage,
      approval: "draft",
    };
    setDigest(next);
    setPulling(false);
    setNote(result.note);
  }

  async function polishDigest() {
    if (!digest) return;
    setPolishing(true);
    setNote("");
    const result = await polishCopy({
      data: {
        kind: "weekly newsletter",
        draft: digest.newsletter,
        context: digest.events.map((event) => `${event.name} | ${event.start} | ${event.venue} | ${event.url}`).join("\n"),
      },
    });
    setPolishing(false);
    if (!result.ok) {
      setNote(result.error);
      return;
    }
    setDigest({ ...digest, newsletter: result.text, approval: "draft" });
    setNote("Newsletter redrafted. Approve it before anyone sends it.");
  }

  return (
    <Shell>
      <section className="grid gap-3 sm:grid-cols-3">
        <Stat kicker="Writing replaced" value={hoursLabel(writing)} detail="Drafted by the desk, not typed by a volunteer." />
        <Stat kicker="Still on the lead" value={hoursLabel(lead)} detail={`${openApprovals} approval${openApprovals === 1 ? "" : "s"} left, about 2 min each.`} />
        <Stat kicker="Packs on the desk" value={String(events.length)} detail="Each one is a full run sheet, not a note." />
      </section>

      <form onSubmit={build} className="mt-6 rounded-xl border border-line bg-surface p-4 sm:p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl">New event</h1>
            <p className="text-sm text-muted">A one-line idea is enough. The rest are the facts the pack must not invent.</p>
          </div>
        </div>
        <div className="grid gap-3">
          <Field label="Idea">
            <textarea
              className={controlClass}
              rows={2}
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              required
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Date">
              <input className={controlClass} type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </Field>
            <Field label="Start">
              <input className={controlClass} type="time" value={start} onChange={(e) => setStart(e.target.value)} required />
            </Field>
            <Field label="End">
              <input className={controlClass} type="time" value={end} onChange={(e) => setEnd(e.target.value)} required />
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Area">
              <input className={controlClass} value={area} onChange={(e) => setArea(e.target.value)} />
            </Field>
            <Field label="Venue">
              <input className={controlClass} value={venue} placeholder="Leave blank if it isn't booked" onChange={(e) => setVenue(e.target.value)} />
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Seats">
              <input
                className={`${controlClass} tabular-nums`}
                type="number"
                min={1}
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
              />
            </Field>
            <Field label="Budget cap (£)">
              <input
                className={`${controlClass} tabular-nums`}
                type="number"
                min={0}
                value={budgetCap}
                onChange={(e) => setBudgetCap(Number(e.target.value))}
              />
            </Field>
            <Field label="Alcohol">
              <select className={controlClass} value={alcohol} onChange={(e) => setAlcohol(e.target.value as Alcohol)}>
                <option value="served">Served, with a no-alcohol option</option>
                <option value="byo">Bring your own</option>
                <option value="none">None</option>
              </select>
            </Field>
          </div>
        </div>
        <div className="mt-4">
          <PrimaryButton type="submit">Build the pack</PrimaryButton>
        </div>
      </form>

      <section className="mt-8">
        <h2 className="font-display text-2xl">On the desk</h2>
        <ul className="mt-3 grid gap-3">
          {events.map((event) => {
            const done = approvedCount(event);
            return (
              <li key={event.id}>
                <Link
                  to="/events/$eventId"
                  params={{ eventId: event.id }}
                  className="block rounded-xl border border-line bg-surface p-4 hover:border-teal"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="font-display text-xl">{event.title}</h3>
                      <p className="text-sm text-muted">
                        {formatWhen(event.date, event.start, event.end)} · {event.area || "Area to confirm"} · {event.capacity} seats
                      </p>
                    </div>
                    <p className="text-sm font-semibold tabular-nums">
                      {done} of {APPROVAL_KEYS.length} approved
                    </p>
                  </div>
                  <p className="mt-2 text-sm text-muted">{hoursLabel(pieceTotal())} of writing replaced · {hoursLabel(leadMinutes(event))} left on you</p>
                </Link>
              </li>
            );
          })}
          {events.length === 0 && <li className="text-sm text-muted">Nothing on the desk yet.</li>}
        </ul>
      </section>

      <section className="mt-8 rounded-xl border border-line bg-surface p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl">Weekly digest</h2>
            <p className="max-w-xl text-sm text-muted">
              Pulls this week's public London events from Luma and drafts the newsletter and the group message. You approve before anything is copied out.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <PrimaryButton onClick={() => void pullWeek()} disabled={pulling}>
              <CalendarClock className="size-4" aria-hidden="true" />
              {pulling ? "Pulling…" : "Pull Luma"}
            </PrimaryButton>
            <GhostButton onClick={() => void polishDigest()} disabled={!digest || polishing}>
              <Sparkles className="size-4" aria-hidden="true" />
              {polishing ? "Rewriting…" : "Polish with Grok"}
            </GhostButton>
          </div>
        </div>
        {note && <p className="mt-3 text-sm text-muted">{note}</p>}
        {digest && (
          <div className="mt-4 grid gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <StatusMark approval={digest.approval} />
              <span className="text-sm text-muted">
                {digest.source === "luma" ? "Live feed" : "Sample"} · {formatIso(digest.pulledAt)} · {digest.note}
              </span>
            </div>
            <ul className="grid gap-2">
              {digest.events.map((event) => (
                <li key={`${event.url}-${event.start}-${event.name}`} className="rounded-lg border border-line px-3 py-2 text-sm">
                  <p className="font-semibold">{event.name}</p>
                  <p className="text-muted">
                    {formatIso(event.start)} · {event.venue}
                    {event.guests != null ? ` · ${event.guests} going` : ""}
                  </p>
                </li>
              ))}
            </ul>
            <div>
              <h3 className="text-sm font-semibold">Newsletter draft</h3>
              <pre className="mt-2 overflow-x-auto rounded-lg bg-paper p-3 text-sm leading-relaxed whitespace-pre-wrap">{digest.newsletter}</pre>
            </div>
            <div>
              <h3 className="text-sm font-semibold">Group message</h3>
              <pre className="mt-2 overflow-x-auto rounded-lg bg-paper p-3 text-sm leading-relaxed whitespace-pre-wrap">{digest.groupMessage}</pre>
            </div>
            <div className="flex flex-wrap gap-2">
              {digest.approval === "approved" ? (
                <GhostButton onClick={() => setDigestApproval("draft")}>Return to draft</GhostButton>
              ) : (
                <PrimaryButton onClick={() => setDigestApproval("approved")}>Approve digest</PrimaryButton>
              )}
            </div>
          </div>
        )}
      </section>
    </Shell>
  );
}

function Stat({ kicker, value, detail }: { kicker: string; value: string; detail: string }) {
  return (
    <article className="rounded-xl border border-line bg-surface p-4">
      <p className="text-xs font-semibold tracking-[0.14em] text-teal uppercase">{kicker}</p>
      <p className="mt-1 font-display text-3xl tabular-nums">{value}</p>
      <p className="mt-1 text-sm text-muted">{detail}</p>
    </article>
  );
}
