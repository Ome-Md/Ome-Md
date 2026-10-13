import type { Content } from "./types";
import { forms } from "./forms";

export const stages = [
  {
    stage: 0,
    title: "E-commerce foundations",
    description:
      "Understand marketplaces, revenue, profit, ROI and the commercial process.",
    steps: [
      "Compare a buyer, seller and supplier in an online transaction.",
      "Follow a fictional order from listing to supplier fulfillment and delivery.",
      "Distinguish revenue, net profit, margin and return on investment.",
      "Compare eBay, Shopify, TikTok Shop, Amazon, Walmart, Alibaba and AliExpress.",
    ],
    dos: [
      "Identify the platform model and regional eligibility.",
      "Use documented costs and accurate delivery information.",
    ],
    donts: [
      "Do not treat marketplaces and independent stores as interchangeable.",
      "Do not treat revenue as profit or assume dropshipping arrangements are authorized.",
    ],
  },
  {
    stage: 1,
    title: "Opportunity / Account",
    description:
      "Understand account structure, responsibilities, limitations and target markets.",
    steps: [
      "Identify target marketplace and selling country.",
      "Explore account navigation in a demonstration account.",
      "Document the seller account structure, permissions and limitations.",
      "Explain operational risks and profitability expectations.",
    ],
    dos: [
      "Confirm assigned permissions.",
      "Use demonstration accounts until authorized.",
    ],
    donts: [
      "Do not promise guaranteed profit.",
      "Do not access or change a client account without authorization.",
    ],
  },
  {
    stage: 2,
    title: "Setup",
    description:
      "Verify seller settings, account security, shipping, returns and payment configuration.",
    steps: [
      "Inspect the current seller dashboard and account settings.",
      "Review notification, shipping and return configurations.",
      "Verify payment settings and account security.",
      "Record user permissions and supervisor approval.",
    ],
    dos: [
      "Verify settings in the current account interface.",
      "Record observed settings and evidence.",
    ],
    donts: [
      "Do not change live client settings independently.",
      "Do not copy outdated settings without checking the account.",
    ],
  },
  {
    stage: 3,
    title: "Preparation",
    description:
      "Prepare research, sourcing, media, recordkeeping and tracking tools.",
    steps: [
      "Prepare eBay and AliExpress research links.",
      "Set up approved media tools and operational records.",
      "Understand internal SKU conventions and source traceability.",
      "Identify Cainiao, final-mile tracking and internal communication tools.",
    ],
    dos: [
      "Keep source links with each product.",
      "Use authorized media and clear record identifiers.",
    ],
    donts: [
      "Do not download media without rights.",
      "Do not lose SKU, variation or order traceability.",
    ],
  },
  {
    stage: 4,
    title: "Product Research / Hunting",
    description:
      "Verify genuine sold-history evidence and compare relevant competitors.",
    steps: [
      "Open the target eBay marketplace and search a relevant keyword.",
      "Apply relevant product filters and select New condition.",
      "Review Sold Items and Completed Items separately, with country and delivery filters.",
      "Inspect relevant sellers and actual selling history.",
      "Record confirmed recent sales, attributable URLs, selling prices and variants.",
      "Compare multiple sellers and submit a candidate for sourcing review.",
    ],
    dos: [
      "Verify sold status rather than completed status alone.",
      "Confirm marketplace, condition and commercially viable variants.",
      "Record genuine prices, sources and research dates.",
    ],
    donts: [
      "Do not count unsold completed listings as sales.",
      "Do not fabricate quantities or treat advertised prices as sold prices.",
      "Do not rely on one competitor or screenshots without URLs.",
    ],
  },
  {
    stage: 5,
    title: "Product Selection",
    description:
      "Shortlist products with documented demand, pricing, supplier availability and risk.",
    steps: [
      "Assess demand and competitor pricing from research evidence.",
      "Check supplier availability and variation complexity.",
      "Evaluate product risk and potential profitability.",
      "Apply the recommended weighted scorecard and submit the shortlist.",
    ],
    dos: [
      "Mark the scorecard as a Dr. Commerce Recommendation.",
      "Explain each score using attributable evidence.",
    ],
    donts: [
      "Do not treat a high score as automatic approval.",
      "Do not conceal operational risk or unsupported assumptions.",
    ],
  },
  {
    stage: 6,
    title: "Supplier / Sourcing",
    description:
      "Verify established suppliers, exact variants, stock, destination and sustainable checkout costs.",
    steps: [
      "Identify an established AliExpress shop and preserve its source URL.",
      "Check product rating above 4.5/5 and store feedback above 95%.",
      "Verify exact variant, inventory, destination and checkout shipping charges.",
      "Compare delivery with internal USA 10–12-day and UK 5–7-day targets; verify each European destination.",
      "Check actual basket eligibility: desired USA over $10, UK/Europe over £8 only where offered.",
      "Exclude welcome deals; verify Super Deal eligibility, checkout price and stability.",
    ],
    dos: [
      "Capture source, variant, destination and checkout evidence.",
      "Document an alternative established supplier.",
    ],
    donts: [
      "Do not approve from ratings alone.",
      "Do not treat temporary sales or delivery targets as permanent prices or promises.",
    ],
  },
  {
    stage: 7,
    title: "Costing & ROI",
    description:
      "Calculate expected net profit, investment, ROI and margin from documented inputs.",
    steps: [
      "Record item price, shipping and currency.",
      "Choose either an estimated allowance or actual documented additional costs.",
      "Calculate percentage fees against the actual selling price.",
      "Calculate ROI = net profit / total investment × 100 and profit margin separately.",
      "Review the internal 80–100% ROI target without altering the result.",
      "Explain why the stopwatch example gives 143.8%, not an unsupported 101%.",
    ],
    dos: [
      "Document fee, promotion, tax and conversion assumptions.",
      "Seek trainer approval for costing and target exceptions.",
    ],
    donts: [
      "Do not double-count costs covered by the allowance.",
      "Do not change inputs merely to fit the target.",
    ],
  },
  {
    stage: 8,
    title: "Listing",
    description:
      "Create accurate simulated listings, variation mappings and a complete QA record.",
    steps: [
      "Open approved source and reference listings.",
      "Write an accurate title, condition, category, brand and origin.",
      "Use authorized media and verified item specifics.",
      "Map every variant to the exact supplier variant and internal SKU.",
      "Write benefits, specifications, precautions and working instructions.",
      "Verify buyer-visible shipping, seller costs and promotional charges.",
      "Preview and submit the listing for trainer QA.",
    ],
    dos: [
      "Use accurate mandatory product information.",
      "Prepare a simulated listing before authorized live work.",
    ],
    donts: [
      "Do not invent specifications or conceal mandatory origin.",
      "Do not assume promotional services are free or publish without authorization.",
    ],
  },
  {
    stage: 9,
    title: "Order Processing",
    description:
      "Process fictional orders accurately using verified product, variant, destination and costs.",
    steps: [
      "Confirm simulated payment, product, SKU and variation.",
      "Open the approved source and check current price and stock.",
      "Verify the dummy address and shipping eligibility.",
      "Recalculate profitability and request approval for unexpected charges.",
      "Record a fictional supplier order ID and tracking follow-up.",
    ],
    dos: [
      "Check exact color, quantity and current source availability.",
      "Use approved purchasing methods for any later authorized work.",
    ],
    donts: [
      "Do not use real customer data in training.",
      "Do not use deceptive checkout, unpaid-cart or temporary-card workarounds.",
    ],
  },
  {
    stage: 10,
    title: "Fulfillment & Tracking",
    description:
      "Interpret evidence-backed tracking events and escalate delivery exceptions.",
    steps: [
      "Distinguish supplier processing, carrier acceptance and tracking generation.",
      "Interpret synthetic international transit, customs and final-mile events.",
      "Identify delivery attempts, confirmed delivery and delays.",
      "Update records from evidence and escalate exceptions.",
    ],
    dos: [
      "Label training events as synthetic and timestamp them.",
      "Treat Day 1–13 as a reference cycle.",
    ],
    donts: [
      "Do not fabricate tracking events.",
      "Do not promise delivery based on a reference timeline.",
    ],
  },
  {
    stage: 11,
    title: "Customer Management",
    description:
      "Practice accurate, clear and professional responses to fictional customer cases.",
    steps: [
      "Read the synthetic complaint and available order evidence.",
      "Draft an accurate acknowledgment or tracking explanation.",
      "Choose appropriate support, return, refund or escalation action.",
      "Record the resolution and meet the 24-business-hour response target.",
    ],
    dos: [
      "Assess accuracy, clarity, professionalism and escalation.",
      "Use only facts supported by the available record.",
    ],
    donts: [
      "Do not send training messages to live customers.",
      "Do not promise unsupported outcomes or issue unauthorized refunds.",
    ],
  },
  {
    stage: 12,
    title: "Financial Management",
    description:
      "Reconcile order revenue with actual costs, refunds, fees and financial records.",
    steps: [
      "Record dummy order revenue and supplier costs.",
      "Include shipping, marketplace fees, promotions, refunds and conversion.",
      "Calculate realized profit and ROI from complete costs.",
      "Document reconciliation differences and account contribution.",
    ],
    dos: [
      "Distinguish manual records from verified bank payments.",
      "Retain calculation inputs and an auditable history.",
    ],
    donts: [
      "Do not judge profitability from revenue alone.",
      "Do not label unverified manual records as confirmed payments.",
    ],
  },
  {
    stage: 13,
    title: "Optimization",
    description:
      "Identify evidence-based improvements to listings and supplier performance.",
    steps: [
      "Analyze titles, main images, conversion and price competitiveness.",
      "Review supplier reliability, complaints and return rates.",
      "Audit listing quality and document measurable recommendations.",
      "Compare training performance rather than raw assignment counts.",
    ],
    dos: [
      "Tie each recommendation to a documented finding.",
      "Monitor outcomes and supplier stock or price changes.",
    ],
    donts: [
      "Do not invent performance metrics.",
      "Do not optimize by removing mandatory product information.",
    ],
  },
  {
    stage: 14,
    title: "Scaling",
    description:
      "Plan controlled growth based on consistent profitability and operational competence.",
    steps: [
      "Identify consistently successful approved products.",
      "Review supplier reliability, stock and price monitoring.",
      "Plan approved variations and additional product categories.",
      "Submit a simulated growth plan with risk controls and measurable profitability.",
    ],
    dos: [
      "Use controlled expansion and supervisor review.",
      "Measure profitability rather than revenue alone.",
    ],
    donts: [
      "Do not bypass competency gates.",
      "Do not scale on one unverified result or guaranteed-profit claims.",
    ],
  },
];
export const dayPlan: [string, number, string][] = [
  ["Introduction to E-commerce", 0, "F01"],
  ["Understanding E-commerce Platforms", 0, "F01"],
  ["The Dropshipping Business Journey", 0, "F01"],
  ["Opportunities & Account Readiness", 1, "F01"],
  ["Seller Account Setup & Security", 2, "F01"],
  ["Prepare Your Training Workspace", 3, "F01"],
  ["Foundation Competency Check", 3, "F01"],
  ["eBay Product Hunting Fundamentals", 4, "F02"],
  ["Sold History vs. Completed Listings", 4, "F02"],
  ["Competitor Analysis & Evidence", 4, "F02"],
  ["Product Selection & Shortlisting", 5, "F03"],
  ["AliExpress Supplier Discovery", 6, "F04"],
  ["Compare Sources & Exact Variants", 6, "F05"],
  ["Supplier Qualification & Checkout Verification", 6, "F04"],
  ["Investment, Profit & ROI", 7, "F06"],
  ["Actual Fees & Sustainable Pricing", 7, "F06"],
  ["Sourcing & Costing Assessment", 7, "F06"],
  ["Accurate Product Titles & Categories", 8, "F08"],
  ["Authorized Images & Media", 8, "F08"],
  ["Variations & Internal SKU Mapping", 8, "F07"],
  ["Verified Item Specifics & Origin", 8, "F08"],
  ["Product Descriptions & Precautions", 8, "F08"],
  ["Shipping Settings & Buyer-visible Charges", 8, "F08"],
  ["Seller Costs & Promotions", 8, "F08"],
  ["Preview & Listing Quality Audit", 8, "F08"],
  ["Simulated Publication Approval", 8, "F09"],
  ["Listing Competency Assessment", 8, "F08"],
  ["Simulated Order Processing", 9, "F10"],
  ["Source Changes & Order Exceptions", 9, "F10"],
  ["Order Accuracy Assessment", 9, "F10"],
  ["Fulfillment & Tracking Foundations", 10, "F11"],
  ["Interpret Carrier & Customs Events", 10, "F11"],
  ["Delivery Delays & Escalations", 10, "F11"],
  ["Professional Customer Communication", 11, "F12"],
  ["Complaints, Returns & Disputes", 11, "F12"],
  ["Customer Support Evaluation", 11, "F12"],
  ["Order Profit & Complete Costs", 12, "F13"],
  ["Financial Controls & Refunds", 12, "F13"],
  ["Reconciliation & Realized ROI", 12, "F13"],
  ["Listing Performance Optimization", 13, "F14"],
  ["Supplier Reliability & Quality Audits", 13, "F14"],
  ["Controlled Scaling Decisions", 14, "F14"],
  ["Final Integrated Practical Project", 14, "F15"],
  ["Remediation & Portfolio Review", 14, "F15"],
  ["Final Evaluation & Certification Decision", 14, "F15"],
];
export function requiredGate(day: number) {
  return day <= 7
    ? 0
    : day <= 11
      ? 1
      : day <= 17
        ? 2
        : day <= 27
          ? 3
          : day <= 30
            ? 4
            : day <= 39
              ? 5
              : 6;
}
export function lessonContent(day: number): Content {
  const [title, stage, formKey] = dayPlan[day - 1],
    s = stages[stage],
    f = forms.find((x) => x.key === formKey)!;
  const foundations = [
    "E-commerce means buying and selling goods or services online. A customer discovers a product, places an order and pays; the business fulfills it and handles delivery, returns and support. A marketplace brings many sellers into one shared shopping platform; an independent store gives one business its own catalog and checkout. Revenue is the amount received from sales. Profit is what remains after product cost, shipping, platform fees, refunds and other documented costs. Identify who owns each responsibility before choosing a business model.",
    "Choose a platform by the business model and account requirements. eBay, Amazon and Walmart are marketplaces with their own seller rules. Shopify supports an independent storefront whose owner must attract customers. TikTok Shop connects shopping to content and creators. Alibaba supports business-to-business wholesale sourcing, while AliExpress commonly offers small-quantity retail products. These platforms are not interchangeable. Seller eligibility, customer acquisition, fulfillment, fees and return responsibilities must be checked for the target country before use.",
    "Dropshipping is a fulfillment arrangement in which a seller accepts an order and an authorized supplier ships the product to the customer. The seller remains responsible for accurate listings, delivery promises, support and returns. Follow the operating journey: account readiness, setup, preparation, research, selection, sourcing, costing, listing, orders, tracking, support, reconciliation, optimization and controlled scaling. A supplier reference is not authorization: eBay's wholesale-supplier requirement and restrictions on post-sale retail/marketplace sourcing require management verification before live fulfillment.",
  ];
  const explanation = `${day <= 3 ? foundations[day - 1] : `${title}: ${s.description}`} In this lesson, work through the supervised steps, document what you observed, and explain your decision. The practical output is ${f.short.toLowerCase()}. Teaching material awaits management review and is not live marketplace evidence.`;
  return {
    explanation,
    steps: s.steps,
    dos: s.dos,
    donts: s.donts,
    precautions: [
      "Use synthetic customer and account data during practice.",
      "A quiz or completed checklist does not authorize live publishing, purchasing, refunds or account changes.",
      "eBay permits wholesale-supplier dropshipping; purchasing from another retailer or marketplace after a sale for direct delivery is restricted. Management must verify a compliant fulfillment arrangement before live use.",
    ],
    checklist: [
      {
        id: "marketplace",
        label:
          "I confirmed the marketplace, lesson objective and demonstration context.",
      },
      {
        id: "evidence",
        label:
          "I understand the evidence I must collect and can separate observed facts from assumptions.",
      },
      {
        id: "permissions",
        label: "I reviewed the precautions and my permitted training actions.",
      },
      {
        id: "sop",
        label:
          "I followed the SOP steps and checked my work before submission.",
      },
    ],
    example:
      stage === 7
        ? "Internal stopwatch example, pending final verification: sold reference $7.92, source $2.01, planned price $5.88, rating 4.9, store feedback 98%, quoted delivery 8 days. With a 20% allowance, investment is $2.412; estimated profit $3.468 and ROI 143.8%. A 101% claim needs additional documented costs."
        : `Synthetic training demonstration: ${title}. Use the assigned fictional scenario, record each step and explain how you would verify the same facts in an authorized live environment. Missing screenshots and videos are placeholders awaiting management uploads.`,
    assignment: `Independently complete ${f.title}. ${f.description} Attach attributable evidence and explain your findings; submit for trainer review after completing this checklist.`,
    evidence:
      "Attach at least one evidence file, preserve source URLs where applicable, and explain what the evidence confirms. Synthetic evidence must be clearly labeled.",
    rubric: [
      { label: "Accuracy and verified inputs", weight: 40 },
      { label: "Evidence and traceability", weight: 30 },
      { label: "Operating controls and reasoning", weight: 20 },
      { label: "Clear documentation", weight: 10 },
    ],
    resources: [
      {
        label: "eBay dropshipping policy — check current requirements",
        url: "https://www.ebay.com/help/selling/posting-items/setting-postage-options/drop-shipping?id=4176",
      },
      { label: "eBay Seller Center", url: "https://www.ebay.com/sellercenter" },
      {
        label: "AliExpress — verify source and checkout",
        url: "https://www.aliexpress.com/",
      },
    ],
    slides: [
      { title, body: s.description },
      ...s.steps.map((step, index) => ({
        title: `Step ${index + 1}`,
        body: step,
      })),
      {
        title: "Practice, evidence & review",
        body: `${f.title}: submit attributable evidence. Approval unlocks progression; a completed checklist alone does not.`,
      },
    ],
    video: null,
    classification: "pending",
  };
}
export const platforms = [
  [
    "eBay",
    "Marketplace",
    "Auctions and fixed-price listings; seller accounts, research and order handling.",
  ],
  [
    "Shopify",
    "Independent store",
    "Store ownership, product pages, checkout, payments and customer acquisition.",
  ],
  [
    "TikTok Shop",
    "Social commerce",
    "Shopping through content and creators; regional seller eligibility applies.",
  ],
  [
    "Amazon",
    "Marketplace",
    "Seller accounts with FBA or FBM; competitive listings and inventory controls.",
  ],
  [
    "Walmart Marketplace",
    "Marketplace",
    "Seller application, eligibility and marketplace fulfillment requirements.",
  ],
  [
    "Alibaba",
    "B2B sourcing",
    "Wholesale manufacturers, bulk buying and negotiated supply.",
  ],
  [
    "AliExpress",
    "Retail marketplace",
    "Small-quantity products, supplier discovery, variants and shipping verification.",
  ],
];
