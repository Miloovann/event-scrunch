export type Alcohol = "served" | "byo" | "none";
export type Dietary = "omnivore" | "vegetarian" | "vegan" | "halal" | "gluten-free";
export type GuestStatus = "expected" | "checked-in" | "cancelled" | "no-show";
export type Approval = "draft" | "approved";
export type EventKind = "workshop" | "talk" | "meal" | "social";

export const APPROVAL_KEYS = [
  "runSheet",
  "budget",
  "rota",
  "page",
  "ghost",
  "whatsapp",
  "linkedin",
  "discord",
  "visual",
  "night",
] as const;

export type ApprovalKey = (typeof APPROVAL_KEYS)[number];

export const PIECE_MINUTES: Record<ApprovalKey, number> = {
  runSheet: 50,
  budget: 35,
  rota: 40,
  page: 30,
  ghost: 45,
  whatsapp: 12,
  linkedin: 15,
  discord: 12,
  visual: 70,
  night: 20,
};

export const DIGEST_MINUTES = 30;
export const LEAD_MINUTES = 2;

export const APPROVAL_LABEL: Record<ApprovalKey, string> = {
  runSheet: "Run sheet",
  budget: "Budget",
  rota: "Rota",
  page: "Event page",
  ghost: "Newsletter",
  whatsapp: "WhatsApp",
  linkedin: "LinkedIn",
  discord: "Discord",
  visual: "Poster",
  night: "Night update",
};

export interface Receipt {
  id: string;
  vendor: string;
  note: string;
  amount: number;
}

export interface Interest {
  id: string;
  name: string;
  dietary: Dietary;
  alcohol: "yes" | "no" | "either";
  canHelp: boolean;
  freeWindow: string;
  tablePref: string;
  notes: string;
}

export interface RunItem {
  id: string;
  time: string;
  title: string;
  owner: string;
  detail: string;
}

export interface BudgetLine {
  id: string;
  label: string;
  amount: number;
  note: string;
  source: "receipt" | "estimate";
}

export interface RotaSlot {
  id: string;
  role: string;
  window: string;
  person: string;
  note: string;
  open: boolean;
}

export interface Guest {
  id: string;
  name: string;
  status: GuestStatus;
  dietary: string;
}

export interface Promo {
  page: string;
  ghost: string;
  whatsapp: string;
  linkedin: string;
  discord: string;
  nightUpdate: string;
}

export interface Brief {
  idea: string;
  title: string;
  theme: string;
  date: string;
  start: string;
  end: string;
  venue: string;
  area: string;
  capacity: number;
  budgetCap: number;
  alcohol: Alcohol;
  notes: string;
  quotes: string;
  receipts: Receipt[];
  interests: Interest[];
}

export interface CommunityEvent extends Brief {
  id: string;
  kind: EventKind;
  runSheet: RunItem[];
  budget: BudgetLine[];
  rota: RotaSlot[];
  guests: Guest[];
  promo: Promo;
  approvals: Record<ApprovalKey, Approval>;
  lastChange: string;
  createdAt: string;
}

export interface Listing {
  name: string;
  start: string;
  venue: string;
  url: string;
  guests: number | null;
}

export interface Digest {
  pulledAt: string;
  source: "luma" | "sample";
  note: string;
  events: Listing[];
  newsletter: string;
  groupMessage: string;
  approval: Approval;
}

export function uid(prefix: string): string {
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}-${rand}`;
}

export function hoursLabel(mins: number): string {
  const sign = mins < 0 ? "−" : "";
  const abs = Math.abs(Math.round(mins));
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  if (h <= 0) return `${sign}${m} min`;
  if (m === 0) return `${sign}${h} h`;
  return `${sign}${h} h ${m} min`;
}

export function pieceTotal(): number {
  return APPROVAL_KEYS.reduce((sum, key) => sum + PIECE_MINUTES[key], 0);
}

export function approvedCount(event: CommunityEvent): number {
  return APPROVAL_KEYS.filter((key) => event.approvals[key] === "approved").length;
}

export function leadMinutes(event: CommunityEvent): number {
  return (APPROVAL_KEYS.length - approvedCount(event)) * LEAD_MINUTES;
}

export function savedMinutes(event: CommunityEvent): number {
  return pieceTotal();
}

export function blankApprovals(): Record<ApprovalKey, Approval> {
  return {
    runSheet: "draft",
    budget: "draft",
    rota: "draft",
    page: "draft",
    ghost: "draft",
    whatsapp: "draft",
    linkedin: "draft",
    discord: "draft",
    visual: "draft",
    night: "draft",
  };
}

export function formatWhen(date: string, start?: string, end?: string): string {
  const [y, m, d] = date.split("-").map(Number);
  if (!y || !m || !d) return date;
  const dt = new Date(Date.UTC(y, m - 1, d));
  const day = new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(dt);
  if (start && end) return `${day} · ${start}–${end}`;
  if (start) return `${day} · ${start}`;
  return day;
}

export function formatIso(iso: string): string {
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return iso;
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/London",
  }).format(dt);
}

function titleCaseIdea(idea: string): string {
  const clean = idea.replace(/\s+/g, " ").trim();
  const cut = clean.split(/[,.—–-]|\bfor\b|\bwith\b/i)[0]?.trim() || clean;
  const short = cut.length > 52 ? `${cut.slice(0, 50).replace(/\s+\S*$/, "")}` : cut;
  if (!short) return "Untitled event";
  return short.charAt(0).toUpperCase() + short.slice(1);
}

export function kindOf(idea: string, theme: string): EventKind {
  const s = `${idea} ${theme}`.toLowerCase();
  if (/workshop|hack|build session|co-working|cowork/.test(s)) return "workshop";
  if (/talk|panel|speaker|demo night|fireside|lecture/.test(s)) return "talk";
  if (/dinner|dumpling|supper|lunch|brunch|food|kitchen|meal/.test(s)) return "meal";
  return "social";
}

function inferCapacity(idea: string): number | null {
  const match = idea.match(/(\d{1,3})\s*(people|seats|pax|guests|person)/i);
  if (!match) return null;
  const n = Number(match[1]);
  return n >= 4 && n <= 400 ? n : null;
}

function inferBudget(idea: string): number | null {
  const match = idea.match(/£\s*(\d{2,5}(?:\.\d{1,2})?)/);
  if (!match) return null;
  return Number(match[1]);
}

function inferArea(idea: string): string | null {
  const match = idea.match(/\bin\s+([A-Z][A-Za-z]+(?:\s[A-Z][A-Za-z]+)?)/);
  return match?.[1] ?? null;
}

export function nextThursday(from = new Date()): string {
  const d = new Date(from);
  const day = d.getDay();
  const add = (4 - day + 7) % 7 || 7;
  d.setDate(d.getDate() + add);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

export function emptyBrief(idea = ""): Brief {
  return {
    idea,
    title: idea ? titleCaseIdea(idea) : "",
    theme: "",
    date: "2026-10-29",
    start: "19:00",
    end: "22:00",
    venue: "",
    area: inferArea(idea) ?? "London",
    capacity: inferCapacity(idea) ?? 20,
    budgetCap: inferBudget(idea) ?? 200,
    alcohol: /no alcohol|sober|soft drinks only/i.test(idea) ? "none" : "served",
    notes: "",
    quotes: "",
    receipts: [],
    interests: [],
  };
}

function shift(start: string, minutes: number): string {
  const [h, m] = start.split(":").map(Number);
  const total = (Number.isFinite(h) ? h : 19) * 60 + (Number.isFinite(m) ? m : 0) + minutes;
  const wrapped = ((total % (24 * 60)) + 24 * 60) % (24 * 60);
  const hh = Math.floor(wrapped / 60);
  const mm = wrapped % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

function alcoholLine(alcohol: Alcohol, interests: Interest[]): string {
  const no = interests.filter((i) => i.alcohol === "no").length;
  const yes = interests.filter((i) => i.alcohol === "yes").length;
  if (alcohol === "none") return "No alcohol. Soft drinks only.";
  if (alcohol === "byo") {
    return no
      ? `Bring your own if you want. ${no} ${no === 1 ? "person" : "people"} on the form asked for none, so the soft option stays obvious.`
      : "Bring your own if you want. Soft drinks stay on the table either way.";
  }
  if (!interests.length) return "Drinks are served. The form still asks who wants none.";
  return `Drinks are served. ${yes} said yes, ${no} said none — both are set out, labelled in words.`;
}

function dietarySummary(interests: Interest[]): string {
  if (!interests.length) return "No interest replies yet, so catering stays a flat estimate.";
  const counts = new Map<string, number>();
  for (const row of interests) counts.set(row.dietary, (counts.get(row.dietary) ?? 0) + 1);
  const parts = [...counts.entries()].map(([k, n]) => `${n} ${k}`);
  return `${interests.length} replies: ${parts.join(", ")}.`;
}

const RATE: Record<Dietary, number> = {
  omnivore: 8,
  vegetarian: 8,
  vegan: 9,
  halal: 9,
  "gluten-free": 9.5,
};

function foodPerHead(interests: Interest[]): { rate: number; note: string } {
  if (!interests.length) return { rate: 8.5, note: "Flat £8.50 a head until replies land." };
  const rate = interests.reduce((sum, row) => sum + RATE[row.dietary], 0) / interests.length;
  return {
    rate: Math.round(rate * 100) / 100,
    note: `Weighted from replies (${dietarySummary(interests).replace(/\.$/, "")}), then scaled to capacity.`,
  };
}

function buildRota(brief: Brief, kind: EventKind): RotaSlot[] {
  const helpers = brief.interests.filter((i) => i.canHelp);
  const pool = (helpers.length ? helpers : brief.interests).map((i) => i.name);
  const take = (index: number) => pool[index] ?? "";
  const door = shift(brief.start, -30);
  const mid = shift(brief.start, kind === "workshop" ? 70 : 40);
  const late = shift(brief.start, 100);
  const roles: Array<Omit<RotaSlot, "id" | "open"> & { open?: boolean }> =
    kind === "workshop"
      ? [
          { role: "Door", window: `${door}–${brief.start}`, person: take(0), note: "List in hand. Walk-ins only if a seat is free." },
          { role: "Facilitator", window: `${brief.start}–${mid}`, person: take(1), note: "Keep the brief to ten minutes." },
          { role: "Build support", window: `${mid}–${late}`, person: take(2), note: "Unstick tables. Don't take over someone's work." },
          { role: "Quiet table", window: `${brief.start}–${brief.end}`, person: take(3), note: "Near the door, not the speaker." },
          { role: "Close", window: `${late}–${brief.end}`, person: "", note: "Lights, leftovers, lockup." },
        ]
      : kind === "talk"
        ? [
            { role: "Door", window: `${door}–${brief.start}`, person: take(0), note: "Hold the room until the speaker is ready." },
            { role: "Host", window: `${brief.start}–${shift(brief.start, 15)}`, person: take(1), note: "Introduce by name. No surprise panels." },
            { role: "Timekeeper", window: `${brief.start}–${late}`, person: take(2), note: "Card at five minutes. Stop on time." },
            { role: "Questions", window: `${late}–${brief.end}`, person: take(3), note: "One question each. Repeat it so the room hears." },
            { role: "Close", window: `${shift(brief.end, -20)}–${brief.end}`, person: "", note: "Thanks, photo only if people opted in." },
          ]
        : [
            { role: "Door", window: `${door}–${brief.start}`, person: take(0), note: "Names from the form. Stickers, not lanyards." },
            { role: "Welcome", window: `${brief.start}–${shift(brief.start, 20)}`, person: take(1), note: "Point out food labels and the quiet table." },
            { role: "Food", window: `${shift(brief.start, 80)}–${shift(brief.start, 120)}`, person: take(2), note: "Serve labelled trays. Gluten-free stays apart." },
            { role: "Tables", window: `${shift(brief.start, 15)}–${mid}`, person: take(3), note: "Seat fixed pairs first, then open seats." },
            { role: "Close & kitchen", window: `${shift(brief.end, -25)}–${brief.end}`, person: "", note: "Kitchen clear. This slot stays open until someone claims it." },
          ];
  return roles.map((role) => ({
    id: uid("rota"),
    role: role.role,
    window: role.window,
    person: role.person,
    note: role.note,
    open: !role.person,
  }));
}

function owner(rota: RotaSlot[], roleMatch: RegExp, fallback: string): string {
  const hit = rota.find((slot) => roleMatch.test(slot.role) && slot.person);
  return hit?.person || fallback;
}

function buildRun(brief: Brief, kind: EventKind, rota: RotaSlot[]): RunItem[] {
  const quote = brief.quotes.trim();
  const quiet = brief.interests.find((i) => /quiet|low noise|small table/i.test(`${i.tablePref} ${i.notes}`));
  const rows: Array<Omit<RunItem, "id">> =
    kind === "workshop"
      ? [
          { time: shift(brief.start, -20), title: "Doors and benches", owner: owner(rota, /door/i, "Door"), detail: "Power on the tables. One spare seat left empty." },
          { time: brief.start, title: "Brief", owner: owner(rota, /facilitator|host/i, "Host"), detail: brief.theme || "Say what done looks like. Then stop talking." },
          { time: shift(brief.start, 15), title: "Build", owner: owner(rota, /build|support/i, "Support"), detail: "Pairs from the form where someone named a partner." },
          { time: shift(brief.start, 75), title: "Checkpoint", owner: owner(rota, /facilitator|time/i, "Host"), detail: "One sentence each. No demos yet." },
          { time: shift(brief.start, 120), title: "Show the work", owner: owner(rota, /facilitator|host/i, "Host"), detail: "Three minutes a table. Clap, don't critique." },
          { time: brief.end, title: "Close", owner: owner(rota, /close/i, "Open"), detail: quote || "Room back as you found it." },
        ]
      : kind === "talk"
        ? [
            { time: shift(brief.start, -25), title: "Doors", owner: owner(rota, /door/i, "Door"), detail: `Hold at ${brief.venue || "the venue"}. Speaker checks the mic once.` },
            { time: brief.start, title: "Welcome", owner: owner(rota, /host/i, "Host"), detail: brief.theme || "Why this room, why tonight. Under three minutes." },
            { time: shift(brief.start, 12), title: "Talk", owner: "Speaker", detail: brief.notes || "The brief the host already agreed." },
            { time: shift(brief.start, 55), title: "Questions", owner: owner(rota, /question/i, "Host"), detail: "Hands, then a pause, so people can leave without theatre." },
            { time: brief.end, title: "Close", owner: owner(rota, /close/i, "Open"), detail: quote || "Thanks and the door." },
          ]
        : [
            { time: shift(brief.start, -30), title: "Doors and labels", owner: owner(rota, /door/i, "Door"), detail: "Stickers out. Food labels written in words, not colour alone." },
            { time: brief.start, title: "Welcome", owner: owner(rota, /welcome|host/i, "Host"), detail: quiet ? `${quiet.name} asked for a quieter seat — hold it.` : "Point at the food, the exit, and who to ask." },
            { time: shift(brief.start, 15), title: "Tables", owner: owner(rota, /table/i, "Tables"), detail: "Fixed pairs from the form sit first. Everyone else picks." },
            { time: shift(brief.start, kind === "meal" ? 35 : 25), title: kind === "meal" ? "Boards, not a programme" : "The actual social", owner: owner(rota, /table|welcome/i, "Host"), detail: brief.theme || "No mic. The host circulates." },
            { time: shift(brief.start, 90), title: "Food", owner: owner(rota, /food/i, "Food"), detail: dietarySummary(brief.interests) },
            { time: shift(brief.start, 130), title: "One announcement", owner: owner(rota, /welcome|host/i, "Host"), detail: "Only what was approved. Then sit back down." },
            { time: brief.end, title: "Kitchen clear", owner: owner(rota, /close/i, "Open"), detail: quote || brief.notes || "Leave the room as you found it." },
          ];
  return rows.map((row) => ({ ...row, id: uid("run") }));
}

function buildBudget(brief: Brief): BudgetLine[] {
  const food = foodPerHead(brief.interests);
  const heads = Math.max(1, brief.capacity);
  const foodPlan = Math.round(food.rate * heads);
  const drinkers = brief.interests.filter((i) => i.alcohol === "yes").length;
  const sober = brief.interests.filter((i) => i.alcohol === "no").length;
  const either = brief.interests.filter((i) => i.alcohol === "either").length;
  const replyCount = Math.max(1, brief.interests.length);
  let drinkRate = 0;
  if (brief.alcohol === "none") drinkRate = 1.5;
  else if (brief.interests.length) {
    drinkRate = (drinkers * 4 + sober * 1.5 + either * 2.5) / replyCount;
  } else drinkRate = brief.alcohol === "byo" ? 1.5 : 3;
  const drinkAmount = Math.round(drinkRate * heads);

  const foodReceipts = brief.receipts.filter((receipt) =>
    /dumpling|food|cater|tray|kitchen|meal/i.test(`${receipt.vendor} ${receipt.note}`),
  );
  const foodSpent = foodReceipts.reduce((sum, receipt) => sum + (Number(receipt.amount) || 0), 0);
  const foodLeft = Math.max(0, foodPlan - foodSpent);

  const lines: BudgetLine[] = [];
  if (foodLeft > 0 || foodSpent === 0) {
    lines.push({
      id: uid("bud"),
      label: foodSpent ? "Food still to buy" : "Food",
      amount: foodSpent ? foodLeft : foodPlan,
      note: foodSpent
        ? `${food.note} ${money(foodSpent)} is already on a receipt, so only the gap is left.`
        : food.note,
      source: "estimate",
    });
  }
  lines.push({
    id: uid("bud"),
    label: brief.alcohol === "none" ? "Soft drinks" : "Drinks",
    amount: drinkAmount,
    note:
      brief.alcohol === "byo"
        ? "Mixers and water only. People bring the rest."
        : `About £${drinkRate.toFixed(2)} a head from the alcohol answers.`,
    source: "estimate",
  });
  for (const receipt of brief.receipts) {
    lines.push({
      id: uid("bud"),
      label: receipt.vendor || "Receipt",
      amount: Number(receipt.amount) || 0,
      note: receipt.note || "Dropped in by the host.",
      source: "receipt",
    });
  }
  if (!brief.receipts.some((r) => /sticker|print|name/i.test(`${r.vendor} ${r.note}`))) {
    lines.push({
      id: uid("bud"),
      label: "Name stickers",
      amount: 14,
      note: "Printed words, large type.",
      source: "estimate",
    });
  }
  const sub = lines.reduce((sum, line) => sum + line.amount, 0);
  lines.push({
    id: uid("bud"),
    label: "Contingency",
    amount: Math.round(sub * 0.08),
    note: "8% for a tray that doesn't arrive.",
    source: "estimate",
  });
  return lines;
}

export function budgetTotal(lines: BudgetLine[]): number {
  return lines.reduce((sum, line) => sum + (Number(line.amount) || 0), 0);
}

function buildGuests(brief: Brief): Guest[] {
  return brief.interests.map((row) => ({
    id: uid("gst"),
    name: row.name,
    status: "expected",
    dietary: row.dietary,
  }));
}

function seatLine(brief: Brief): string {
  return `${brief.capacity} seats`;
}

function placeLine(brief: Brief): string {
  const venue = brief.venue.trim() || "Venue to confirm";
  const area = brief.area.trim();
  return area ? `${venue}, ${area}` : venue;
}

function buildPromo(brief: Brief, kind: EventKind, rota: RotaSlot[]): Promo {
  const when = formatWhen(brief.date, brief.start, brief.end);
  const place = placeLine(brief);
  const title = brief.title || "Community event";
  const open = rota.filter((slot) => slot.open).map((slot) => slot.role);
  const openLine = open.length
    ? `Still open on the rota: ${open.join(", ")}.`
    : "The rota has a name on every slot.";
  const diet = dietarySummary(brief.interests);
  const drinks = alcoholLine(brief.alcohol, brief.interests);
  const theme = brief.theme.trim();
  const activity =
    kind === "workshop"
      ? "A working session. You leave with the thing you came to make."
      : kind === "talk"
        ? "One talk, then questions, then the door. No surprise panel."
        : kind === "meal"
          ? "Food on the table and no microphone."
          : "A social, not a showcase.";

  const page = [
    title,
    `${when} · ${place}`,
    "",
    theme || activity,
    "",
    activity,
    drinks,
    diet,
    `${seatLine(brief)}. Budget cap £${brief.budgetCap}.`,
    openLine,
    "",
    brief.notes.trim() ? `Host note: ${brief.notes.trim()}` : "",
    "Nothing here is posted until the lead approves it.",
  ]
    .filter((line) => line !== "")
    .join("\n");

  const ghost = [
    `# ${title}`,
    "",
    `${when}. ${place}.`,
    "",
    theme || activity,
    "",
    drinks,
    diet,
    "",
    openLine,
    "",
    "Reply on the interest form if your dietary need, alcohol line or free hour isn't in yet. The run sheet is already drafted — this letter is the only public bit, and only after approval.",
    "",
    brief.quotes.trim() ? `> ${brief.quotes.trim()}` : "",
  ]
    .filter((line) => line !== "")
    .join("\n");

  const whatsapp = [
    `${title} — ${when}`,
    place,
    `${seatLine(brief)}. ${drinks}`,
    diet,
    open.length ? `Rota still needs: ${open.join(", ")}.` : "Rota is covered.",
    "I'll only drop changes in this chat after they're approved.",
  ].join("\n");

  const linkedin = [
    `${title}`,
    `${when} · ${place}`,
    "",
    theme || activity,
    "",
    `We're keeping it to ${seatLine(brief).toLowerCase()}. ${drinks} ${diet}`,
    "",
    "If you're already part of the community, the interest form is how dietary needs and free hours get onto the run sheet — not a comment on this post.",
  ].join("\n");

  const discord = [
    `**${title}**`,
    `${when} · ${place}`,
    "",
    theme || activity,
    `• ${drinks}`,
    `• ${diet}`,
    `• ${openLine}`,
    "",
    "Thread is for lift-shares and late changes. The host posts those only after approval.",
  ].join("\n");

  return { page, ghost, whatsapp, linkedin, discord, nightUpdate: "" };
}

export function compose(brief: Brief, id = uid("evt"), createdAt = new Date().toISOString()): CommunityEvent {
  const title = brief.title.trim() || titleCaseIdea(brief.idea || "Community event");
  const normalized: Brief = {
    ...brief,
    title,
    idea: brief.idea.trim() || title,
    venue: brief.venue.trim(),
    area: brief.area.trim() || "London",
    capacity: Math.max(1, Math.round(Number(brief.capacity) || 1)),
    budgetCap: Math.max(0, Math.round(Number(brief.budgetCap) || 0)),
    theme: brief.theme.trim(),
    notes: brief.notes.trim(),
    quotes: brief.quotes.trim(),
  };
  const kind = kindOf(normalized.idea, normalized.theme);
  const rota = buildRota(normalized, kind);
  const runSheet = buildRun(normalized, kind, rota);
  const budget = buildBudget(normalized);
  const guests = buildGuests(normalized);
  const promo = buildPromo(normalized, kind, rota);
  return {
    ...normalized,
    id,
    kind,
    runSheet,
    budget,
    rota,
    guests,
    promo,
    approvals: blankApprovals(),
    lastChange: "",
    createdAt,
  };
}

export function seedInterests(): Interest[] {
  return [
    { id: uid("int"), name: "Amina Shah", dietary: "vegan", alcohol: "no", canHelp: true, freeWindow: "18:30–22:00", tablePref: "Quiet table", notes: "Happy to welcome if it stays short." },
    { id: uid("int"), name: "Jonah Adeyemi", dietary: "omnivore", alcohol: "yes", canHelp: true, freeWindow: "18:20–20:00", tablePref: "Door, then a game", notes: "Can do the list at the door." },
    { id: uid("int"), name: "Priya Raman", dietary: "vegetarian", alcohol: "either", canHelp: true, freeWindow: "19:00–22:00", tablePref: "With Elena", notes: "Sit with Elena if she's coming." },
    { id: uid("int"), name: "Sam Okonkwo", dietary: "gluten-free", alcohol: "no", canHelp: false, freeWindow: "19:00–21:30", tablePref: "Any", notes: "Gluten-free has to be a separate tray." },
    { id: uid("int"), name: "Lee Park", dietary: "omnivore", alcohol: "yes", canHelp: true, freeWindow: "19:00–22:00", tablePref: "Photos opt-in only", notes: "Will take photos of people who say yes." },
    { id: uid("int"), name: "Noor El-Sayed", dietary: "halal", alcohol: "either", canHelp: false, freeWindow: "18:45–21:45", tablePref: "With the food table", notes: "Halal labelled in words." },
    { id: uid("int"), name: "Chris Daley", dietary: "vegetarian", alcohol: "yes", canHelp: false, freeWindow: "19:15–22:00", tablePref: "Boards", notes: "" },
    { id: uid("int"), name: "Elena Voss", dietary: "vegan", alcohol: "no", canHelp: true, freeWindow: "18:30–22:00", tablePref: "With Priya", notes: "Can help plate if the trays are labelled." },
  ];
}

export function seedEvent(): CommunityEvent {
  const brief: Brief = {
    idea: "Thursday dumpling social in Shoreditch for 24, boards not slides, budget cap £280",
    title: "Thursday dumpling social",
    theme: "Low-key tables. No microphone, no lanyards.",
    date: "2026-10-29",
    start: "19:00",
    end: "22:00",
    venue: "Member loft",
    area: "Shoreditch",
    capacity: 24,
    budgetCap: 280,
    alcohol: "served",
    notes: "Kitchen must be clear by 22:15. Hold a quiet seat by the window for anyone who asked. Name stickers at the door.",
    quotes: "Loft host: use the kitchen if the dishwasher is on before you leave.",
    receipts: [
      { id: uid("rc"), vendor: "Dumpling supply", note: "Mixed trays, vegan included", amount: 96 },
      { id: uid("rc"), vendor: "Corner print", note: "Name stickers, large type", amount: 12 },
    ],
    interests: seedInterests(),
  };
  return compose(brief, "evt-dumpling-social", "2026-10-22T18:00:00.000Z");
}

export function draftNightUpdate(event: CommunityEvent, change: string): string {
  const text = change.trim();
  const checked = event.guests.filter((g) => g.status === "checked-in").length;
  const cancelled = event.guests.filter((g) => g.status === "cancelled").length;
  const expected = event.guests.filter((g) => g.status === "expected" || g.status === "checked-in").length;
  const when = formatWhen(event.date, event.start, event.end);
  if (!text) {
    return [
      `Night note for ${event.title} (${when}).`,
      `${checked} checked in, ${cancelled} cancelled, ${expected} still on the list.`,
      `${placeLine(event)}.`,
      "No extra change written yet.",
    ].join("\n");
  }
  return [
    `Update — ${event.title}`,
    text,
    `${when} · ${placeLine(event)}`,
    `${checked} checked in · ${cancelled} cancelled · ${event.guests.length - checked - cancelled} not through the door yet.`,
    "This goes to the group only after approval.",
  ].join("\n");
}

export function toNotionMarkdown(event: CommunityEvent): string {
  const total = budgetTotal(event.budget);
  const gap = event.budgetCap - total;
  const lines = [
    `# ${event.title}`,
    "",
    formatWhen(event.date, event.start, event.end),
    placeLine(event),
    "",
    event.theme,
    "",
    "## Run sheet",
    "",
    ...event.runSheet.map((item) => `- **${item.time}** ${item.title} — ${item.owner}. ${item.detail}`),
    "",
    "## Budget",
    "",
    ...event.budget.map((line) => `- ${line.label}: £${line.amount} (${line.source}) — ${line.note}`),
    "",
    `Total £${total}. Cap £${event.budgetCap}. ${gap >= 0 ? `Under cap by £${gap}.` : `Over cap by £${Math.abs(gap)}.`}`,
    "",
    "## Rota",
    "",
    ...event.rota.map((slot) => `- ${slot.role} (${slot.window}): ${slot.open ? "OPEN" : slot.person}. ${slot.note}`),
    "",
    "## Interest replies",
    "",
    ...event.interests.map(
      (row) =>
        `- ${row.name} — ${row.dietary}, alcohol ${row.alcohol}, free ${row.freeWindow}${row.canHelp ? ", can help" : ""}. ${row.tablePref} ${row.notes}`.trim(),
    ),
    "",
    "## Promo",
    "",
    event.promo.page,
  ];
  return lines.join("\n");
}

export function toIcs(event: CommunityEvent): string {
  const stamp = event.date.replace(/-/g, "");
  const blocks = event.runSheet.map((item, index) => {
    const start = item.time.replace(":", "");
    const endTime = event.runSheet[index + 1]?.time.replace(":", "") ?? event.end.replace(":", "");
    const desc = `${item.owner}. ${item.detail}`.replace(/\n/g, " ");
    return [
      "BEGIN:VEVENT",
      `UID:${item.id}@event-autopilot`,
      `DTSTART;TZID=Europe/London:${stamp}T${start}00`,
      `DTEND;TZID=Europe/London:${stamp}T${endTime}00`,
      `SUMMARY:${event.title} — ${item.title}`,
      `LOCATION:${placeLine(event)}`,
      `DESCRIPTION:${desc}`,
      "END:VEVENT",
    ].join("\r\n");
  });
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//EventScrunch//EN", "CALSCALE:GREGORIAN", ...blocks, "END:VCALENDAR"].join("\r\n");
}

export function writeDigest(events: Listing[]): { newsletter: string; groupMessage: string } {
  const rows = events.map((event) => {
    const when = formatIso(event.start);
    const going = event.guests == null ? "guest count hidden" : `${event.guests} going`;
    return `- ${when} — ${event.name} (${event.venue}). ${going}. ${event.url}`;
  });
  const newsletter = [
    "# This week",
    "",
    "Pulled for the lead. Edit it, then approve. Nothing sends on its own.",
    "",
    ...rows,
    "",
    "If one of these is yours, drop the brief on the desk and the run sheet, rota and poster come back in one pass.",
  ].join("\n");
  const groupMessage = [
    "This week:",
    ...events.slice(0, 6).map((event) => `• ${formatIso(event.start)} — ${event.name} @ ${event.venue}`),
    "Full note goes in the newsletter after it's approved.",
  ].join("\n");
  return { newsletter, groupMessage };
}

export function money(n: number): string {
  const value = Math.round(Number(n) || 0);
  return `£${value.toLocaleString("en-GB")}`;
}
