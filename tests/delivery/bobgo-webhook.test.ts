import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { bobGoDeliveryStatus, bobGoEventId, bobGoUpdate, verifyBobGoSignature } from "../../src/lib/delivery/bobgo-webhook";

test("Bob Go verifies the original bytes using a base64 signature and the literal secret", () => {
  const raw = Buffer.from('{ "status": "delivered" }');
  const secret = "abc123";
  const signature = createHmac("sha256", secret).update(raw).digest("base64");
  assert.ok(verifyBobGoSignature(raw, signature, secret));
  assert.ok(!verifyBobGoSignature(Buffer.from('{"status":"delivered"}'), signature, secret));
  assert.ok(!verifyBobGoSignature(raw, "", secret));
  assert.ok(!verifyBobGoSignature(raw, signature, "wrong"));
  assert.equal(bobGoEventId("tracking/updated", raw), bobGoEventId("tracking/updated", raw));
  assert.notEqual(bobGoEventId("tracking/updated", raw), bobGoEventId("order/updated", raw));
});

test("tracking and fulfilment have different reference fields and retain no personal details", () => {
  const tracking = bobGoUpdate("tracking/updated", { shipment_tracking_reference: "BG123", status: "delivered", shipment: { delivery_contact_email: "private@example.com" } });
  assert.equal(tracking.reference, "BG123");
  assert.equal(tracking.status, "delivered");
  assert.ok(!JSON.stringify(tracking).includes("private@example.com"));
  const fulfilment = bobGoUpdate("fulfillment/created", { method_reference: "BG123", method_status: "pending-collection", method: "shipment" });
  assert.equal(fulfilment.reference, "BG123");
  assert.equal(fulfilment.status, "pending-collection");
  assert.equal(bobGoDeliveryStatus(fulfilment.status), null);
  assert.equal(bobGoDeliveryStatus("delivered"), "DELIVERED");
  assert.equal(bobGoDeliveryStatus("failed"), null);
});
