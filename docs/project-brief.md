# PROJECT: DR. COMMERCE ACADEMY
## Interactive eBay Dropshipping Training & Operations Portal

**Parent Organization:** NGB Consultancy  
**Training Brand:** Dr. Commerce  
**Product Name:** Dr. Commerce Academy  
**Program:** Professional eBay Dropshipping Operations Specialist  
**Duration:** 45 Days  
**Platform:** Responsive Web Application / Progressive Web App  
**Project Type:** Learning Management System + Practical Operations Simulator + Trainer Dashboard

---

# 1. YOUR ROLE

Act as a senior full-stack developer, SaaS architect, product designer, LMS specialist, e-commerce operations expert, instructional designer, and UI/UX engineer.

Build a fully functional, visually engaging, easy-to-use **Dr. Commerce Academy** web application.

This must NOT be a static presentation, generic dashboard template, or ordinary course website.

It must function as a real training environment where students learn the operating methodology, practice individual tasks, submit evidence, receive feedback, track performance, and progressively qualify to work on actual eBay dropshipping operations.

Trainers must have their own accounts to deliver lessons, assign work, review submissions, monitor student performance, approve operational steps, and control course progression.

Administrators must be able to oversee trainers, students, accounts, cohorts, curriculum, assignments, assessments, and operational approvals.

**Core principle: Every lesson must lead to a practical action, and every practical action must have an evaluation mechanism.**

Use the supplied operational methodology as the source of truth. Preserve all supplied internal thresholds and steps unless they conflict with accurate product information, platform authorization, or secure operational procedures. Clearly mark improvements as "Dr. Commerce Recommendation."

Do not invent verified sales, supplier ratings, delivery estimates, screenshots, tracking events, or outcomes.

---

# 2. DESIGN & BRAND IDENTITY

Build a premium, modern, clean and visually interactive training portal.

## Branding

- Primary brand: Dr. Commerce
- Parent branding: NGB Consultancy
- Display both company logos in appropriate locations.
- Dr. Commerce should be the primary learner-facing identity.
- Display "A Subsidiary of NGB Consultancy" in the login screen, application footer, and about page.
- Use the supplied logos as the visual reference.
- Extract the primary and secondary brand colors from the actual logo assets.
- The available Dr. Commerce branding uses a blue-and-white corporate direction.
- Provide a centralized theme configuration so management can change logo, colors and typography without modifying each screen.
- Never invent an official logo if the correct asset is missing; use an upload placeholder.

## Visual appearance

Design the portal like a modern SaaS product and interactive digital academy.

Use:

- White and soft-blue surfaces
- Deep navy headings
- Branded blue gradients
- Rounded dashboard cards
- Clean typography such as Inter or Plus Jakarta Sans
- Subtle shadows and refined borders
- Simple icons and microanimations
- Interactive progress indicators
- Animated step transitions
- Responsive layouts
- Professional, restrained motion

Use color deliberately:

- Blue: learning and primary actions
- Green: approved/completed
- Amber: pending review or caution
- Red: rejected/critical error
- Neutral gray: locked or inactive

Do not overwhelm users with gradients, decorations, or excessive dashboard widgets.

## Navigation structure

Desktop: Collapsible left sidebar, top navbar, content workspace.

Mobile: Collapsible navigation with touch-friendly controls.

Core navigation:

1. Dashboard
2. My Learning Journey
3. Courses & Lessons
4. Practice Lab
5. Assignments
6. Product Research
7. Operational Workflows
8. My Submissions
9. Assessments
10. Performance
11. Resources & SOP Library
12. Notifications
13. Profile & Settings

Show role-specific navigation.

---

# 3. TECHNOLOGY ARCHITECTURE

Preferred stack:

- Next.js with App Router and TypeScript
- Tailwind CSS
- shadcn/ui component library
- Lucide icons
- Framer Motion for lightweight animations
- Supabase Authentication
- PostgreSQL database
- Supabase Storage for training files and evidence
- Row Level Security for data isolation
- React Hook Form + Zod for forms
- Recharts for performance charts
- Server-side authorization for consequential actions
- Responsive Progressive Web App configuration

Use clean, modular architecture and reusable components.

Make the application deployable to Vercel with Supabase as its backend.

Provide database migrations, environment-variable examples, seed scripts, configuration instructions, and a clear README.

Do not hardcode passwords, secret API keys or database credentials.

Implement real persistence, not simulated frontend-only saving.

The first release should be a focused operational LMS, not an unnecessarily complex enterprise ERP.

---

# 4. USER ROLES & ACCESS CONTROL

## ROLE A — SUPER ADMIN / MANAGEMENT

Full permission to:

- Add, disable and manage trainees
- Add, disable and manage trainers
- Create training batches/cohorts
- Allocate students to trainers
- Edit curriculum and SOPs
- Manage lesson content and training resources
- Monitor all trainees
- Review and override assessments with an audit record
- Manage operational approval permissions
- View student performance analytics
- Manage course enrollment and payment statuses
- View completion and certification reports
- Configure branding and organizational settings

## ROLE B — TRAINER / TRAINEE MANAGER

Trainer responsibilities:

- Access complete course material
- Open structured lecture plans
- Deliver lessons through Presentation Mode
- View instructor-only teaching notes
- Assign daily tasks
- Set deadlines
- Review student research submissions
- Approve or reject product findings
- Review supplier verification
- Review ROI and costing calculations
- Audit listing drafts
- Assess simulated orders
- Evaluate tracking and customer-service exercises
- Add feedback and correction notes
- Give marks using predefined rubrics
- Monitor attendance and daily progress
- Unlock the next learning stage
- Escalate exceptional cases to management

Trainers can access only their assigned students and cohorts unless given broader authorization.

## ROLE C — TRAINEE / STUDENT

Each student gets a private login and dashboard containing:

- Enrolled course
- Current day and learning stage
- Daily lessons
- Readable SOPs
- Video lessons
- Presentations
- Interactive checklists
- Do's and Don'ts
- Realistic examples
- Step-by-step practical instructions
- Resource links
- Assigned tasks
- Submission forms
- Previous submissions
- Trainer feedback
- Grades
- Performance statistics
- Certificates and achievements

Students must never see another student's private information or submissions.

## OPTIONAL ROLE D — QUALITY AUDITOR

Can review operational submissions and confirm readiness for real-account work without managing course content.

---

# 5. CENTRAL LEARNING EXPERIENCE

The entire course should feel like a guided professional training journey.

Each student progresses through:

**Understand → Watch → Follow SOP → Complete Precaution Checklist → Practice → Submit Evidence → Trainer Review → Correct if Required → Get Approved → Unlock Next Step**

Build this as a reusable lesson workflow component.

## Every practical lesson must contain:

1. Lesson title and learning objective
2. Estimated completion time
3. Beginner-friendly explanation
4. Trainer-led presentation
5. Video or annotated screenshot area
6. Realistic worked example
7. Required tools and links
8. Step-by-step operating instructions
9. Do's checklist
10. Don'ts and common mistakes
11. Precautions and critical warnings
12. Interactive readiness checklist
13. Guided practice task
14. Independent practical assignment
15. Evidence submission form
16. Assessment criteria
17. Trainer review and feedback
18. Approval/rejection status
19. Remediation/resubmission
20. Next lesson unlock

Checklist state and lesson progress must save automatically.

A student must not be able to unlock gated operational activities merely by clicking "Complete Lesson."

Completion must satisfy the required evidence and approval conditions.

---

# 6. COURSE INTRODUCTION — BEGINNER E-COMMERCE FOUNDATION

The first training module must start from absolute beginner level.

## Lesson 1 — Introduction to E-Commerce

Teach:

- What is e-commerce?
- How online stores and marketplaces work
- What is online selling?
- What is a seller account?
- What is a buyer account?
- What is a supplier?
- What is product sourcing?
- What is inventory?
- What is dropshipping?
- How does a dropshipping transaction work?
- Difference between revenue, profit, gross margin and ROI
- Basic order fulfillment
- Importance of accurate delivery information and customer satisfaction

Use illustrated flow diagrams.

## Lesson 2 — Understanding E-Commerce Platforms

Create attractive individual learning cards for:

**eBay**
- Online marketplace
- Listings, auctions and fixed-price sales
- Individual and business seller accounts
- Seller opportunities
- Product research
- Order handling

**Shopify**
- Independent online-store platform
- Store ownership and management
- Product pages and checkout
- Payment providers
- Customer acquisition and marketing
- Store-based selling opportunities

**TikTok Shop**
- Social-commerce marketplace
- Shopping through content and creators
- Seller eligibility
- Product listings
- Affiliate and promotional opportunities
- Regional availability requirements

**Amazon**
- Marketplace selling
- Seller accounts
- FBA and FBM fulfillment
- Competitive listings
- Product and inventory management

**Walmart Marketplace**
- Marketplace model
- Seller application and eligibility
- Listing and fulfillment requirements
- Marketplace selling opportunities

**Alibaba**
- Primarily B2B sourcing
- Wholesale manufacturers and suppliers
- Bulk purchasing and negotiations
- Sourcing opportunities

**AliExpress**
- Retail and small-quantity product marketplace
- Product and supplier discovery
- Variation selection
- Supplier review analysis
- Shipping methods and estimated delivery

Explain how these platforms differ without treating them as interchangeable.

Use beginner-friendly comparison tables and interactive flashcards.

This section is an overview. The professional operational specialization begins with eBay and AliExpress.

## Lesson 3 — Introduction to eBay Dropshipping

Teach the entire commercial process with an interactive visual flow.

**Opportunity / Account → Setup → Preparation → Research → Product Selection → Supplier / Sourcing → Costing → Listing → Order → Fulfillment → Customer Management → Financial Management → Optimization → Scaling**

Clicking any stage should open its corresponding training module.

Create a simple demonstration of a buyer placing an order, the seller processing it, supplier fulfillment, tracking and final delivery.

Use synthetic examples clearly labeled as demonstrations.

Include an assessment before proceeding.

---

# 7. DR. COMMERCE CORE OPERATIONS CURRICULUM

Build the full 14-stage curriculum, preserving this exact sequence.

Each stage should have its own course section, operational checklist, practical assignment, documentation form and trainer approval workflow.

## STAGE 01 — OPPORTUNITY / ACCOUNT

Teach:

- E-commerce opportunities
- Business workflow and responsibilities
- Marketplace account structure
- Target marketplace and selling country
- Account navigation
- Account limitations and permissions
- Basic operational risks
- Profitability expectations versus guarantees

Practical task:
Complete an account-readiness assessment using a demonstration account.

Trainer evaluates account understanding before allowing the next stage.

## STAGE 02 — SETUP

Teach:

- Account settings
- Seller dashboard
- Notification settings
- Shipping and return configurations
- Basic account security
- Payment and financial settings
- User permissions

All settings must be verified in the current account interface.

Students may observe or practice with a demonstration environment but cannot independently change live client-account settings.

## STAGE 03 — PREPARATION

Teach the required tools:

- eBay
- AliExpress
- Product/media download extension
- Google Sheets / internal operational forms
- Cainiao tracking
- Final-mile carrier tracking
- Internal customer communication tools

Teach SKU conventions, recordkeeping, sourcing links and order traceability.

Practical task:
Prepare a complete training workspace.

## STAGE 04 — PRODUCT RESEARCH / HUNTING

This is a major practical training section.

Teach the supplied Dr. Commerce hunting methodology:

1. Open the target eBay marketplace.
2. Search a relevant product keyword.
3. Apply the appropriate product filters.
4. Select New condition.
5. Review Sold Items and Completed Items separately.
6. Apply relevant country and delivery filters.
7. Inspect relevant sellers.
8. Examine actual selling history.
9. Record recent completed sales with confirmed sold status.
10. Compare selling prices.
11. Identify potentially profitable products.
12. Record the research evidence and reference URL.
13. Submit a product candidate for sourcing review.

### Interactive product hunting screen

Create a dedicated research form with:

- Student name and ID (automatically populated)
- Date
- Target country
- Category
- Product name
- Keyword researched
- eBay product URL
- Competitor seller
- Observed selling price
- Sold quantity
- Research period
- Sold-history evidence
- Number of competitors examined
- Product condition
- Variation availability
- Screenshots/evidence attachments
- Research notes
- Student recommendation
- Trainer decision

Support multiple research records per student.

### Do's checklist

- Verify sold-history evidence.
- Confirm the selected marketplace.
- Check product condition.
- Compare relevant sellers.
- Record genuine selling prices.
- Preserve research sources.
- Check whether variants are commercially viable.

### Don'ts checklist

- Do not count unsold completed listings as sales.
- Do not fabricate sale quantities.
- Do not rely on one competitor alone.
- Do not use screenshots without recording links.
- Do not assume an advertised price is an actual selling price.
- Do not submit incomplete research records.

Student clicks "Submit Product for Review."

Trainer receives a notification and can:

- Approve
- Reject
- Request Changes

Trainer must be able to attach notes to the exact incorrect field.

Rejected products remain in the student's history for learning.

## STAGE 05 — PRODUCT SELECTION

Build a product-selection scorecard.

Evaluate:

- Sales demand
- Competitor pricing
- Supplier availability
- Variation complexity
- Product risk
- Potential profitability

Suggested scoring weights:
Demand 30%, price opportunity 20%, supplier availability 20%, variation simplicity 15%, operational risk 15%.

Mark this scorecard as a Dr. Commerce recommendation rather than a historical company rule.

Students submit shortlisted products.

Trainer approves candidates for sourcing.

## STAGE 06 — SUPPLIER / SOURCING

Teach AliExpress supplier selection.

Preserve these internal standards:

- Product rating must be above 4.5/5.
- Supplier store feedback must be above 95%.
- Supplier should have an identifiable, established AliExpress shop.
- USA target delivery: 10–12 days.
- UK target delivery: 5–7 days.
- European destination estimates must be verified individually.
- Desired USA free-shipping condition: eligible basket over $10.
- Desired UK/Europe free-shipping condition: eligible basket over £8, where actually offered.
- Exclude temporary welcome deals from sustainable-cost assumptions.
- Avoid treating ordinary temporary sales as permanent source prices.
- Super Deals may be considered only when the actual eligibility, checkout price and price stability are verified.
- Verify final selected variant, inventory, destination and checkout shipping charges.

### Supplier sourcing form

Fields:

- Linked research Product ID
- AliExpress source URL
- Supplier/store name
- Product rating
- Number of reviews
- Store positive feedback
- Source product price
- Selected variant
- Variation price
- Shipping method
- Estimated delivery
- Free-shipping threshold
- Actual shipping eligibility
- Current stock availability
- Screenshots
- Alternative supplier
- Supplier qualification result

Automate threshold checks where numeric values are entered.

Do not automatically approve suppliers solely from their ratings.

Trainer checks evidence and approves or rejects sourcing.

## STAGE 07 — COSTING & ROI

Create an interactive ROI calculator connected to each researched product.

Preserve the company target of **80–100% estimated ROI**.

Use:

**ROI = (Expected Net Profit ÷ Total Investment) × 100**

Record:

- AliExpress item price
- Shipping cost
- Estimated additional-cost allowance (default 20% where appropriate)
- Actual marketplace fees
- Promotion charges
- Currency conversion expenses
- Applicable taxes or additional costs
- Expected selling price
- Expected net profit
- ROI
- Profit margin
- Minimum viable selling price

Do not double-count costs already represented by the allowance.

Where percentage-based marketplace fees depend on selling price, calculate them using the actual fee structure.

Include editable assumptions.

### Stopwatch training example

Clearly identify this as an internal example requiring final evidence verification:

- Competitor sold price: $7.92
- Source price: $2.01
- Planned selling price: $5.88
- Supplier product rating: 4.9
- Supplier positive feedback: 98%
- Quoted delivery: 8 days
- Estimated additional-cost allowance: 20%

Base investment = $2.01 × 1.20 = $2.412.

Estimated profit, before any further unrecorded costs = $3.468.

ROI on those inputs = 143.8%.

The original claimed ROI of 101% is not supported by these inputs alone.

Add an interactive learning exercise where trainees identify this discrepancy and explain which additional documented costs could change the result.

Products outside the 80–100% target require review rather than silently altering the calculation.

Trainer must approve costing before the listing stage.

## STAGE 08 — LISTING

Build a practical listing-preparation workspace.

Teach:

1. Open selected reference eBay listing.
2. Open approved AliExpress source.
3. Review reference product title.
4. Produce an accurate, relevant SEO-optimized title.
5. Select correct product condition.
6. Download or prepare authorized product images and videos.
7. Select relevant product category.
8. Review existing variation attributes.
9. Replace unsuitable attributes with appropriate custom attributes.
10. Match every eBay variation to the exact supplier variation.
11. Upload correct variation images.
12. Assign internal SKUs.
13. Enter appropriate quantities.
14. Complete item specifics using verified source details.
15. Write product description.
16. Include key benefits and technical specifications.
17. Include precautions, handling and working instructions.
18. Configure delivery and shipping settings.
19. Confirm buyer-visible delivery charges.
20. Review applicable seller costs.
21. Review promotional listing settings and actual charges.
22. Preview the complete listing.
23. Submit for trainer approval.

Keep unbranded product selection as an internal sourcing preference, but require accurate brand, item condition, country-of-origin and other product information.

Do not conceal mandatory origin information, invent specifications or assume promotional services are free.

### Listing practice workspace

Include:

- Reference eBay URL
- Approved source URL
- Listing title
- Category
- Condition
- Brand/product designation
- Description editor
- Image upload
- Video link/media attachment
- Variation builder
- SKU mapping table
- Item specifics
- Pricing
- Shipping
- Preview mode
- Final QA checklist

Create a visual mock listing preview.

Students prepare a simulated listing first.

Trainer reviews the listing and marks it:

- Draft
- Submitted
- Changes Requested
- Approved
- Ready for Authorized Publishing

Only properly authorized users can act on live accounts.

## STAGE 09 — ORDER PROCESSING

Use simulated orders and dummy customer information during training.

Teach:

- Receive an eBay order.
- Confirm payment and selected product.
- Identify correct SKU and variation.
- Open the approved source link.
- Check current source price and availability.
- Verify destination address.
- Verify shipping cost and eligibility.
- Review actual expected profitability.
- Use an approved purchasing method.
- Confirm the supplier order.
- Record AliExpress order ID.
- Update order status.
- Schedule tracking follow-up.

If a shipping charge appears unexpectedly, teach trainees to verify legitimate shipping options, source alternatives, or obtain commercial approval.

Do not teach temporary-card, unpaid-cart or deceptive checkout workarounds.

### Order simulator

Generate clearly labeled fictional training orders.

Students must correctly select product, variant, address and supplier.

Introduce deliberate mistakes such as:

- Wrong color
- Wrong quantity
- Changed supplier price
- Unexpected shipping cost
- Unavailable variation

Score each student on accuracy.

## STAGE 10 — FULFILLMENT & TRACKING

Teach:

- Supplier processing status
- Carrier acceptance
- Valid tracking-number generation
- Cainiao tracking
- International transit
- Customs status
- Final-mile carrier
- Delivery attempts
- Confirmed delivery
- Delay investigation

Use the company's Day 1–13 cycle as a reference example, not a guaranteed delivery promise.

Tracking simulator must use synthetic timestamped events labeled as simulated.

Students should practice:

- Correctly interpreting tracking events
- Updating internal records
- Identifying delayed shipments
- Escalating exceptions
- Providing customer updates based on actual available evidence

Do not allow fabricated tracking updates.

## STAGE 11 — CUSTOMER MANAGEMENT

Create an interactive customer-service practice environment.

Teach:

- Professional messaging
- Order acknowledgments
- Shipping confirmations
- Tracking explanations
- Late-delivery support
- Wrong-product complaints
- Damaged-item complaints
- Refund requests
- Return handling
- Dispute escalation
- Resolution documentation

Internal customer response target: within 24 business hours.

Include trainer-assessed communication simulations.

Allow trainees to draft responses and submit them for review.

Trainer marks communication for:

- Accuracy
- Clarity
- Professionalism
- Customer support
- Correct action taken
- Appropriate escalation

## STAGE 12 — FINANCIAL MANAGEMENT

Build training forms for:

- Order revenue
- Supplier purchase costs
- Shipping
- Actual fees
- Promotions
- Refunds
- Returns
- Currency conversion
- Order profit
- Realized ROI
- Account contribution
- Reconciliation

Display financial dashboards using dummy data until real authorized data is connected.

## STAGE 13 — OPTIMIZATION

Teach:

- Listing performance analysis
- Title optimization
- Main image improvement
- Price competitiveness
- Conversion problems
- Supplier performance
- Customer complaints
- Return rates
- Listing quality audits

Students must submit documented optimization recommendations.

## STAGE 14 — SCALING

Teach:

- Identifying consistently successful products
- Supplier reliability
- Stock and price monitoring
- Expanding approved variations
- Introducing additional product categories
- Controlled operational growth
- Measuring profitability rather than revenue alone

Students prepare a simulated scaling plan.

Trainer evaluates the commercial logic.

---

# 8. DAILY 45-DAY TRAINING STRUCTURE

Create a complete 45-day course calendar.

Map the curriculum as follows:

Days 1–3: E-commerce introduction, marketplaces, dropshipping fundamentals and business opportunities.

Days 4–7: eBay account understanding, setup, tools, preparation and first assessment.

Days 8–11: Product hunting, sold history, competitor analysis and product research assignments.

Days 12–14: AliExpress sourcing, supplier comparison and supplier verification.

Days 15–17: Investment calculations, ROI, pricing and sourcing/costing assessment.

Days 18–22: Listing creation, titles, images, categories, variations, specifications and descriptions.

Days 23–27: Listing QA, simulated publication and listing competency assessment.

Days 28–30: Order processing and purchasing simulations.

Days 31–33: Shipping, tracking, delivery and fulfillment exceptions.

Days 34–36: Customer support, complaints, dispute management and evaluations.

Days 37–39: Financial controls, actual profitability and reconciliation.

Days 40–42: Listing optimization, supplier performance and scaling decisions.

Days 43–45: Final integrated practical project, evaluation and certification decision.

Every day needs:

- Daily learning objective
- Lesson content
- Trainer script
- Presentation slides or interactive lesson cards
- Example
- Required tools
- Do's and Don'ts
- Precaution checklist
- Guided activity
- Independent assignment
- Submission requirement
- Scoring rubric
- Trainer feedback
- Completion and remediation rules

Generate editable curriculum records rather than hardcoding all content into frontend components.

---

# 9. TRAINER TEACHING CONSOLE

Create a dedicated teaching screen optimized for classroom use.

When a trainer opens Day 8, for example, the screen must display:

**Day 8 — eBay Product Hunting Fundamentals**

The trainer sees:

- Lesson objectives
- Instructor-only speaking script
- Visual slides
- Example screenshots and videos
- Demonstration instructions
- Common trainee mistakes
- Questions to ask students
- Current class roster
- Attendance
- Assignment controls
- Student completion status

Include a **Start Teaching** button that opens a full-screen presentation mode.

Presentation mode should allow:

- Next/previous slide
- Step-by-step content reveal
- Interactive checks and questions
- Trainer-only speaker notes
- Exit to lesson overview
- Open linked teaching resources

Trainer scripts must be editable through the admin interface.

Trainer should be able to assign a practical task without leaving the teaching environment.

---

# 10. STUDENT PRACTICE LAB

Build a visual operational practice area.

Students should be able to choose or access their assigned exercise.

Example:

**Practice Lab → Product Hunting → Exercise 04**

Display a structured screen with:

Left section:
- Task instructions
- Example image
- Working links
- Do's and Don'ts
- Precautionary checklist
- Step-by-step instructions

Right section:
- Product research entry form
- Evidence upload
- Save Draft
- Validate Form
- Submit for Review

On smaller screens, show instructions and form as accessible tabs.

After submitting, show a submission-status timeline.

Example:

Draft → Submitted → Under Review → Changes Requested / Approved.

Allow approved work to pass structured data into the next operational stage.

For example:

Approved Product Research → Supplier Sourcing → Costing → Listing Draft.

Never require the student to repeatedly enter the same product information at every stage.

Keep a complete audit trail of approvals, changes and resubmissions.

---

# 11. TRAINER PRODUCT APPROVAL QUEUE

This is a critical feature.

Create a dedicated trainer approval dashboard.

Columns:

- Student
- Cohort
- Product
- Target marketplace
- Submitted date
- Selling price
- Recent sold evidence
- Source status
- ROI status
- Current workflow stage
- Submission status
- Action

Trainer clicks "Review."

Open the full submission with evidence, links and product history.

Allow the trainer to:

- Approve
- Reject
- Request changes
- Give numerical score
- Add field-specific comments
- Attach corrective examples
- Assign resubmission deadline

Approval must update the student's dashboard immediately.

Rejected work should be retained for evaluation and learning purposes.

Apply the same general approval mechanism to sourcing, costing, listing, order processing, fulfillment and other operational stages.

---

# 12. FIFTEEN INTEGRATED OPERATIONAL FORMS

Build these as native portal forms backed by database tables.

Do not use external spreadsheets as the application's primary storage.

Provide Excel/CSV import and export where useful.

Forms:

F01 — Account Readiness & Setup

F02 — Product Hunting Log

F03 — Product Selection Scorecard

F04 — Supplier Qualification

F05 — Source Comparison

F06 — ROI & Pricing Calculator

F07 — Variation & SKU Mapping

F08 — Listing Preparation & QA

F09 — Listing Publication Register

F10 — Order Processing

F11 — Shipment & Tracking Monitor

F12 — Customer Support & Dispute Log

F13 — Order Profit & Financial Reconciliation

F14 — Performance & Optimization Dashboard

F15 — Trainee Competency & Certification

Ensure related data flows across forms using persistent identifiers.

Use proper validation, required fields, dropdown values, numerical range checks, comments, save-as-draft support, submission history and approval states.

Financial calculations must be consistent across forms.

---

# 13. PERFORMANCE & ASSESSMENT SYSTEM

Every trainee should have a live performance dashboard.

Show:

- Total course progress
- Days completed
- Lessons completed
- Pending lessons
- Assignments submitted
- Assignments approved
- Assignments rejected
- Research products submitted
- Products approved
- Research accuracy
- Sourcing accuracy
- ROI calculation accuracy
- Listing quality score
- Fulfillment accuracy
- Customer-support score
- Financial calculation accuracy
- Trainer comments
- Overall assessment score

Support configurable weights.

Suggested final assessment weights:

- Product research: 15%
- Supplier verification: 15%
- Costing and pricing: 15%
- Listing quality: 20%
- Order processing/tracking: 15%
- Customer management: 10%
- Financial controls: 10%

Suggested pass mark: 80%, subject to management approval.

Critical operational failures must prevent certification even if the total score exceeds 80%.

A trainer must be able to schedule remediation and retesting.

Create cohort-level analytics to compare training progress, not just raw assignment counts.

---

# 14. INTERACTIVE TRAINING CONTENT

Support these content blocks in the lesson editor:

- Rich text
- Images
- Annotated screenshots
- Embedded training videos
- Flow diagrams
- Step-by-step cards
- Interactive checklists
- Do's and Don'ts panels
- Warning notes
- Worked calculation examples
- Flashcards
- Multiple-choice questions
- Scenario questions
- Practical tasks
- Uploaded files
- External resource links

Each resource must have an evidence classification:

- Verified live example
- Internal company example
- Synthetic training demonstration
- Pending verification

Do not fabricate live interfaces or results.

If a screenshot is missing, create a clearly labeled media placeholder that management can replace.

Make every lesson editable without changing the application source code.

---

# 15. PRACTICAL EXERCISE LIBRARY

Create an exercise system supporting at least:

- 50 product research exercises
- Supplier comparison assignments
- ROI calculation challenges
- Multivariation listing simulations
- Simulated order processing
- Shipping/tracking scenarios
- Customer-service role-plays
- Dispute-resolution scenarios
- Financial reconciliation exercises
- Final practical project

Exercise difficulty:

Beginner → Intermediate → Advanced.

Seed illustrative practice records with explicit synthetic-data labels.

Do not invent genuine eBay sold history or real supplier performance evidence.

Each assignment must have a rubric, maximum score and required evidence.

---

# 16. TRAINING SAFETY & APPROVAL GATES

Create seven core competency gates.

Gate 1: Foundation and account readiness.

Gate 2: Product research qualification.

Gate 3: Supplier sourcing and costing qualification.

Gate 4: Listing production qualification.

Gate 5: Order processing qualification.

Gate 6: Fulfillment/customer-support qualification.

Gate 7: Final operational certification.

Use supervised simulations before consequential real-account activity.

A student's completed quiz is not automatic authorization to publish a listing, purchase an item, issue a refund or change a client-account setting.

Implement server-enforced permissions and explicit supervisor approval.

Where the underlying supplier fulfillment arrangement, current eBay policy, account settings or marketplace capabilities require verification, show a management verification status and prevent unauthorized live actions.

Never automate publishing, order placement, customer messaging or account changes without an authorized integration and proper permissions.

---

# 17. MANAGEMENT CONTROL PANEL

Management must be able to see:

- Total enrolled students
- Active cohorts
- Active trainers
- Average course completion
- Students falling behind
- Pending approvals
- Rejected submissions
- Critical mistakes
- Assessment pass rates
- Certification readiness
- Student enrollment/payment status

Program pricing configuration:

Proposed total fee: PKR 40,000.

Proposed enrollment payment: PKR 20,000.

Proposed remaining balance: PKR 20,000 after 30 days.

Keep payment collection as a manual administrative record in the MVP; do not represent manual records as confirmed bank payments without authorized verification.

Include course-fee configuration so management can approve or change the fee later.

---

# 18. DATABASE & DATA RELATIONSHIPS

Design the database to include at least:

- organizations
- users/profiles
- roles and permissions
- cohorts
- enrollments
- trainers/cohort assignments
- courses
- modules
- lessons
- lesson content blocks
- lesson completion records
- learning checklists
- checklist responses
- assignments
- assignment submissions
- submission evidence
- trainer feedback
- assessments
- assessment attempts
- grading rubrics
- product research records
- product selection decisions
- suppliers
- sourcing records
- costing records
- product variations/SKUs
- listing drafts
- simulated orders
- simulated order items
- simulated tracking events
- customer-service scenarios
- support tickets
- financial records
- approvals
- certification records
- notifications
- audit logs
- training assets
- document versions
- payment/enrollment records

Use relational keys so products, sources, listings, orders and trainee activity remain traceable.

Use Row Level Security and server-side role verification.

Store changes to financial calculations, approvals and operating records in auditable history.

Do not expose real customer personal information in training datasets.

---

# 19. KEY PAGE DESIGNS

## A. LOGIN PAGE

Premium two-column branded layout.

Left:
Dr. Commerce logo, welcome message, learning-platform introduction and abstract commerce-inspired graphics.

Right:
Secure sign-in form, password recovery and role-aware navigation after login.

Footer:
Dr. Commerce — A Subsidiary of NGB Consultancy.

## B. STUDENT DASHBOARD

Greeting, cohort, current training day, course progress ring, next lesson card, pending tasks, latest trainer feedback, performance summary and complete learning roadmap.

Primary action:
**Continue Training**

Secondary action:
**Open Practice Lab**

## C. LEARNING ROADMAP

Horizontal/vertical interactive timeline containing all 14 operating stages.

Show:

- Completed stages
- Current stage
- Locked stages
- Pending trainer approval
- Remediation required

Click to open lesson details.

## D. LESSON PAGE

Use a modern split-screen learning layout.

Include a video/image/presentation area, trainer-approved SOP steps, interactive checklists, notes, practice actions and a clear progress footer.

## E. PRODUCT HUNTING WORKSPACE

Dedicated operational form with visible instructions, source links, evidence uploads, auto-save and submission history.

## F. TRAINER DASHBOARD

Class progress, today's lectures, assignment queue, pending product approvals, at-risk students and quick access to Presentation Mode.

## G. TRAINER REVIEW SCREEN

Full student submission, source evidence, field-level review, correction notes, rubric grading and approval buttons.

## H. MANAGEMENT DASHBOARD

Cohorts, trainee status, role management, performance trends, curriculum control and certification outcomes.

---

# 20. USER EXPERIENCE REQUIREMENTS

Make all important tasks achievable with minimal clicks.

Students must always know:

- Where they are in the course
- What they are currently learning
- What action they must complete
- What evidence they must submit
- What they have done correctly
- What needs correction
- What will unlock next

Use contextual help beside difficult form fields.

Use tooltips to explain ROI, seller rating, sold history, variation mapping and other beginner concepts.

Save drafts automatically when appropriate.

Show clear success/error messages.

Require confirmation before irreversible actions.

Use accessible UI controls and keyboard-friendly navigation.

Ensure desktop performance is excellent because most product research is likely to happen on desktop.

Mobile support is required for lessons, notifications and basic review tasks.

---

# 21. INITIAL MVP PRIORITIES

Build the application incrementally instead of generating hundreds of disconnected screens.

## DEVELOPMENT PHASE A — FUNCTIONAL FOUNDATION

Complete:

- Design system and branding configuration
- Authentication
- Roles and permissions
- Student dashboard
- Trainer dashboard
- Cohort management
- Curriculum database
- Lesson viewer
- Checklist engine
- Assignment/submission workflow
- Review/approval workflow
- Progress persistence

All features must save real data.

## DEVELOPMENT PHASE B — PRODUCT RESEARCH OPERATIONS

Complete the full working path:

Introduction lessons → Product Hunting → Research Form → Evidence Upload → Trainer Review → Product Approval → Sourcing → Costing.

Make this path operational and thoroughly tested before expanding.

## DEVELOPMENT PHASE C — REMAINING OPERATIONAL WORKFLOWS

Add listing, variation mapping, orders, tracking, customer management, finances, optimization and scaling.

Reuse the common assignment, evidence, approval and audit infrastructure.

## DEVELOPMENT PHASE D — COMPLETE TRAINING CONTENT

Populate the full 45-day curriculum with editable lessons, trainer scripts, checklist content, examples, practice exercises and assessment rubrics.

Distinguish verified company material from generated instructional material.

## DEVELOPMENT PHASE E — EVALUATION & DELIVERY

Add:

- Advanced trainee analytics
- Final assessments
- Certification records
- Printable reports
- CSV/Excel exports
- Resource library
- Comprehensive testing
- Deployment documentation

Do not move to a later development phase while earlier core workflows are broken.

---

# 22. ACCEPTANCE TESTS

The completed application must pass these practical demonstrations.

### Test 1 — Student login
A newly enrolled trainee signs in and sees only their assigned cohort and course.

### Test 2 — Lesson progression
The trainee opens Day 8, studies the lesson, completes required checklists and starts a practical product-hunting assignment.

### Test 3 — Research submission
The trainee enters a product URL, sold-history evidence, competitor information and research notes; saves a draft and submits it.

### Test 4 — Trainer review
The assigned trainer receives the submission, reviews the evidence and requests a correction.

### Test 5 — Resubmission
The trainee sees the precise feedback, edits the product record and resubmits it without losing history.

### Test 6 — Approval and data flow
Trainer approves the product. Its verified research fields automatically appear in the sourcing workflow.

### Test 7 — Financial accuracy
The ROI calculator correctly evaluates the stopwatch example and flags unsupported assumptions.

### Test 8 — Permission security
A trainee cannot approve their own submission or access another trainee's private records.

### Test 9 — Operational gate
A student without required authorization cannot publish a live listing, process a live order or bypass a gated assessment.

### Test 10 — Persistence
All records, checklists, progress, feedback and approvals remain correct after logout and login.

### Test 11 — Trainer presentation
The trainer opens a lesson in presentation mode, sees instructor notes and can allocate the associated practical task.

### Test 12 — Management reporting
Management can view course progress, pending approvals, student competency and assessment outcomes across authorized cohorts.

Do not declare the system complete based only on visual appearance.

---

# 23. FINAL DEVELOPMENT INSTRUCTIONS

Build this as a polished, working, production-oriented application.

Never substitute static UI mockups for functional features.

Do not generate empty buttons, fictional integrations or fake success notifications.

Use clearly labeled synthetic records when genuine example data is unavailable.

Keep course content manageable through the admin panel.

Use actual database persistence and enforce role permissions on the server.

Keep Dr. Commerce branding consistent across login, dashboards, lessons, forms, reports and certificates.

Use NGB Consultancy as the parent organizational identity.

The application's central purpose is:

**To train, guide, evaluate and qualify eBay dropshipping operations specialists through a single interactive environment where teaching, practice, evidence, trainer feedback and operational progression are connected.**

Start by:

1. Creating the application architecture.
2. Designing the authentication and role model.
3. Creating the database schema.
4. Building the UI design system.
5. Implementing the learner/trainer dashboard.
6. Building one complete, working training sequence: Introduction → Product Hunting → Trainer Approval → Sourcing → ROI.
7. Testing this complete workflow.
8. Only then extending the system to the remaining modules.

Provide source code, database migrations, seed data, installation instructions and deployment steps.

**Do not stop after generating an attractive dashboard. The project succeeds only when a real trainee can complete a lesson, perform a practical task, submit evidence, receive meaningful trainer feedback and proceed through the approved training workflow.**