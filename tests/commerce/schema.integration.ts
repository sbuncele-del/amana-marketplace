import { PGlite } from "@electric-sql/pglite";
import { commerceSchema } from "../../src/lib/commerce/schema";
import assert from "node:assert/strict";
const ddl = commerceSchema;
async function main() {
  const db = new PGlite();
  await db.exec(
    'CREATE TABLE "User"(id text PRIMARY KEY);CREATE TABLE experience_records(id text PRIMARY KEY);',
  );
  await db.exec(ddl);
  await db.exec(ddl);
  await db.exec(
    `INSERT INTO "User" VALUES('admin');INSERT INTO experience_records VALUES('order');INSERT INTO commerce_markets(code,name,currency,locale,languages) VALUES('ZA','South Africa','ZAR','en-ZA','["en-ZA"]');INSERT INTO commerce_partners(id,name,website,kind) VALUES('partner','Test','https://example.com','FULFILMENT');INSERT INTO commerce_partner_markets VALUES('partner','ZA');INSERT INTO commerce_products(id,title) VALUES('product','Product');INSERT INTO commerce_variants VALUES('variant','product');`,
  );
  const offer = `INSERT INTO commerce_offers(id,partner_id,market_code,product_id,variant_id,supplier_sku,currency,cost_minor,price_minor,stock_status,observed_at,expires_at,delivery_min_days,delivery_max_days,quantity) VALUES('offer','partner','ZA','product','variant','SKU','ZAR',100,200,'AVAILABLE',now(),now()+interval '1 hour',1,3,2)`;
  await db.exec(offer);
  await assert.rejects(
    db.exec("UPDATE commerce_offers SET quantity=0 WHERE id='offer'"),
  );
  await assert.rejects(
    db.exec("UPDATE commerce_offers SET market_code='TN' WHERE id='offer'"),
  );
  await assert.rejects(
    db.exec(
      "UPDATE commerce_offers SET expires_at=observed_at WHERE id='offer'",
    ),
  );
  await db.exec(
    `INSERT INTO commerce_shipments(id,request_key,order_id,partner_id,market_code,lines,delivery_address) VALUES('s','key','order','partner','ZA','[]','{}')`,
  );
  await assert.rejects(
    db.exec(
      `INSERT INTO commerce_shipments(id,request_key,order_id,partner_id,market_code,lines,delivery_address) VALUES('s2','key','order','partner','ZA','[]','{}')`,
    ),
  );
  assert.equal(
    (
      await db.query<{ n: number }>(
        "SELECT count(*)::int AS n FROM commerce_offers",
      )
    ).rows[0].n,
    1,
  );
  console.log(
    "PASS: additive DDL replay; offer coverage, quantity and expiry constraints; allocation retry uniqueness.",
  );
  await db.close();
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
