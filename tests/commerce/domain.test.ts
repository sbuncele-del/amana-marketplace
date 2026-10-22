import test from "node:test";
import assert from "node:assert/strict";
import {
  permits,
  activationProblems,
  resolveMarket,
  offerAvailable,
  canMoveShipment,
  allocationProblems,
  formatMoney,
} from "../../src/lib/commerce/domain";
test("staff cannot cross market boundaries or escalate a read-only marketing grant", () => {
  const grants = [{ role: "MARKETING", market_code: "ZA" }];
  assert.equal(permits(false, grants, "ZA"), true);
  assert.equal(permits(false, grants, "TN"), false);
  assert.equal(permits(false, grants, "ZA", true), false);
  assert.equal(permits(true, [], "TN", true), true);
});
test("activation requires every readiness check plus partner coverage", () => {
  assert.deepEqual(
    activationProblems(
      {
        readiness: {
          payments: true,
          fulfilment: true,
          returns: false,
          localisation: true,
        },
        languages: ["ar-TN"],
        locale: "fr-TN",
      },
      0,
    ),
    ["returns", "default language", "approved fulfilment coverage"],
  );
});
test("market selection remembers choice and never suggests unopened countries", () => {
  assert.equal(resolveMarket(["ZA", "TN"], "TN", "ZA"), "TN");
  assert.equal(resolveMarket(["ZA"], null, "TN"), "ZA");
  assert.equal(resolveMarket([]), null);
});
test("stale, unknown and future stock cannot be sold", () => {
  const now = new Date("2026-10-22T10:00:00Z");
  assert.equal(
    offerAvailable(
      "AVAILABLE",
      new Date(now.getTime() - 1),
      new Date(now.getTime() + 1),
      now,
    ),
    true,
  );
  for (const [status, start, end] of [
    ["UNKNOWN", -1, 1],
    ["AVAILABLE", -2, -1],
    ["AVAILABLE", 1, 2],
  ] as const)
    assert.equal(
      offerAvailable(status, new Date(+now + start), new Date(+now + end), now),
      false,
    );
});
test("shipments cannot skip acceptance or dispatch tracking stage", () => {
  assert.equal(canMoveShipment("ASSIGNED", "DELIVERED"), false);
  assert.equal(canMoveShipment("ACCEPTED", "DISPATCHED"), true);
  assert.equal(canMoveShipment("DELIVERED", "ACCEPTED"), false);
});
test("paid snapshots bound aggregate allocations including duplicate requested lines", () => {
  const paid = [{ offerId: "A", quantity: 3 }];
  assert.deepEqual(
    allocationProblems(
      paid,
      [{ offerId: "A", quantity: 2 }],
      [{ offerId: "A", quantity: 1 }],
    ),
    [],
  );
  assert.ok(
    allocationProblems(
      paid,
      [
        { offerId: "A", quantity: 2 },
        { offerId: "A", quantity: 2 },
      ],
      [],
    ).length,
  );
  assert.ok(
    allocationProblems(paid, [{ offerId: "B", quantity: 1 }], []).length,
  );
  assert.ok(
    allocationProblems(undefined, [{ offerId: "A", quantity: 1 }], []).length,
  );
});
test("money respects three-decimal and zero-decimal currencies", () => {
  assert.match(formatMoney(1234, "TND"), /1\.234/);
  assert.match(formatMoney(1234, "JPY"), /1,234/);
});
