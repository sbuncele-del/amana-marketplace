import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const bobGoTopics = [
  "tracking/updated",
  "fulfillment/created",
  "shipment_submission_status/updated",
  "shipment_charged_amount/updated",
  "shipment_charged_weight/updated",
  "shipment_health_status/updated",
  "order/updated",
] as const;

export function verifyBobGoSignature(body: Buffer, signature: string, secret: string) {
  const expected = createHmac("sha256", secret).update(body).digest("base64");
  const actual = Buffer.from(signature);
  return actual.length === Buffer.byteLength(expected) && timingSafeEqual(actual, Buffer.from(expected));
}

export function bobGoEventId(topic: string, body: Buffer) {
  return createHash("sha256").update(topic).update("\n").update(body).digest("hex");
}

export type BobGoUpdate = {
  reference: string | null;
  status: string | null;
  updatedAt: string | null;
  details: Record<string, unknown>;
};

// Keep operational fields, not the customer addresses or contact details in the full payload.
export function bobGoUpdate(topic: string, payload: Record<string, unknown>): BobGoUpdate {
  const reference = topic === "tracking/updated" ? payload.shipment_tracking_reference
    : topic === "fulfillment/created" ? payload.method_reference : payload.tracking_reference;
  const status = topic === "fulfillment/created" ? payload.method_status : payload.status;
  const sourceTime = topic === "tracking/updated" ? payload.last_checkpoint_time : payload.time_modified;
  const timestamp = typeof sourceTime === "string" ? sourceTime : null;
  const details: Record<string, unknown> = {};
  for (const field of ["id", "status", "status_friendly", "submission_status", "failed_reason", "health_status", "health_status_reason", "charged_amount", "charged_weight_kg", "provider_slug", "service_level_code", "time_modified", "channel_order_number", "method", "type"]) {
    if (["string", "number", "boolean"].includes(typeof payload[field])) details[field] = payload[field];
  }
  return {
    reference: typeof reference === "string" && reference.length <= 150 ? reference : null,
    status: typeof status === "string" ? status : null,
    updatedAt: timestamp && Number.isFinite(Date.parse(timestamp)) ? timestamp : null,
    details,
  };
}

// A booking can still be awaiting collection. Only actual movement advances dispatch.
export function bobGoDeliveryStatus(status: string | null) {
  if (status === "delivered") return "DELIVERED";
  if (["collected", "in-transit", "out-for-delivery"].includes(status ?? "")) return "SHIPPED";
  return null;
}

export const bobGoWebhookSchema = `
CREATE TABLE IF NOT EXISTS bobgo_webhook_events (
 id text PRIMARY KEY, topic text NOT NULL, tracking_reference text,
 payload jsonb NOT NULL, received_at timestamptz NOT NULL DEFAULT now(),
 processed_at timestamptz, outcome text, attempts integer NOT NULL DEFAULT 0,
 next_attempt_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS bobgo_webhook_pending ON bobgo_webhook_events(next_attempt_at) WHERE processed_at IS NULL;
CREATE INDEX IF NOT EXISTS bobgo_webhook_tracking ON bobgo_webhook_events(tracking_reference, received_at DESC);
CREATE TABLE IF NOT EXISTS bobgo_shipment_updates (
 tracking_reference text NOT NULL, topic text NOT NULL, source_time timestamptz,
 received_at timestamptz NOT NULL, details jsonb NOT NULL,
 PRIMARY KEY(tracking_reference, topic)
);`;
