// Rules for the orders desk: what each status means, who may move an order where, and which tab it sits in.
// Pure functions only, so the same rules run in the API, the screens and the tests.

export const STATUSES = [
  "PENDING_CONFIRMATION",
  "NO_ANSWER",
  "CONFIRMED",
  "DISPATCHED",
  "DELIVERED",
  "RETURNED",
  "CANCELLED",
] as const;
export type DeskStatus = (typeof STATUSES)[number];

export const STATUS_LABEL: Record<DeskStatus, string> = {
  PENDING_CONFIRMATION: "To call",
  NO_ANSWER: "No answer",
  CONFIRMED: "Confirmed",
  DISPATCHED: "Dispatched",
  DELIVERED: "Delivered",
  RETURNED: "Returned",
  CANCELLED: "Cancelled",
};

// Staff move an order through the call; the assigned seller moves it from dispatch onwards.
const STAFF_MOVES: Record<DeskStatus, DeskStatus[]> = {
  PENDING_CONFIRMATION: ["NO_ANSWER", "CONFIRMED", "CANCELLED"],
  NO_ANSWER: ["NO_ANSWER", "CONFIRMED", "CANCELLED"],
  CONFIRMED: ["CONFIRMED", "DISPATCHED", "CANCELLED"], // CONFIRMED again = change the seller or the fee
  DISPATCHED: ["DELIVERED", "RETURNED"],
  DELIVERED: ["RETURNED"],
  RETURNED: [],
  CANCELLED: [],
};
const SELLER_MOVES: Record<DeskStatus, DeskStatus[]> = {
  PENDING_CONFIRMATION: [],
  NO_ANSWER: [],
  CONFIRMED: ["DISPATCHED"],
  DISPATCHED: ["DELIVERED", "RETURNED"],
  DELIVERED: [],
  RETURNED: [],
  CANCELLED: [],
};

export type Who = "staff" | "seller";
export function canMove(who: Who, from: DeskStatus, to: DeskStatus) {
  return (who === "staff" ? STAFF_MOVES : SELLER_MOVES)[from].includes(to);
}
export function nextMoves(who: Who, from: DeskStatus) {
  return [...(who === "staff" ? STAFF_MOVES : SELLER_MOVES)[from]];
}

// A seller only ever sees an order once the customer has confirmed it on the phone.
export const SELLER_VISIBLE: DeskStatus[] = ["CONFIRMED", "DISPATCHED", "DELIVERED", "RETURNED"];

export const TABS = [
  { key: "to_call", label: "To call", statuses: ["PENDING_CONFIRMATION"] },
  { key: "no_answer", label: "No answer", statuses: ["NO_ANSWER"] },
  { key: "confirmed", label: "Confirmed", statuses: ["CONFIRMED"] },
  { key: "dispatched", label: "Dispatched", statuses: ["DISPATCHED"] },
  { key: "delivered", label: "Delivered", statuses: ["DELIVERED"] },
  { key: "returned", label: "Returned", statuses: ["RETURNED"] },
  { key: "cancelled", label: "Cancelled", statuses: ["CANCELLED"] },
] as const satisfies readonly { key: string; label: string; statuses: readonly DeskStatus[] }[];
export type TabKey = (typeof TABS)[number]["key"];

export function tabCounts(rows: { status: string }[]) {
  const counts = Object.fromEntries(TABS.map((t) => [t.key, 0])) as Record<TabKey, number>;
  for (const r of rows) {
    const tab = TABS.find((t) => (t.statuses as readonly string[]).includes(r.status));
    if (tab) counts[tab.key] += 1;
  }
  return counts;
}

export const WAITING_HOURS = 2;
export const MAX_ATTEMPTS = 3;
// An order nobody has called for a couple of hours is the one a customer is most likely to forget about.
export function isStale(status: string, createdAt: string | Date, now = new Date()) {
  return (
    status === "PENDING_CONFIRMATION" &&
    now.getTime() - new Date(createdAt).getTime() > WAITING_HOURS * 3600_000
  );
}

export function age(createdAt: string | Date, now = new Date()) {
  const mins = Math.max(0, Math.floor((now.getTime() - new Date(createdAt).getTime()) / 60000));
  if (mins < 60) return `${mins}m`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h`;
  return `${Math.floor(mins / 1440)}d`;
}

export type MoveInput = {
  to: DeskStatus;
  note?: string;
  deliveryFeeMillimes?: number | null;
  partnerId?: string | null;
  trackingNumber?: string | null;
};
// Confirming needs the delivery fee agreed on the call, because that is what the courier collects with the items.
// Dispatching needs a seller to hold the parcel. Cancelling and "no answer" are the quick ones.
export function missingForMove(m: MoveInput, current: { partnerId: string | null }) {
  if (m.to === "CONFIRMED" && (m.deliveryFeeMillimes == null || m.deliveryFeeMillimes < 0))
    return "Enter the delivery fee agreed with the customer.";
  if (m.to === "CANCELLED" && !(m.note ?? "").trim()) return "Add a short reason for cancelling.";
  if (m.to === "DISPATCHED" && !(m.partnerId ?? current.partnerId)) return "Choose who is delivering this order.";
  return null;
}
