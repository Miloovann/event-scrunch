import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  type Approval,
  type ApprovalKey,
  type Brief,
  type CommunityEvent,
  type Digest,
  type GuestStatus,
  type Interest,
  type Receipt,
  compose,
  draftNightUpdate,
  emptyBrief,
  seedEvent,
  uid,
} from "@/lib/domain";

interface DeskState {
  events: CommunityEvent[];
  digest: Digest | null;
  seeded: boolean;
  hydrated: boolean;
  finishHydration: () => void;
  addFromBrief: (brief: Brief) => string;
  updateBrief: (id: string, patch: Partial<Brief>) => void;
  rebuild: (id: string) => void;
  setApproval: (id: string, key: ApprovalKey, approval: Approval) => void;
  setPromo: (id: string, key: keyof CommunityEvent["promo"], value: string) => void;
  setRun: (id: string, itemId: string, patch: Partial<CommunityEvent["runSheet"][number]>) => void;
  setBudgetLine: (id: string, lineId: string, amount: number) => void;
  setRotaPerson: (id: string, slotId: string, person: string) => void;
  addInterest: (id: string, row: Omit<Interest, "id">) => void;
  removeInterest: (id: string, rowId: string) => void;
  addReceipt: (id: string, row: Omit<Receipt, "id">) => void;
  removeReceipt: (id: string, rowId: string) => void;
  setGuestStatus: (id: string, guestId: string, status: GuestStatus) => void;
  addWalkIn: (id: string, name: string) => void;
  applyNightChange: (id: string, change: string) => void;
  removeEvent: (id: string) => void;
  setDigest: (digest: Digest) => void;
  setDigestApproval: (approval: Approval) => void;
  setDigestText: (which: "newsletter" | "groupMessage", value: string) => void;
}

function patchEvent(
  events: CommunityEvent[],
  id: string,
  recipe: (event: CommunityEvent) => CommunityEvent,
): CommunityEvent[] {
  return events.map((event) => (event.id === id ? recipe(event) : event));
}

export const useDesk = create<DeskState>()(
  persist(
    (set, get) => ({
      events: [],
      digest: null,
      seeded: false,
      hydrated: false,
      finishHydration: () => {
        const current = get();
        if (current.hydrated) return;
        if (!current.seeded) {
          set({ hydrated: true, seeded: true, events: [seedEvent()] });
          return;
        }
        set({ hydrated: true });
      },
      addFromBrief: (brief) => {
        const event = compose({ ...emptyBrief(), ...brief, idea: brief.idea.trim() });
        set({ events: [event, ...get().events] });
        return event.id;
      },
      updateBrief: (id, patch) =>
        set({
          events: patchEvent(get().events, id, (event) => ({ ...event, ...patch })),
        }),
      rebuild: (id) =>
        set({
          events: patchEvent(get().events, id, (event) => {
            const next = compose(event, event.id, event.createdAt);
            const statusByName = new Map(event.guests.map((guest) => [guest.name, guest.status]));
            next.guests = next.guests.map((guest) => ({
              ...guest,
              status: statusByName.get(guest.name) ?? guest.status,
            }));
            next.lastChange = event.lastChange;
            if (event.lastChange.trim()) {
              next.promo.nightUpdate = draftNightUpdate(next, event.lastChange);
            }
            return next;
          }),
        }),
      setApproval: (id, key, approval) =>
        set({
          events: patchEvent(get().events, id, (event) => ({
            ...event,
            approvals: { ...event.approvals, [key]: approval },
          })),
        }),
      setPromo: (id, key, value) =>
        set({
          events: patchEvent(get().events, id, (event) => {
            const approvals = { ...event.approvals };
            if (key === "nightUpdate") approvals.night = "draft";
            else if (key === "page") approvals.page = "draft";
            else if (key === "ghost") approvals.ghost = "draft";
            else if (key === "whatsapp") approvals.whatsapp = "draft";
            else if (key === "linkedin") approvals.linkedin = "draft";
            else if (key === "discord") approvals.discord = "draft";
            return { ...event, approvals, promo: { ...event.promo, [key]: value } };
          }),
        }),
      setRun: (id, itemId, patch) =>
        set({
          events: patchEvent(get().events, id, (event) => ({
            ...event,
            approvals: { ...event.approvals, runSheet: "draft" },
            runSheet: event.runSheet.map((item) => (item.id === itemId ? { ...item, ...patch } : item)),
          })),
        }),
      setBudgetLine: (id, lineId, amount) =>
        set({
          events: patchEvent(get().events, id, (event) => ({
            ...event,
            approvals: { ...event.approvals, budget: "draft" },
            budget: event.budget.map((line) => (line.id === lineId ? { ...line, amount } : line)),
          })),
        }),
      setRotaPerson: (id, slotId, person) =>
        set({
          events: patchEvent(get().events, id, (event) => ({
            ...event,
            approvals: { ...event.approvals, rota: "draft" },
            rota: event.rota.map((slot) =>
              slot.id === slotId ? { ...slot, person, open: person.trim().length === 0 } : slot,
            ),
          })),
        }),
      addInterest: (id, row) =>
        set({
          events: patchEvent(get().events, id, (event) => ({
            ...event,
            interests: [...event.interests, { ...row, id: uid("int") }],
          })),
        }),
      removeInterest: (id, rowId) =>
        set({
          events: patchEvent(get().events, id, (event) => ({
            ...event,
            interests: event.interests.filter((row) => row.id !== rowId),
          })),
        }),
      addReceipt: (id, row) =>
        set({
          events: patchEvent(get().events, id, (event) => ({
            ...event,
            receipts: [...event.receipts, { ...row, id: uid("rc") }],
          })),
        }),
      removeReceipt: (id, rowId) =>
        set({
          events: patchEvent(get().events, id, (event) => ({
            ...event,
            receipts: event.receipts.filter((row) => row.id !== rowId),
          })),
        }),
      setGuestStatus: (id, guestId, status) =>
        set({
          events: patchEvent(get().events, id, (event) => ({
            ...event,
            guests: event.guests.map((guest) => (guest.id === guestId ? { ...guest, status } : guest)),
          })),
        }),
      addWalkIn: (id, name) =>
        set({
          events: patchEvent(get().events, id, (event) => ({
            ...event,
            guests: [
              ...event.guests,
              { id: uid("gst"), name: name.trim(), status: "checked-in" as const, dietary: "not on the form" },
            ],
          })),
        }),
      applyNightChange: (id, change) =>
        set({
          events: patchEvent(get().events, id, (event) => {
            const next = { ...event, lastChange: change };
            return {
              ...next,
              approvals: { ...event.approvals, night: "draft" },
              promo: { ...event.promo, nightUpdate: draftNightUpdate(next, change) },
            };
          }),
        }),
      removeEvent: (id) => set({ events: get().events.filter((event) => event.id !== id) }),
      setDigest: (digest) => set({ digest }),
      setDigestApproval: (approval) => {
        const digest = get().digest;
        if (!digest) return;
        set({ digest: { ...digest, approval } });
      },
      setDigestText: (which, value) => {
        const digest = get().digest;
        if (!digest) return;
        set({ digest: { ...digest, [which]: value, approval: "draft" } });
      },
    }),
    {
      name: "event-autopilot-v1",
      skipHydration: true,
      partialize: (state) => ({
        events: state.events,
        digest: state.digest,
        seeded: state.seeded,
      }),
    },
  ),
);

let hydrateOnce: Promise<void> | null = null;

export function hydrateDesk(): Promise<void> {
  if (!hydrateOnce) {
    hydrateOnce = (async () => {
      try {
        await useDesk.persist.rehydrate();
      } catch {
        /* storage unavailable — seed in memory */
      }
      useDesk.getState().finishHydration();
    })();
  }
  return hydrateOnce;
}

if (typeof window !== "undefined") {
  void hydrateDesk();
}
