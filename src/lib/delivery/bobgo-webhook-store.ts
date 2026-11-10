import "server-only";
import { randomUUID } from "node:crypto";
import { commerceTransaction, ensureCommerce } from "@/lib/commerce/store";
import { event as recordEvent, insertRecord, experiencePool } from "@/lib/experience/store";
import { bobGoDeliveryStatus, bobGoUpdate, bobGoWebhookSchema } from "./bobgo-webhook";

let ready: Promise<void> | undefined;
export function ensureBobGoWebhooks() {
  return ready ??= (async () => {
    await ensureCommerce();
    await commerceTransaction(async client => {
      await client.query("SELECT pg_advisory_xact_lock(792046329)");
      await client.query(bobGoWebhookSchema);
    });
  })().catch(error => { ready = undefined; throw error; });
}

export async function receiveBobGoEvent(id: string, topic: string, payload: Record<string, unknown>) {
  await ensureBobGoWebhooks();
  const update = bobGoUpdate(topic, payload);
  const result = await experiencePool().query(
    `INSERT INTO bobgo_webhook_events(id,topic,tracking_reference,payload)
     VALUES($1,$2,$3,$4) ON CONFLICT(id) DO NOTHING RETURNING id`,
    [id, topic, update.reference, JSON.stringify(update)],
  );
  return result.rowCount === 1;
}

export async function processBobGoEvents(limit = 30) {
  await ensureBobGoWebhooks();
  let processed = 0;
  for (let index = 0; index < limit; index++) {
    const result = await commerceTransaction(async client => {
      await client.query("SET LOCAL statement_timeout = '5000ms'");
      const event = (await client.query(
        `SELECT * FROM bobgo_webhook_events WHERE processed_at IS NULL AND next_attempt_at<=now()
         ORDER BY received_at,id FOR UPDATE SKIP LOCKED LIMIT 1`,
      )).rows[0];
      if (!event) return false;
      const update = event.payload as ReturnType<typeof bobGoUpdate>;
      if (!update.reference) {
        await client.query("UPDATE bobgo_webhook_events SET processed_at=now(),outcome='RECORDED',attempts=attempts+1 WHERE id=$1", [event.id]);
        return true;
      }
      // Different webhook topics for the same shipment must serialize their state changes.
      await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1,0))", [update.reference]);
      const shipments = (await client.query(
        "SELECT id,status FROM commerce_shipments WHERE market_code='ZA' AND tracking_number=$1 FOR UPDATE", [update.reference],
      )).rows;
      const orders = (await client.query(
        `SELECT id,status FROM "Order" WHERE currency='ZAR' AND "trackingNumber"=$1 FOR UPDATE`, [update.reference],
      )).rows;
      const records = (await client.query(
        `SELECT id,status,data,team_id,owner_id FROM experience_records WHERE kind='ORDER' AND team_id IN
         (SELECT id FROM experience_teams WHERE country='ZA') AND data->>'trackingNumber'=$1 FOR UPDATE`, [update.reference],
      )).rows;
      if (!shipments.length && !orders.length && !records.length) {
        await client.query("UPDATE bobgo_webhook_events SET outcome='UNMATCHED',attempts=attempts+1,next_attempt_at=now()+interval '1 hour' WHERE id=$1", [event.id]);
        return true;
      }
      const snapshot = await client.query(
        `INSERT INTO bobgo_shipment_updates(tracking_reference,topic,source_time,received_at,details)
         VALUES($1,$2,$3,$4,$5) ON CONFLICT(tracking_reference,topic) DO UPDATE SET
         source_time=EXCLUDED.source_time,received_at=EXCLUDED.received_at,details=EXCLUDED.details
         WHERE CASE WHEN EXCLUDED.source_time IS NOT NULL AND bobgo_shipment_updates.source_time IS NOT NULL
           THEN EXCLUDED.source_time>=bobgo_shipment_updates.source_time
           ELSE EXCLUDED.received_at>=bobgo_shipment_updates.received_at END RETURNING tracking_reference`,
        [update.reference, event.topic, update.updatedAt, event.received_at, JSON.stringify(update.details)],
      );
      if (snapshot.rowCount) {
        const status = event.topic === "tracking/updated" ? bobGoDeliveryStatus(update.status) : null;
        for (const shipment of shipments) {
          if (status === "DELIVERED" && ["ACCEPTED", "DISPATCHED"].includes(shipment.status)) {
            await client.query("UPDATE commerce_shipments SET status='DELIVERED',version=version+1,updated_at=now() WHERE id=$1", [shipment.id]);
          } else if (status === "SHIPPED" && shipment.status === "ACCEPTED") {
            await client.query("UPDATE commerce_shipments SET status='DISPATCHED',version=version+1,updated_at=now() WHERE id=$1", [shipment.id]);
          }
        }
        for (const order of orders) {
          if (status === "DELIVERED" && ["SHIPPED", "IN_TRANSIT"].includes(order.status)) {
            await client.query(`UPDATE "Order" SET status='DELIVERED',"deliveredAt"=now(),"updatedAt"=now() WHERE id=$1`, [order.id]);
          }
          await client.query(`INSERT INTO "OrderEvent"(id,"orderId",type,description) VALUES($1,$2,'BOBGO_UPDATE',$3)`,
            [randomUUID(), order.id, JSON.stringify({topic: event.topic, ...update.details})]);
        }
        for (const record of records) {
          if (status === "DELIVERED" && record.status === "SHIPPED") {
            await client.query("UPDATE experience_records SET status='DELIVERED',due_at=NULL,data=jsonb_set(data,'{deliveredAt}',to_jsonb(now())),version=version+1,updated_at=now() WHERE id=$1", [record.id]);
            if (record.data.followUpConsent === true) {
              const existing = await client.query("SELECT id FROM experience_records WHERE order_id=$1 AND kind='TASK' AND data->>'taskType'='DELIVERY_CHECK_IN'", [record.id]);
              if (!existing.rowCount) {
                const task = await insertRecord(client, {
                  kind: "TASK", status: "OPEN", orderId: record.id, teamId: record.team_id, ownerId: record.owner_id,
                  dueAt: new Date(Date.now() + 86400000),
                  data: { taskType: "DELIVERY_CHECK_IN", title: record.data.contactPreference === "CALL" ? "Personal delivery follow-up call" : "Personal delivery check-in",
                    customerName: record.data.customerName, phone: record.data.phone,
                    contactPreference: record.data.contactPreference, contactWindow: record.data.contactWindow, attempts: 0 },
                });
                await recordEvent(client, task.id, null, "FOLLOWUP_CREATED", "Human check-in created after Bob Go confirmed delivery.");
              }
            }
          }
          await client.query(`INSERT INTO experience_events(id,record_id,actor_id,type,note,data) VALUES($1,$2,NULL,'BOBGO_UPDATE','Bob Go delivery update',$3)`,
            [randomUUID(), record.id, JSON.stringify({topic: event.topic, ...update.details})]);
        }
      }
      await client.query("UPDATE bobgo_webhook_events SET processed_at=now(),outcome=$2,attempts=attempts+1 WHERE id=$1", [event.id, snapshot.rowCount ? "MATCHED" : "STALE"]);
      return true;
    });
    if (!result) break;
    processed++;
  }
  return { processed };
}
