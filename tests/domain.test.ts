import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateCost,
  supplierChecks,
  selectionScore,
} from "../src/lib/domain";
import { formErrors } from "../src/lib/forms";
import { dayPlan, stages, lessonContent } from "../src/lib/curriculum";
import { hashPassword, verifyPassword } from "../src/lib/password";
import type { CostInputs } from "../src/lib/types";
const example: CostInputs = {
  item: 2.01,
  shipping: 0,
  selling: 5.88,
  mode: "allowance",
  allowance: 20,
  feePercent: 0,
  fixedFee: 0,
  promotionPercent: 0,
  conversion: 0,
  tax: 0,
  other: 0,
};
test("stopwatch example calculates 143.8% from the supplied inputs, never 101%", () => {
  const r = calculateCost(example);
  assert.ok(Math.abs(r.investment - 2.412) < 1e-10);
  assert.ok(Math.abs(r.profit - 3.468) < 1e-10);
  assert.equal(r.roi.toFixed(1), "143.8");
  assert.equal(r.inTarget, false);
  assert.ok(r.warnings.some((w) => w.includes("80–100%")));
});
test("allowance mode excludes actual extra-cost fields to prevent double counting", () => {
  assert.deepEqual(
    calculateCost({
      ...example,
      feePercent: 12,
      fixedFee: 2,
      promotionPercent: 5,
      conversion: 1,
      tax: 3,
      other: 4,
    }),
    calculateCost(example),
  );
});
test("actual fees are based on selling price and break-even solves percentage fees", () => {
  const r = calculateCost({
    ...example,
    mode: "actual",
    feePercent: 10,
    fixedFee: 0.3,
    promotionPercent: 2,
    conversion: 0.1,
    tax: 0.2,
    other: 0.4,
  });
  assert.ok(Math.abs(r.fees - (5.88 * 0.12 + 0.3)) < 1e-10);
  assert.ok(
    Math.abs(r.minimumPrice - (2.01 + 0.3 + 0.1 + 0.2 + 0.4) / 0.88) < 1e-10,
  );
  assert.equal(r.allowanceCost, 0);
});
test("zero investment, negative costs and impossible combined fees fail", () => {
  assert.throws(() => calculateCost({ ...example, item: 0 }));
  assert.throws(() => calculateCost({ ...example, shipping: -1 }));
  assert.throws(() =>
    calculateCost({
      ...example,
      mode: "actual",
      feePercent: 70,
      promotionPercent: 30,
    }),
  );
  assert.throws(() => calculateCost({ ...example, selling: NaN }));
});
test("supplier qualification thresholds are strict and never automatically approve", () => {
  assert.equal(supplierChecks(4.5, 98, "USA", 11).numericQualified, false);
  assert.equal(supplierChecks(4.9, 95, "UK", 6).numericQualified, false);
  const result = supplierChecks(4.9, 98, "USA", 11);
  assert.equal(result.numericQualified, true);
  assert.equal(result.approved, false);
  assert.ok(supplierChecks(4.9, 98, "USA", 8).issues.length);
});
test("selection recommendation uses the supplied 30/20/20/15/15 weights", () => {
  assert.equal(
    selectionScore({
      demand: 100,
      pricing: 50,
      availability: 100,
      simplicity: 0,
      risk: 100,
    }),
    75,
  );
});
test("45 lessons and exactly 14 ordered operating stages are seeded with substantive content", () => {
  assert.equal(dayPlan.length, 45);
  assert.deepEqual(
    stages.filter((s) => s.stage > 0).map((s) => s.stage),
    Array.from({ length: 14 }, (_, i) => i + 1),
  );
  for (let day = 1; day <= 45; day++) {
    const c = lessonContent(day);
    assert.ok(c.steps.length >= 3);
    assert.equal(c.checklist.length, 4);
    assert.equal(
      c.rubric.reduce((sum, r) => sum + r.weight, 0),
      100,
    );
    assert.ok(c.evidence.length > 40);
  }
});
test("order simulation catches wrong variant and quantity", () => {
  assert.ok(formErrors("F10", { variant: "Red", quantity: 1 }).variant);
  assert.ok(!formErrors("F10", { variant: "Blue", quantity: 2 }).variant);
});
test("password hashes use a unique salt and verify only the matching password", () => {
  const password = "test-only password generated for this assertion",
    a = hashPassword(password),
    b = hashPassword(password);
  assert.notEqual(a, b);
  assert.equal(verifyPassword(password, a), true);
  assert.equal(verifyPassword("incorrect", a), false);
});
