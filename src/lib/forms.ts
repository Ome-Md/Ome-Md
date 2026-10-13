export interface Field {
  key: string;
  label: string;
  type: "text" | "number" | "textarea" | "select" | "url" | "checkbox";
  required?: boolean;
  min?: number;
  max?: number;
  integer?: boolean;
  options?: string[];
  help?: string;
}
export interface FormSpec {
  key: string;
  title: string;
  short: string;
  stage: number;
  description: string;
  fields: Field[];
  parent?: string;
  gate: number;
}
const text = (key: string, label: string, required = true): Field => ({
  key,
  label,
  type: "text",
  required,
});
const num = (key: string, label: string, min = 0, max?: number): Field => ({
  key,
  label,
  type: "number",
  required: true,
  min,
  max:
    max ??
    ([
      "soldQuantity",
      "competitors",
      "reviews",
      "deliveryDays",
      "quantity",
    ].includes(key)
      ? 2147483647
      : undefined),
  integer: [
    "soldQuantity",
    "competitors",
    "reviews",
    "deliveryDays",
    "quantity",
  ].includes(key),
});
const area = (key: string, label: string, help?: string): Field => ({
  key,
  label,
  type: "textarea",
  required: true,
  help,
});
const url = (key: string, label: string): Field => ({
  key,
  label,
  type: "url",
  required: true,
});
const select = (key: string, label: string, options: string[]): Field => ({
  key,
  label,
  type: "select",
  options,
  required: true,
});
const check = (key: string, label: string): Field => ({
  key,
  label,
  type: "checkbox",
  required: true,
});
export const forms: FormSpec[] = [
  {
    key: "F01",
    title: "Account Readiness & Setup",
    short: "Account readiness",
    stage: 1,
    gate: 0,
    description:
      "Assess a demonstration account, confirm permissions and document a secure training workspace.",
    fields: [
      text("title", "Assessment title"),
      select("country", "Target marketplace", ["USA", "UK", "Europe"]),
      text("accountType", "Account type"),
      area("limitations", "Account limitations and permissions"),
      area("security", "Security and workspace checks"),
      check("simulation", "I am using a demonstration account"),
      area("evidenceNote", "Evidence and account-readiness findings"),
    ],
  },
  {
    key: "F02",
    title: "Product Hunting Log",
    short: "Product research",
    stage: 4,
    gate: 1,
    description:
      "Separate Sold Items from unsold Completed Items. Record attributable evidence and compare relevant sellers.",
    fields: [
      text("title", "Product name"),
      select("country", "Target marketplace", ["USA", "UK", "Europe"]),
      text("category", "Category"),
      text("keyword", "Research keyword"),
      url("ebayUrl", "eBay reference URL"),
      text("seller", "Competitor seller"),
      num("selling", "Observed sold price", 0.01),
      num("soldQuantity", "Confirmed sold quantity", 1),
      text("period", "Research period"),
      num("competitors", "Competitors examined", 2),
      select("condition", "Product condition", ["New", "Used", "Refurbished"]),
      text("variations", "Available variations"),
      area(
        "evidenceNote",
        "Sold-history evidence",
        "Explain which completed listings actually sold, with dates and attributable evidence.",
      ),
      area("notes", "Research notes"),
      area("recommendation", "Your recommendation"),
    ],
  },
  {
    key: "F03",
    title: "Product Selection Scorecard",
    short: "Selection scorecard",
    stage: 5,
    gate: 2,
    parent: "F02",
    description:
      "Dr. Commerce Recommendation: demand 30%, price 20%, supply 20%, simplicity 15%, risk 15%. Scores run 0–100; higher risk scores mean lower operational risk.",
    fields: [
      text("title", "Shortlisted product"),
      num("demand", "Demand score", 0, 100),
      num("pricing", "Price opportunity score", 0, 100),
      num("availability", "Supplier availability score", 0, 100),
      num("simplicity", "Variation simplicity score", 0, 100),
      num("risk", "Operational safety score", 0, 100),
      area("evidenceNote", "Evidence supporting your scores"),
    ],
  },
  {
    key: "F04",
    title: "Supplier Qualification",
    short: "Supplier sourcing",
    stage: 6,
    gate: 2,
    parent: "F02",
    description:
      "Numeric checks flag issues but do not approve a supplier. Verify exact variant, destination, stock and checkout costs; exclude welcome deals.",
    fields: [
      text("title", "Source product"),
      url("sourceUrl", "AliExpress source URL"),
      text("supplier", "Established supplier/store"),
      num("rating", "Product rating / 5", 0, 5),
      num("reviews", "Number of reviews", 1),
      num("feedback", "Store positive feedback %", 0, 100),
      num("item", "Source product price", 0.01),
      text("variant", "Exact selected variant"),
      text("shippingMethod", "Shipping method"),
      num("shipping", "Actual shipping charge"),
      num("deliveryDays", "Quoted delivery days", 1),
      num("freeThreshold", "Eligible free-shipping basket threshold"),
      select("country", "Destination", ["USA", "UK", "Europe"]),
      check(
        "checkoutVerified",
        "Destination, variant, stock and actual checkout charges verified",
      ),
      check(
        "noWelcomeDeal",
        "No temporary welcome deal used in sustainable cost",
      ),
      text("alternative", "Alternative supplier"),
      area("evidenceNote", "Supplier verification evidence"),
    ],
  },
  {
    key: "F05",
    title: "Source Comparison",
    short: "Source comparison",
    stage: 6,
    gate: 2,
    parent: "F02",
    description:
      "Compare established suppliers using evidence for the same variant and destination.",
    fields: [
      text("title", "Product comparison"),
      url("sourceA", "Supplier A URL"),
      url("sourceB", "Supplier B URL"),
      num("costA", "Supplier A total cost"),
      num("costB", "Supplier B total cost"),
      area("comparison", "Stock, delivery, rating and price comparison"),
      area("evidenceNote", "Evidence and recommended source"),
    ],
  },
  {
    key: "F06",
    title: "ROI & Pricing Calculator",
    short: "Costing & ROI",
    stage: 7,
    gate: 2,
    parent: "F04",
    description:
      "ROI = expected net profit ÷ total investment × 100. Document assumptions; never change the result to fit the 80–100% target.",
    fields: [
      text("title", "Costing record"),
      select("currency", "Currency", ["USD", "GBP", "EUR"]),
      num("item", "Item price", 0.01),
      num("shipping", "Shipping cost"),
      num("selling", "Expected selling price", 0.01),
      select("mode", "Additional-cost method", ["allowance", "actual"]),
      num("allowance", "Estimated allowance %", 0, 100),
      num("feePercent", "Verified marketplace fee %", 0, 99),
      num("fixedFee", "Fixed marketplace fee"),
      num("promotionPercent", "Promotion fee %", 0, 99),
      num("conversion", "Currency conversion expense"),
      num("tax", "Applicable taxes"),
      num("other", "Other documented costs"),
      area(
        "assumptions",
        "Fee structure and assumptions",
        "Allowance mode excludes actual additional-cost fields. Actual mode excludes the allowance.",
      ),
      area("evidenceNote", "Cost evidence and target exception explanation"),
    ],
  },
  {
    key: "F07",
    title: "Variation & SKU Mapping",
    short: "Variation mapping",
    stage: 8,
    gate: 3,
    parent: "F06",
    description:
      "Map every listing variation to its exact supplier variation and an internal SKU.",
    fields: [
      text("title", "Mapping title"),
      area(
        "mapping",
        "Variation/SKU mapping",
        "Use the variation builder below; explain source attributes and image permissions.",
      ),
      area("evidenceNote", "Verified variation evidence"),
    ],
  },
  {
    key: "F08",
    title: "Listing Preparation & QA",
    short: "Listing workspace",
    stage: 8,
    gate: 3,
    parent: "F06",
    description:
      "Prepare a simulated listing. Accurate brand, condition, origin and specifications are required. Live publishing needs a separate authorized integration.",
    fields: [
      text("title", "Listing title"),
      text("category", "Category"),
      select("condition", "Condition", ["New", "Used", "Refurbished"]),
      text("brand", "Verified brand/product designation"),
      text("origin", "Country of origin"),
      area("description", "Description, benefits and working instructions"),
      area("specifics", "Verified item specifics"),
      num("price", "Selling price", 0.01),
      num("shipping", "Buyer-visible shipping cost"),
      num("quantity", "Available quantity", 1),
      text("delivery", "Verified delivery estimate"),
      area("mapping", "Variant-to-supplier SKU mapping"),
      check("mediaRights", "I have permission to use the selected media"),
      check("qa", "I checked all fields and previewed the simulated listing"),
      area("evidenceNote", "Source references and final QA evidence"),
    ],
  },
  {
    key: "F09",
    title: "Listing Publication Register",
    short: "Publication register",
    stage: 8,
    gate: 4,
    parent: "F08",
    description:
      "Record a simulated publication approval. This form never publishes to a live marketplace.",
    fields: [
      text("title", "Publication record"),
      text("reference", "Simulated listing reference"),
      check("simulation", "This record is a supervised simulation"),
      area("evidenceNote", "Authorization and QA record"),
    ],
  },
  {
    key: "F10",
    title: "Order Processing",
    short: "Order simulator",
    stage: 9,
    gate: 4,
    parent: "F08",
    description:
      "Fictional training order: two blue units. Check variation, payment, changed source price, address, stock and unexpected shipping. No purchase is placed.",
    fields: [
      text("title", "Simulated order reference"),
      text("sku", "Correct product SKU"),
      select("variant", "Selected color", ["Blue", "Red", "Black"]),
      num("quantity", "Quantity", 1),
      text("address", "Dummy destination address"),
      num("currentSourcePrice", "Current source price", 0.01),
      num("shipping", "Current shipping charge"),
      check("paymentConfirmed", "Simulated payment and order details checked"),
      check("stockConfirmed", "Exact variant and stock verified"),
      area("exceptions", "Exception handling and commercial approval"),
      text("supplierOrder", "Fictional supplier order ID"),
      area("evidenceNote", "Processing evidence"),
    ],
  },
  {
    key: "F11",
    title: "Shipment & Tracking Monitor",
    short: "Tracking simulator",
    stage: 10,
    gate: 5,
    parent: "F10",
    description:
      "Use synthetic timestamped events. Day 1–13 is a reference cycle, never a promised delivery time.",
    fields: [
      text("title", "Tracking exercise"),
      text("tracking", "Synthetic tracking reference"),
      select("event", "Observed simulation event", [
        "Processing",
        "Carrier accepted",
        "International transit",
        "Customs",
        "Final-mile carrier",
        "Delivery attempted",
        "Delivered",
        "Delay",
      ]),
      text("carrier", "Carrier in simulation"),
      area("interpretation", "What the evidence actually confirms"),
      area("nextAction", "Follow-up and escalation"),
      area("evidenceNote", "Synthetic event evidence"),
    ],
  },
  {
    key: "F12",
    title: "Customer Support & Dispute Log",
    short: "Customer support",
    stage: 11,
    gate: 5,
    parent: "F10",
    description:
      "Draft a professional response to a synthetic customer case. Respond within the internal target of 24 business hours; no live message is sent.",
    fields: [
      text("title", "Support case"),
      select("scenario", "Scenario", [
        "Delayed delivery",
        "Wrong product",
        "Damaged item",
        "Refund request",
        "Return request",
        "Dispute",
      ]),
      area("facts", "Facts supported by available evidence"),
      area("response", "Draft customer response"),
      area("action", "Resolution and escalation"),
      area("evidenceNote", "Supporting evidence and response timing"),
    ],
  },
  {
    key: "F13",
    title: "Order Profit & Financial Reconciliation",
    short: "Financial reconciliation",
    stage: 12,
    gate: 6,
    parent: "F10",
    description:
      "Reconcile dummy order revenue against purchase, fees, shipping, promotions, refunds and conversion. Manual entries are not confirmed bank transactions.",
    fields: [
      text("title", "Reconciliation reference"),
      num("revenue", "Order revenue"),
      num("purchase", "Supplier purchase cost"),
      num("shipping", "Shipping"),
      num("fees", "Actual marketplace fees"),
      num("promotion", "Promotion charges"),
      num("refunds", "Refunds and returns"),
      num("conversion", "Currency conversion"),
      area(
        "evidenceNote",
        "Reconciliation evidence and unresolved differences",
      ),
    ],
  },
  {
    key: "F14",
    title: "Performance & Optimization",
    short: "Optimization plan",
    stage: 13,
    gate: 6,
    parent: "F08",
    description:
      "Document title, media, price, conversion, supplier and return-rate improvements using attributable evidence.",
    fields: [
      text("title", "Optimization plan"),
      area("findings", "Evidence-based performance findings"),
      area("recommendations", "Optimization recommendations"),
      area("scaling", "Controlled scaling plan and stock monitoring"),
      area("evidenceNote", "Supporting measurements and risk controls"),
    ],
  },
  {
    key: "F15",
    title: "Trainee Competency & Certification",
    short: "Final project",
    stage: 14,
    gate: 6,
    description:
      "Integrate all approved operational work. A critical failure blocks certification regardless of the weighted score.",
    fields: [
      text("title", "Final integrated project"),
      area("summary", "End-to-end operating plan"),
      area(
        "references",
        "Approved research, source, costing and listing record IDs",
      ),
      area("controls", "Approval gates, risk controls and escalation"),
      area(
        "evidenceNote",
        "Final evidence portfolio and remediation completed",
      ),
    ],
  },
];
export function getForm(key: string) {
  const form = forms.find((f) => f.key === key);
  if (!form) throw new Error("Unknown operational form.");
  return form;
}
export function formErrors(
  key: string,
  data: Record<string, unknown>,
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const f of getForm(key).fields) {
    const v = data[f.key];
    if (
      f.required &&
      (v === undefined ||
        v === null ||
        v === "" ||
        (f.type === "checkbox" && v !== true))
    ) {
      errors[f.key] = "Required";
      continue;
    }
    if (
      f.type === "number" &&
      (!Number.isFinite(Number(v)) ||
        (f.min !== undefined && Number(v) < f.min) ||
        (f.max !== undefined && Number(v) > f.max))
    )
      errors[f.key] =
        `Enter a number${f.min !== undefined ? " ≥ " + f.min : ""}${f.max !== undefined ? " and ≤ " + f.max : ""}.`;
    if (f.integer && !Number.isInteger(Number(v)))
      errors[f.key] = "Enter a whole-number count.";
    if (f.type === "select" && !f.options?.includes(String(v)))
      errors[f.key] = "Choose an available option.";
    if (f.type === "url")
      try {
        const u = new URL(String(v));
        if (!["http:", "https:"].includes(u.protocol)) throw 0;
        if (
          f.key === "ebayUrl" &&
          !/(^|\.)ebay\.(com|co\.uk|de|fr|it|es|com\.au)$/.test(u.hostname)
        )
          throw 0;
        if (
          f.key === "sourceUrl" &&
          !/(^|\.)aliexpress\.(com|us)$/.test(u.hostname)
        )
          throw 0;
      } catch {
        errors[f.key] = "Enter a valid URL for the required marketplace.";
      }
  }
  if (key === "F10" && (data.variant !== "Blue" || Number(data.quantity) !== 2))
    errors.variant =
      "The synthetic training order requires two blue units. Recheck the order before submitting.";
  return errors;
}
