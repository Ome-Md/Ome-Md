import type { CostInputs, CostResult } from "./types";

export function calculateCost(i: CostInputs): CostResult {
  for (const [key, value] of Object.entries(i))
    if (typeof value === "number" && (!Number.isFinite(value) || value < 0))
      throw new Error(`${key} must be a non-negative number.`);
  const base = i.item + i.shipping;
  if (base <= 0)
    throw new Error("Item and shipping investment must be greater than zero.");
  if (i.selling <= 0)
    throw new Error("Selling price must be greater than zero.");
  const rate = (i.feePercent + i.promotionPercent) / 100;
  if (i.mode === "actual" && rate >= 1)
    throw new Error("Combined percentage fees must be less than 100%.");
  const allowanceCost = i.mode === "allowance" ? (base * i.allowance) / 100 : 0;
  const fees = i.mode === "actual" ? i.selling * rate + i.fixedFee : 0;
  const fixed =
    base +
    (i.mode === "allowance"
      ? allowanceCost
      : i.conversion + i.tax + i.other + i.fixedFee);
  const investment =
    base +
    allowanceCost +
    fees +
    (i.mode === "actual" ? i.conversion + i.tax + i.other : 0);
  const profit = i.selling - investment,
    roi = (profit / investment) * 100,
    margin = (profit / i.selling) * 100;
  const warnings: string[] = [];
  if (i.mode === "allowance")
    warnings.push(
      "Allowance is an estimate covering additional costs. Actual fee fields are excluded to avoid double-counting; reconcile against verified charges before approval.",
    );
  if (roi < 80 || roi > 100)
    warnings.push(
      "Outside the internal 80–100% estimated ROI target. Trainer review is required; the calculation has not been altered.",
    );
  if (i.mode === "actual" && i.feePercent === 0)
    warnings.push(
      "No percentage marketplace fee is recorded. Document the actual fee structure or explain why zero is appropriate.",
    );
  return {
    investment,
    profit,
    roi,
    margin,
    minimumPrice: fixed / (i.mode === "actual" ? 1 - rate : 1),
    fees,
    allowanceCost,
    inTarget: roi >= 80 && roi <= 100,
    warnings,
  };
}
export function supplierChecks(
  rating: number,
  feedback: number,
  country: string,
  days: number,
) {
  const issues: string[] = [];
  if (rating <= 4.5)
    issues.push("Product rating must be above 4.5/5, not equal to 4.5.");
  if (feedback <= 95)
    issues.push("Store positive feedback must be above 95%, not equal to 95%.");
  if (country === "USA" && (days < 10 || days > 12))
    issues.push(
      "USA delivery differs from the internal 10–12-day target; verify destination and actual shipping service.",
    );
  if (country === "UK" && (days < 5 || days > 7))
    issues.push(
      "UK delivery differs from the internal 5–7-day target; verify destination and actual shipping service.",
    );
  if (country === "Europe")
    issues.push("Verify the estimate for the individual European destination.");
  return {
    numericQualified: rating > 4.5 && feedback > 95,
    issues,
    approved: false,
  };
}
export function selectionScore(data: Record<string, unknown>) {
  return [
    ["demand", 30],
    ["pricing", 20],
    ["availability", 20],
    ["simplicity", 15],
    ["risk", 15],
  ].reduce(
    (sum, [key, weight]) =>
      sum + (Number(data[String(key)] ?? 0) * Number(weight)) / 100,
    0,
  );
}
export const gateTitles = [
  "Foundation & account readiness",
  "Product research",
  "Supplier sourcing & costing",
  "Listing production",
  "Order processing",
  "Fulfillment & customer support",
  "Final operational certification",
];
export const classificationLabels = {
  synthetic: "Synthetic training",
  internal: "Internal example",
  pending: "Pending verification",
  verified: "Verified example",
};
