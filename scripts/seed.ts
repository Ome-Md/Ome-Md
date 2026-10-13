import { randomBytes, randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { pool, query, transaction } from "../src/lib/db";
import { hashPassword } from "../src/lib/password";
import { defaultBranding } from "../src/lib/branding";
import {
  stages,
  dayPlan,
  lessonContent,
  requiredGate,
} from "../src/lib/curriculum";
import { forms } from "../src/lib/forms";

const existing = await query<{ id: string }>(
  "SELECT id FROM organizations LIMIT 1",
);
if (existing.length) {
  console.log("Existing academy data preserved; seed skipped.");
  await pool.end();
  process.exit(0);
}
const localFixtures = process.env.AUTH_MODE !== "supabase";
const credentials: Record<
  string,
  { email: string; password: string; id: string }
> = {};
const ids = {
  org: randomUUID(),
  course: randomUUID(),
  cohort: randomUUID(),
  other: randomUUID(),
  student: randomUUID(),
  second: randomUUID(),
  trainer: randomUUID(),
  admin: randomUUID(),
};
await transaction(async (client) => {
  await query(
    "INSERT INTO organizations(id,name,settings) VALUES($1,$2,$3)",
    [ids.org, "NGB Consultancy", JSON.stringify(defaultBranding)],
    client,
  );
  if (localFixtures)
    for (const [key, id, name, role, email] of [
      [
        "student",
        ids.student,
        "Ayesha Khan",
        "student",
        "ayesha@demo.drcommerce.test",
      ],
      [
        "second",
        ids.second,
        "Bilal Ahmed",
        "student",
        "bilal@demo.drcommerce.test",
      ],
      [
        "trainer",
        ids.trainer,
        "Hassan Malik",
        "trainer",
        "hassan@demo.drcommerce.test",
      ],
      [
        "admin",
        ids.admin,
        "Academy Management",
        "admin",
        "management@demo.drcommerce.test",
      ],
    ] as const) {
      const password = randomBytes(18).toString("base64url");
      credentials[key] = { email, password, id };
      await query(
        "INSERT INTO profiles(id,organization_id,email,display_name,role,synthetic) VALUES($1,$2,$3,$4,$5,true)",
        [id, ids.org, email, name, role],
        client,
      );
      if (process.env.AUTH_MODE !== "supabase")
        await query(
          "INSERT INTO local_credentials(profile_id,password_hash) VALUES($1,$2)",
          [id, hashPassword(password)],
          client,
        );
    }
  await query(
    "INSERT INTO courses(id,organization_id,title,description) VALUES($1,$2,$3,$4)",
    [
      ids.course,
      ids.org,
      "Professional eBay Dropshipping Operations Specialist",
      "45-day supervised operations program: understand, practice, document, review and qualify.",
    ],
    client,
  );
  if (localFixtures) {
    await query(
      "INSERT INTO cohorts(id,organization_id,course_id,name,start_date) VALUES($1,$2,$3,'Commerce Cohort 01',CURRENT_DATE-7),($4,$2,$3,'Commerce Cohort 02',CURRENT_DATE)",
      [ids.cohort, ids.org, ids.course, ids.other],
      client,
    );
    await query(
      "INSERT INTO trainer_assignments(trainer_id,cohort_id) VALUES($1,$2)",
      [ids.trainer, ids.cohort],
      client,
    );
    await query(
      "INSERT INTO enrollments(student_id,cohort_id) VALUES($1,$2),($3,$4)",
      [ids.student, ids.cohort, ids.second, ids.other],
      client,
    );
  }
  const moduleIds: Record<number, string> = {};
  for (const s of stages) {
    moduleIds[s.stage] = randomUUID();
    await query(
      "INSERT INTO modules(id,course_id,stage,title,description) VALUES($1,$2,$3,$4,$5)",
      [moduleIds[s.stage], ids.course, s.stage, s.title, s.description],
      client,
    );
  }
  const lessonIds: Record<number, string> = {};
  for (let day = 1; day <= 45; day++) {
    const [title, stage, formKey] = dayPlan[day - 1],
      id = randomUUID();
    lessonIds[day] = id;
    const content = lessonContent(day);
    await query(
      "INSERT INTO lessons(id,module_id,course_id,day,title,objective,required_gate,content,form_key) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)",
      [
        id,
        moduleIds[stage],
        ids.course,
        day,
        title,
        `Demonstrate ${title.toLowerCase()} with documented evidence and supervisor evaluation.`,
        requiredGate(day),
        JSON.stringify(content),
        formKey,
      ],
      client,
    );
    await query(
      "INSERT INTO instructor_notes(lesson_id,script,questions) VALUES($1,$2,$3)",
      [
        id,
        `Open by asking learners what they already know about ${title.toLowerCase()}. Explain: ${content.explanation}\nDemonstrate each SOP step using synthetic data. Pause to ask which facts require evidence. Guide the practice, inspect precautions, assign ${forms.find((f) => f.key === formKey)!.title}, and review using the rubric. End by explaining that only trainer approval unlocks the next stage.`,
        JSON.stringify([
          "Which observation can you verify?",
          "What could go wrong at this step?",
          "What evidence will support your decision?",
        ]),
      ],
      client,
    );
    await query(
      "INSERT INTO assignments(organization_id,lesson_id,cohort_id,title,form_key,difficulty,instructions,required_evidence,rubric,due_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,now()+interval '2 days')",
      [
        ids.org,
        id,
        localFixtures ? ids.cohort : null,
        `${title} — practical`,
        formKey,
        day < 15 ? "Beginner" : day < 30 ? "Intermediate" : "Advanced",
        content.assignment,
        content.evidence,
        JSON.stringify(content.rubric),
      ],
      client,
    );
    for (const [position, slide] of content.slides.entries())
      await query(
        "INSERT INTO lesson_content_blocks(lesson_id,position,kind,classification,body) VALUES($1,$2,'step','synthetic',$3)",
        [id, position, JSON.stringify(slide)],
        client,
      );
    if (localFixtures && day <= 7) {
      await query(
        "INSERT INTO lesson_completions(student_id,lesson_id,approved_by) VALUES($1,$2,$3)",
        [ids.student, id, ids.trainer],
        client,
      );
      await query(
        "INSERT INTO checklist_responses(student_id,lesson_id,responses) VALUES($1,$2,$3)",
        [
          ids.student,
          id,
          JSON.stringify(
            Object.fromEntries(content.checklist.map((c) => [c.id, true])),
          ),
        ],
        client,
      );
    }
  }
  if (localFixtures)
    await query(
      "INSERT INTO approvals(student_id,gate,approved_by,reason) VALUES($1,1,$2,$3)",
      [
        ids.student,
        ids.trainer,
        "Synthetic demonstration fixture: foundation and account readiness approved for testing Day 8.",
      ],
      client,
    );
  for (let index = 1; index <= 50; index++)
    await query(
      "INSERT INTO assignments(organization_id,title,form_key,difficulty,instructions,required_evidence,rubric) VALUES($1,$2,'F02',$3,$4,$5,$6)",
      [
        ids.org,
        `Product hunting exercise ${String(index).padStart(2, "0")}`,
        index <= 20 ? "Beginner" : index <= 40 ? "Intermediate" : "Advanced",
        `Synthetic exercise ${index}: compare ${2 + (index % 3)} relevant sellers for a permitted, unbranded product category. Preserve URLs and distinguish verified sold status from completed listings. No genuine sales history is supplied; collect attributable evidence in a demonstration context.`,
        "Source URLs, clearly classified sold-history evidence, competitor comparison and research notes.",
        JSON.stringify(lessonContent(8).rubric),
      ],
      client,
    );
  for (const f of forms.filter((f) => f.key !== "F02"))
    await query(
      "INSERT INTO assignments(organization_id,title,form_key,difficulty,instructions,required_evidence,rubric) VALUES($1,$2,$3,'Intermediate',$4,$5,$6)",
      [
        ids.org,
        `${f.short} — scenario exercise`,
        f.key,
        f.description,
        "Document the assigned synthetic scenario and attach evidence.",
        JSON.stringify(lessonContent(8).rubric),
      ],
      client,
    );
  const questions = [
    {
      question: "Does every completed eBay listing represent a sale?",
      choices: [
        "Yes, completed means sold",
        "No, confirm actual sold status separately",
        "Only listings with images",
      ],
      answer: 1,
    },
    {
      question: "Who authorizes progression into an operational stage?",
      choices: [
        "A completed checklist alone",
        "The trainee",
        "The assigned trainer after evidence review",
      ],
      answer: 2,
    },
    {
      question: "What does ROI measure?",
      choices: [
        "Net profit divided by investment",
        "Revenue divided by selling price",
        "Total order count",
      ],
      answer: 0,
    },
    {
      question:
        "Which fulfillment arrangement requires management verification?",
      choices: [
        "Any proposed live supplier arrangement",
        "Only the logo",
        "No verification is needed",
      ],
      answer: 0,
    },
    {
      question: "How should missing live evidence be presented?",
      choices: [
        "Invent a realistic screenshot",
        "Label a placeholder or synthetic example",
        "Mark it verified",
      ],
      answer: 1,
    },
  ];
  for (let gate = 1; gate <= 7; gate++)
    await query(
      "INSERT INTO assessments(course_id,title,gate,questions) VALUES($1,$2,$3,$4)",
      [
        ids.course,
        gate === 1
          ? "Foundation & account readiness"
          : `Competency gate ${gate} — knowledge check`,
        gate,
        JSON.stringify(questions),
      ],
      client,
    );
  const resources = [
    [
      "eBay Dropshipping Policy",
      "Policy",
      "https://www.ebay.com/help/selling/posting-items/setting-postage-options/drop-shipping?id=4176",
      "pending",
      "Verify current policy and the proposed supplier fulfillment arrangement before live operations.",
    ],
    [
      "Product Hunting SOP",
      "SOP",
      null,
      "internal",
      "New condition; Sold Items and Completed Items reviewed separately; multiple competitors, attributable sold history and preserved URLs.",
    ],
    [
      "Supplier Qualification Standards",
      "SOP",
      null,
      "internal",
      "Rating above 4.5; store feedback above 95%; destination and checkout evidence; no welcome deals in sustainable costs.",
    ],
    [
      "Stopwatch ROI Worked Example",
      "Calculator",
      null,
      "internal",
      "Source $2.01; planned $5.88; 20% allowance gives $2.412 investment and 143.8% ROI before unrecorded costs.",
    ],
    [
      "Listing Quality Checklist",
      "Checklist",
      null,
      "internal",
      "Accurate brand, condition, origin, specifics and variant-to-SKU mapping; authorized media; shipping and promotion costs verified.",
    ],
    [
      "Training Media Library",
      "Media",
      null,
      "pending",
      "No verified screenshots or video assets have been supplied. Management can upload and classify resources.",
    ],
  ];
  for (const [title, kind, url, classification, description] of resources)
    await query(
      "INSERT INTO training_assets(organization_id,title,kind,url,classification,description) VALUES($1,$2,$3,$4,$5,$6)",
      [ids.org, title, kind, url, classification, description],
      client,
    );
  if (localFixtures) {
    await query(
      "INSERT INTO notifications(user_id,title,message) VALUES($1,$2,$3)",
      [
        ids.student,
        "Your next chapter: product hunting",
        "Day 8 is ready. Study the SOP, complete your readiness checklist and submit your first research record.",
      ],
      client,
    );
    await query(
      "INSERT INTO notifications(user_id,title,message) VALUES($1,$2,$3)",
      [
        ids.trainer,
        "Your classroom is ready",
        "Open Day 8 in Presentation Mode and assign the practical exercise.",
      ],
      client,
    );
  }
  await query(
    "INSERT INTO audit_logs(actor_id,student_id,action,details) VALUES($1,$2,$3,$4)",
    [
      localFixtures ? ids.admin : null,
      localFixtures ? ids.student : null,
      localFixtures ? "seed.synthetic" : "seed.curriculum",
      JSON.stringify({
        description: localFixtures
          ? "All fixture people, progress and examples are synthetic training data. No live outcomes or payments are claimed."
          : "Editable curriculum and clearly classified training examples initialized. No accounts, progress, approvals or credentials were fabricated.",
      }),
    ],
    client,
  );
});
if (localFixtures) {
  const directory = process.env.ACADEMY_DATA_DIR ?? ".academy-data";
  await mkdir(directory, { recursive: true, mode: 0o700 });
  await writeFile(
    directory + "/demo-credentials.json",
    JSON.stringify(credentials, null, 2),
    { mode: 0o600 },
  );
}
await pool.end();
console.log(
  localFixtures
    ? "Seeded 45 editable lessons, 14 stages plus foundations, 109 assignments and synthetic demo users. Generated passwords remain in the ignored local data directory."
    : "Seeded 45 editable lessons, 109 assignments and resource records. Provision the first administrator with db:admin; no synthetic identities or approvals were created.",
);
