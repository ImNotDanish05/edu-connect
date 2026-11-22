/**
 * Demo data: a fictional academy so a fresh install has something to look at.
 * Run with `make demo` (or `node dist/cli.js demo:seed`).
 *
 *   - Northwind Academy: twelve courses across five categories (content.ts), with real
 *     curricula: video lessons (EVS ids the local stub plays), articles, PDF cheat sheets,
 *     quizzes from a question bank, and reviewed projects with rubrics
 *   - three instructors, staff for support and finance, an admin, and 36 learners
 *   - two bundles, an all-access plan (monthly and yearly, USD and INR) and coupons
 *   - paid orders in USD (Stripe) and INR (Razorpay, GST on top) with invoices, one
 *     refund with its credit note, active, cancelling and past-due subscriptions
 *   - progress at every stage: lessons watched, quizzes passed and failed, projects
 *     waiting for review, sent back and approved, courses finished with certificates
 *   - reviews with instructor replies, Q&A threads with accepted answers, an open report
 *
 * Everything that has a service goes through it (enrollments, completion, certificates,
 * fulfilment), so counters, notifications and invoices are what real use produces.
 * Avatars are initials on a duotone, rendered in code: no stock photos, no faces.
 *
 * Refuses to run with NODE_ENV=production. If the demo admin already exists it only
 * prints the logins and exits.
 */
import crypto from "node:crypto";
import PDFDocument from "pdfkit";
import sharp from "sharp";
import { sql } from "kysely";
import { config } from "../core/config";
import { withTransaction } from "../core/effects";
import { newId } from "../core/ids";
import { db } from "../db/kysely";
import { buildSnapshot, grade, type BankQuestion } from "../domain/quiz";
import { clampScores } from "../domain/rubric";
import { storage } from "../integrations/storage";
import { closeRedis } from "../integrations/redis";
import { closeQueues } from "../jobs/registry";
import { hashPassword } from "../security/passwords";
import { markItemComplete } from "../services/progress.service";
import { saveSettings } from "../services/settings.service";
import { CATEGORIES, COURSES, INSTRUCTORS, LEARNERS, QA_THREADS, REVIEW_LINES, type DemoCourse, type DemoItem, type DemoQuestion } from "./content";
import { DEMO_BUNDLES, seedCommerce, type SeededCatalog } from "./commerce";

const ADMIN_EMAIL = "admin@example.com";
const DAY = 86_400_000;

// ─── Deterministic randomness ───────────────────────────────────────────────

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const rand = mulberry32(20261026);
export const int = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min;
export const pick = <T>(xs: readonly T[]): T => xs[Math.floor(rand() * xs.length)] as T;
export function sample<T>(xs: readonly T[], n: number): T[] {
  const copy = [...xs];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j] as T, copy[i] as T];
  }
  return copy.slice(0, Math.max(0, Math.min(n, copy.length)));
}

// ─── Images and files ───────────────────────────────────────────────────────

const DUOTONES = [
  ["#0A6B78", "#0E99AD"],
  ["#1E3A8A", "#2563EB"],
  ["#3B1C7A", "#6D28D9"],
  ["#064E3B", "#059669"],
  ["#7C2D12", "#C2410C"],
  ["#881337", "#BE123C"],
  ["#0F172A", "#334155"],
  ["#075985", "#0284C7"],
] as const;

function initials(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")).toUpperCase();
}

function avatarSvg(name: string, variant: number): string {
  const [dark, mid] = DUOTONES[variant % DUOTONES.length]!;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 320 320">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${mid}"/><stop offset="1" stop-color="${dark}"/></linearGradient></defs>
  <rect width="320" height="320" fill="url(#g)"/>
  <circle cx="262" cy="58" r="96" fill="none" stroke="#ffffff" stroke-opacity="0.16" stroke-width="3"/>
  <circle cx="262" cy="58" r="132" fill="none" stroke="#ffffff" stroke-opacity="0.1" stroke-width="3"/>
  <text x="160" y="160" dy="0.35em" text-anchor="middle" font-family="DejaVu Sans, Helvetica, Arial, sans-serif" font-size="120" font-weight="700" fill="#ffffff" letter-spacing="2">${initials(name)}</text>
</svg>`;
}

async function storeUpload(ownerId: string, purpose: "AVATAR" | "LECTURE_PDF" | "LECTURE_RESOURCE", body: Buffer, mime: string, fileName: string, image?: { width: number; height: number }): Promise<string> {
  const id = newId();
  const ext = fileName.split(".").pop();
  const key = `demo/${purpose.toLowerCase()}/${id}.${ext}`;
  await storage().put(key, body, mime);
  let thumbKey: string | null = null;
  if (image) {
    const thumb = await sharp(body).resize({ width: 320, withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
    thumbKey = `${key}.thumb.webp`;
    await storage().put(thumbKey, thumb, "image/webp");
  }
  await db
    .insertInto("media_uploads")
    .values({
      id,
      owner_id: ownerId,
      purpose,
      kind: image ? "IMAGE" : mime === "application/pdf" ? "PDF" : "DOCUMENT",
      mime_type: mime,
      file_name: fileName,
      declared_size: body.length,
      size_bytes: body.length,
      storage_key: key,
      thumb_key: thumbKey,
      width: image?.width ?? null,
      height: image?.height ?? null,
      status: "READY",
      completed_at: new Date(),
    })
    .execute();
  return id;
}

async function avatarFor(userId: string, name: string, variant: number): Promise<string> {
  const png = await sharp(Buffer.from(avatarSvg(name, variant))).png({ compressionLevel: 9 }).toBuffer();
  return storeUpload(userId, "AVATAR", png, "image/png", "avatar.png", { width: 320, height: 320 });
}

function pdfBuffer(title: string, points: string[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 56, info: { Title: title } });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    doc.rect(0, 0, doc.page.width, 8).fill("#0E99AD");
    doc.fillColor("#0B1220").font("Helvetica-Bold").fontSize(26).text(title, 56, 72);
    doc.moveDown(1.2).font("Helvetica").fontSize(12.5).fillColor("#334155");
    for (const p of points) doc.text(`•  ${p}`, { paragraphGap: 10, lineGap: 2 });
    doc.end();
  });
}

// ─── People ─────────────────────────────────────────────────────────────────

export interface DemoUser {
  id: string;
  name: string;
  email: string;
  currency: "IDR" | "USD" | "INR";
  /** Learners in India pay in INR through Razorpay. */
  inr: boolean;
}

function emailFor(name: string): string {
  return `${name.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z]+/g, ".").replace(/^\.|\.$/g, "")}@example.com`;
}
function usernameFor(name: string): string {
  return name.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
}

function printLogins(password: string | null, fresh: boolean): void {
  const lines = [
    "",
    `${config.PRODUCT_NAME} demo data (Northwind Academy)`,
    "",
    `  admin        ${ADMIN_EMAIL}`,
    `  support      support@example.com`,
    `  finance      finance@example.com`,
    `  instructor   ${emailFor(INSTRUCTORS[0].name)}  (owns three courses, has projects to grade)`,
    `  learner      ${emailFor(LEARNERS[0])}  (courses in progress, a certificate, a subscription)`,
    `  learner      ${emailFor(LEARNERS[9])}  (pays in INR through Razorpay)`,
    "",
    password ? `  password     ${password}   (shared by every demo account${fresh ? "; shown once" : ", from DEMO_PASSWORD"})` : "  password     the one printed when the demo was first seeded, or DEMO_PASSWORD",
    "",
  ];
  process.stdout.write(lines.join("\n") + "\n");
}

const LEGACY_COURSE_SLUGS = [
  "modern-typescript",
  "practical-sql",
  "machine-learning-foundations",
  "interfaces-people-trust",
  "git-and-code-review",
  "product-discovery",
  "containers-and-kubernetes",
  "statistics-for-decisions",
  "accessible-front-end",
  "writing-for-software-teams",
  "building-reliable-apis",
  "data-visualization-that-explains",
] as const;

const LEGACY_BUNDLE_SLUGS = ["data-career-starter", "production-ready-engineer"] as const;

export const DEMO_YOUTUBE_VIDEO_ID = "ndWpp9AVdbU";

/**
 * Idempotent upgrade for an already-seeded demo database: ensures IDR is enabled as the
 * default currency, adds Indonesia PPN 11% tax rule, upgrades legacy English catalog
 * content to the Indonesian EduConnect academic curriculum, and backfills IDR prices.
 */
async function ensureIdrSeeded(adminId: string): Promise<void> {
  await saveSettings(
    {
      currencies: { enabled: ["IDR", "USD", "INR"], default: "IDR" },
      gateways: { routing: { INR: "RAZORPAY", USD: "STRIPE", IDR: "STRIPE" }, fallback: "STRIPE" },
      tax: {
        enabled: true,
        mode: "EXCLUSIVE",
        rules: [
          { country: "ID", rateBps: 1100, label: "PPN" },
          { country: "IN", rateBps: 1800, label: "GST" },
        ],
      },
    },
    adminId,
  );

  // 1. Sync Categories (by position 0..4)
  const categoryId = new Map<string, string>();
  const dbCategories = await db.selectFrom("categories").select(["id", "position"]).orderBy("position").execute();
  for (const [i, cat] of CATEGORIES.entries()) {
    const row = dbCategories.find((r) => r.position === i) ?? dbCategories[i];
    if (row) {
      await db.updateTable("categories").set({ slug: cat.slug, name: cat.name, description: cat.description }).where("id", "=", row.id).execute();
      categoryId.set(cat.slug, row.id);
    }
  }

  // 2. Sync Instructors
  const dbInstructors = await db.selectFrom("users").select(["id"]).where("role", "=", "INSTRUCTOR").orderBy("created_at").orderBy("id").execute();
  for (const [i, ins] of INSTRUCTORS.entries()) {
    const row = dbInstructors[i];
    if (row) {
      await db.updateTable("users").set({ display_name: ins.name, headline: ins.headline, bio: ins.bio }).where("id", "=", row.id).execute();
    }
  }

  // 3. Sync Courses, Sections, Items, Lectures, Quizzes, Questions, Assignments & Prices
  for (const [ci, c] of COURSES.entries()) {
    const legacySlug = LEGACY_COURSE_SLUGS[ci];
    const row = await db
      .selectFrom("courses")
      .select(["id", "slug"])
      .where("slug", "in", legacySlug ? [c.slug, legacySlug] : [c.slug])
      .executeTakeFirst();
    if (!row) continue;

    await db
      .updateTable("courses")
      .set({
        slug: c.slug,
        title: c.title,
        subtitle: c.subtitle,
        description: c.description,
        outcomes: c.outcomes,
        prerequisites: c.prerequisites,
        level: c.level,
        language: "id",
      })
      .where("id", "=", row.id)
      .execute();

    const catId = categoryId.get(c.category);
    if (catId) {
      await db.updateTable("course_categories").set({ category_id: catId }).where("course_id", "=", row.id).execute();
    }
    await db.updateTable("order_items").set({ title: c.title }).where("sellable_type", "=", "COURSE").where("sellable_id", "=", row.id).execute();

    const dbSections = await db.selectFrom("course_sections").select(["id", "position"]).where("course_id", "=", row.id).orderBy("position").execute();
    for (const [si, sec] of c.sections.entries()) {
      const secRow = dbSections.find((s) => s.position === si) ?? dbSections[si];
      if (!secRow) continue;
      await db.updateTable("course_sections").set({ title: sec.title }).where("id", "=", secRow.id).execute();

      const dbItems = await db.selectFrom("course_items").select(["id", "position", "kind"]).where("section_id", "=", secRow.id).orderBy("position").execute();
      for (const [ii, it] of sec.items.entries()) {
        const itemRow = dbItems.find((x) => x.position === ii) ?? dbItems[ii];
        if (!itemRow) continue;
        await db.updateTable("course_items").set({ title: it.title }).where("id", "=", itemRow.id).execute();

        if (it.kind === "ARTICLE") {
          await db.updateTable("lectures").set({ body: it.body }).where("item_id", "=", itemRow.id).execute();
        } else if (it.kind === "VIDEO") {
          await db
            .updateTable("lectures")
            .set({ video_provider: "YOUTUBE", video_ref: DEMO_YOUTUBE_VIDEO_ID, video_status: "READY", body: it.notes ?? null })
            .where("item_id", "=", itemRow.id)
            .execute();
        } else if (it.kind === "PDF") {
          await db.updateTable("lectures").set({ body: "Unduh dan simpan rangkuman materi ini sebagai pendamping belajar." }).where("item_id", "=", itemRow.id).execute();
        } else if (it.kind === "QUIZ") {
          await db
            .updateTable("quizzes")
            .set({ instructions: "Jawab seluruh pertanyaan berikut, lalu kirimkan. Pembahasan akan ditampilkan setelah kuis dikirim." })
            .where("item_id", "=", itemRow.id)
            .execute();
          const qLinks = await db.selectFrom("quiz_questions").select(["question_id", "position"]).where("quiz_item_id", "=", itemRow.id).orderBy("position").execute();
          for (const [qi, q] of it.questions.entries()) {
            const qLink = qLinks.find((x) => x.position === qi) ?? qLinks[qi];
            if (!qLink) continue;
            const bq = bankQuestion(q);
            await db
              .updateTable("questions")
              .set({
                kind: bq.kind,
                prompt: bq.prompt,
                explanation: bq.explanation,
                points: bq.points,
                options: JSON.stringify(bq.options),
                accepted_answers: bq.acceptedAnswers,
                tags: [c.category],
              })
              .where("id", "=", qLink.question_id)
              .execute();
          }
        } else if (it.kind === "ASSIGNMENT") {
          const rubric = it.rubric.map(([title, description, maxPoints], i) => ({ id: `c${i + 1}`, title, description, maxPoints }));
          await db
            .updateTable("assignments")
            .set({
              instructions: it.instructions,
              rubric: JSON.stringify(rubric),
              pass_points: Math.ceil(rubric.reduce((a, r) => a + r.maxPoints, 0) * 0.6),
            })
            .where("item_id", "=", itemRow.id)
            .execute();
        }
      }
    }

    if (c.idr) {
      const found = await db.selectFrom("prices").select("id").where("sellable_type", "=", "COURSE").where("sellable_id", "=", row.id).where("currency", "=", "IDR").where("active", "=", true).executeTakeFirst();
      if (found) {
        await db.updateTable("prices").set({ amount_minor: c.idr, compare_at_minor: c.compareIdr ?? null }).where("id", "=", found.id).execute();
      } else {
        await db.insertInto("prices").values({ id: newId(), sellable_type: "COURSE", sellable_id: row.id, currency: "IDR", amount_minor: c.idr, compare_at_minor: c.compareIdr ?? null }).execute();
      }
    }
  }

  // Ensure any existing EVS or MP4 lectures across the whole database are upgraded to YouTube dummy video
  await db
    .updateTable("lectures")
    .set({ video_provider: "YOUTUBE", video_ref: DEMO_YOUTUBE_VIDEO_ID, video_status: "READY" })
    .where("lecture_kind", "=", "VIDEO")
    .where("video_provider", "in", ["EVS", "MP4"])
    .execute();

  // 4. Sync Bundles & Prices
  for (const [bi, def] of DEMO_BUNDLES.entries()) {
    const legacySlug = LEGACY_BUNDLE_SLUGS[bi];
    const row = await db
      .selectFrom("bundles")
      .select(["id", "slug"])
      .where("slug", "in", legacySlug ? [def.slug, legacySlug] : [def.slug])
      .executeTakeFirst();
    if (!row) continue;
    await db.updateTable("bundles").set({ slug: def.slug, title: def.title, description: def.description }).where("id", "=", row.id).execute();
    await db.updateTable("order_items").set({ title: def.title }).where("sellable_type", "=", "BUNDLE").where("sellable_id", "=", row.id).execute();
    const found = await db.selectFrom("prices").select("id").where("sellable_type", "=", "BUNDLE").where("sellable_id", "=", row.id).where("currency", "=", "IDR").where("active", "=", true).executeTakeFirst();
    if (found) {
      await db.updateTable("prices").set({ amount_minor: def.idr }).where("id", "=", found.id).execute();
    } else {
      await db.insertInto("prices").values({ id: newId(), sellable_type: "BUNDLE", sellable_id: row.id, currency: "IDR", amount_minor: def.idr }).execute();
    }
  }

  // 5. Sync Plan
  const plan = await db.selectFrom("plans").select("id").where("slug", "=", "all-access").executeTakeFirst();
  if (plan) {
    await db
      .updateTable("plans")
      .set({
        name: "Paket Akses Penuh (All-Access)",
        description: "Akses penuh ke seluruh modul di katalog, termasuk modul eksklusif khusus pelanggan, selama masa langgananmu aktif.",
        features: ["Akses semua modul saat ini dan modul baru mendatang", "Termasuk modul eksklusif khusus pelanggan", "Sertifikat kelulusan untuk setiap modul yang diselesaikan", "Bebas batalkan kapan saja tanpa penalti"],
      })
      .where("id", "=", plan.id)
      .execute();
    for (const [interval, amt] of [["MONTH", 790000], ["YEAR", 7900000]] as const) {
      const found = await db.selectFrom("prices").select("id").where("sellable_type", "=", "PLAN").where("sellable_id", "=", plan.id).where("currency", "=", "IDR").where("interval", "=", interval).where("active", "=", true).executeTakeFirst();
      if (found) {
        await db.updateTable("prices").set({ amount_minor: amt }).where("id", "=", found.id).execute();
      } else {
        await db.insertInto("prices").values({ id: newId(), sellable_type: "PLAN", sellable_id: plan.id, currency: "IDR", amount_minor: amt, interval }).execute();
      }
    }
  }

  // 6. Sync Reviews & Q&A Threads to Bahasa Indonesia
  const dbReviews = await db.selectFrom("reviews").select(["id"]).orderBy("id").execute();
  for (const [ri, rev] of dbReviews.entries()) {
    const [, body] = REVIEW_LINES[ri % REVIEW_LINES.length]!;
    await db.updateTable("reviews").set({ body }).where("id", "=", rev.id).execute();
  }
  const dbThreads = await db.selectFrom("qa_threads").select(["id"]).orderBy("id").execute();
  for (const [qi, qRow] of dbThreads.entries()) {
    const thread = QA_THREADS[qi % QA_THREADS.length]!;
    await db.updateTable("qa_threads").set({ title: thread.title, body: thread.body }).where("id", "=", qRow.id).execute();
    await db.updateTable("qa_replies").set({ body: thread.answer }).where("thread_id", "=", qRow.id).where("is_staff", "=", true).execute();
  }

  const hemat = await db.selectFrom("coupons").select("id").where("code", "=", "HEMAT50RB").executeTakeFirst();
  if (hemat) {
    await db.updateTable("coupons").set({ amount_off_minor: 500000 }).where("id", "=", hemat.id).execute();
  } else {
    await db
      .insertInto("coupons")
      .values({ id: newId(), code: "HEMAT50RB", description: "Potongan Rp 5.000 untuk kursus apa saja", kind: "FIXED", amount_off_minor: 500000, currency: "IDR", scope: "COURSES", per_user_limit: 1, created_by: adminId })
      .execute();
  }

  const existingIdrOrders = await db.selectFrom("orders").select("id").where("currency", "=", "IDR").limit(1).executeTakeFirst();
  if (!existingIdrOrders) {
    const usdLearners = await db
      .selectFrom("users")
      .select(["id"])
      .where("role", "=", "LEARNER")
      .where((eb) => eb.or([eb("preferred_currency", "is", null), eb("preferred_currency", "=", "USD")]))
      .orderBy("created_at")
      .execute();
    const idrLearnerIds = usdLearners.filter((_, idx) => idx % 3 !== 1).map((u) => u.id);
    if (idrLearnerIds.length) {
      await db.updateTable("users").set({ preferred_currency: "IDR" }).where("id", "in", idrLearnerIds).execute();

      const idrPlanPrices = await db.selectFrom("prices").select(["id", "interval", "amount_minor"]).where("sellable_type", "=", "PLAN").where("currency", "=", "IDR").execute();
      const monthPrice = idrPlanPrices.find((p) => p.interval === "MONTH");
      const yearPrice = idrPlanPrices.find((p) => p.interval === "YEAR");

      if (monthPrice) {
        await db
          .updateTable("subscriptions")
          .set({ currency: "IDR", price_id: monthPrice.id, amount_minor: Number(monthPrice.amount_minor) })
          .where("user_id", "in", idrLearnerIds)
          .where("currency", "=", "USD")
          .where("interval", "=", "MONTH")
          .execute();
      }
      if (yearPrice) {
        await db
          .updateTable("subscriptions")
          .set({ currency: "IDR", price_id: yearPrice.id, amount_minor: Number(yearPrice.amount_minor) })
          .where("user_id", "in", idrLearnerIds)
          .where("currency", "=", "USD")
          .where("interval", "=", "YEAR")
          .execute();
      }

      const usdOrders = await db
        .selectFrom("orders")
        .select(["id", "subtotal_minor", "discount_minor", "refunded_minor"])
        .where("user_id", "in", idrLearnerIds)
        .where("currency", "=", "USD")
        .execute();
      for (const o of usdOrders) {
        const sub = Math.round((Number(o.subtotal_minor) / 100) * 30000);
        const disc = Math.round((Number(o.discount_minor) / 100) * 30000);
        const net = Math.max(0, sub - disc);
        const tax = Math.round(net * 0.11);
        const tot = net + tax;
        const ref = Number(o.refunded_minor) > 0 ? tot : 0;
        await db
          .updateTable("orders")
          .set({
            currency: "IDR",
            subtotal_minor: sub,
            discount_minor: disc,
            tax_minor: tax,
            total_minor: tot,
            refunded_minor: ref,
            tax: JSON.stringify({ mode: "EXCLUSIVE", rateBps: 1100, label: "PPN", country: "ID" }),
          })
          .where("id", "=", o.id)
          .execute();
        await db
          .updateTable("order_items")
          .set({
            unit_minor: sub,
            discount_minor: disc,
            tax_minor: tax,
            total_minor: tot,
          })
          .where("order_id", "=", o.id)
          .execute();
        await db
          .updateTable("invoices")
          .set({
            currency: "IDR",
            subtotal_minor: ref > 0 ? -sub : sub,
            discount_minor: ref > 0 ? -disc : disc,
            tax_minor: ref > 0 ? -tax : tax,
            total_minor: ref > 0 ? -tot : tot,
          })
          .where("order_id", "=", o.id)
          .execute();
      }
    }
  } else {
    // Scale up any earlier 1/10th IDR subscriptions, orders, order_items, and invoices
    await sql`UPDATE subscriptions SET amount_minor = amount_minor * 10 WHERE currency = 'IDR' AND amount_minor < 200000`.execute(db);
    await sql`UPDATE order_items SET unit_minor = unit_minor * 10, discount_minor = discount_minor * 10, tax_minor = tax_minor * 10, total_minor = total_minor * 10 WHERE order_id IN (SELECT id FROM orders WHERE currency = 'IDR' AND subtotal_minor < 500000)`.execute(db);
    await sql`UPDATE invoices SET subtotal_minor = subtotal_minor * 10, discount_minor = discount_minor * 10, tax_minor = tax_minor * 10, total_minor = total_minor * 10 WHERE currency = 'IDR' AND ABS(subtotal_minor) < 500000`.execute(db);
    await sql`UPDATE orders SET subtotal_minor = subtotal_minor * 10, discount_minor = discount_minor * 10, tax_minor = tax_minor * 10, total_minor = total_minor * 10, refunded_minor = refunded_minor * 10 WHERE currency = 'IDR' AND subtotal_minor < 500000`.execute(db);
  }
}

export async function seedDemo(): Promise<void> {
  if (config.NODE_ENV === "production") throw new Error("demo:seed refuses to run with NODE_ENV=production");
  try {
    const existing = await db.selectFrom("users").select("id").where("email", "=", ADMIN_EMAIL).executeTakeFirst();
    if (existing) {
      await ensureIdrSeeded(existing.id);
      printLogins(config.DEMO_PASSWORD ?? null, false);
      return;
    }
    const password = config.DEMO_PASSWORD || crypto.randomBytes(9).toString("base64url");
    await seed(password);
    printLogins(password, !config.DEMO_PASSWORD);
  } finally {
    await closeQueues().catch(() => undefined);
    await closeRedis().catch(() => undefined);
  }
}

async function insertUser(hash: string, name: string, role: "LEARNER" | "INSTRUCTOR" | "SUPPORT" | "FINANCE" | "ADMIN", extra: { headline?: string; bio?: string; email?: string; createdAt?: Date } = {}): Promise<string> {
  const id = newId();
  await db
    .insertInto("users")
    .values({
      id,
      email: extra.email ?? emailFor(name),
      username: usernameFor(name),
      display_name: name,
      headline: extra.headline ?? null,
      bio: extra.bio ?? null,
      password_hash: hash,
      role,
      status: "ACTIVE",
      email_verified_at: new Date(),
      created_at: extra.createdAt ?? new Date(),
      last_seen_at: new Date(Date.now() - int(0, 5) * DAY),
    })
    .execute();
  return id;
}

// ─── Seed ───────────────────────────────────────────────────────────────────

async function seed(password: string): Promise<void> {
  const hash = await hashPassword(password);
  const now = Date.now();

  const admin = await insertUser(hash, "Ada Northwind", "ADMIN", { email: ADMIN_EMAIL, headline: "Academy administrator" });
  await saveSettings(
    {
      academyName: "Edu Connect",
      tagline: "Satu Platform untuk Belajar, Bimbingan Mentor, dan Raih Prestasi.",
      supportEmail: "help@northwind.example",
      currencies: { enabled: ["IDR", "USD", "INR"], default: "IDR" },
      gateways: { routing: { INR: "RAZORPAY", USD: "STRIPE", IDR: "STRIPE" }, fallback: "STRIPE" },
      tax: {
        enabled: true,
        mode: "EXCLUSIVE",
        rules: [
          { country: "ID", rateBps: 1100, label: "PPN" },
          { country: "IN", rateBps: 1800, label: "GST" },
        ],
      },
      seller: { legalName: "Northwind Academy Ltd", address: "1 Example Street, Example City 00000", taxId: "EX-123456789", email: "billing@northwind.example" },
      certificates: { signatoryName: "Ada Northwind", signatoryTitle: "Head of Learning", footer: "Northwind Academy certifies the completion of every lesson, quiz and project in this course." },
    },
    admin,
  );
  await insertUser(hash, "Sam Rivers", "SUPPORT", { email: "support@example.com", headline: "Learner support" });
  await insertUser(hash, "Fin Calder", "FINANCE", { email: "finance@example.com", headline: "Finance" });

  const instructors: string[] = [];
  for (const [i, ins] of INSTRUCTORS.entries()) {
    const id = await insertUser(hash, ins.name, "INSTRUCTOR", { headline: ins.headline, bio: ins.bio, createdAt: new Date(now - 120 * DAY) });
    await db.updateTable("users").set({ avatar_upload_id: await avatarFor(id, ins.name, i * 3) }).where("id", "=", id).execute();
    instructors.push(id);
  }

  const learners: DemoUser[] = [];
  for (const [i, name] of LEARNERS.entries()) {
    const id = await insertUser(hash, name, "LEARNER", { createdAt: new Date(now - int(5, 80) * DAY) });
    if (i % 3 !== 2) await db.updateTable("users").set({ avatar_upload_id: await avatarFor(id, name, i) }).where("id", "=", id).execute();
    // Majority of learners pay in IDR (default), ~20% in INR (including index 9), ~20% in USD.
    const inr = i === 9 || (i > 0 && i % 5 === 0);
    const usd = !inr && i > 0 && i % 4 === 0;
    const currency: "IDR" | "USD" | "INR" = inr ? "INR" : usd ? "USD" : "IDR";
    await db.updateTable("users").set({ preferred_currency: currency }).where("id", "=", id).execute();
    learners.push({ id, name, email: emailFor(name), currency, inr });
  }

  // ── Catalog ────────────────────────────────────────────────────────────
  const categoryId = new Map<string, string>();
  for (const [i, c] of CATEGORIES.entries()) {
    const id = newId();
    categoryId.set(c.slug, id);
    await db.insertInto("categories").values({ id, slug: c.slug, name: c.name, description: c.description, position: i }).execute();
  }

  const catalog: SeededCatalog = { courses: [] };
  let videoNo = 0;
  for (const [ci, c] of COURSES.entries()) {
    const course = await createCourse(c, ci, categoryId, instructors, () => ++videoNo, now);
    catalog.courses.push(course);
  }

  // ── Commerce: bundles, the plan, coupons, orders, subscriptions, a refund ──
  const commerce = await seedCommerce({ admin, learners, catalog, now, int, pick, sample, rand });

  // ── Learning: progress, quizzes, projects, certificates ─────────────────
  for (const e of commerce.enrollments) {
    const course = catalog.courses.find((x) => x.id === e.courseId)!;
    await simulateProgress(e.userId, course, e.target, instructors, now);
  }

  // A grading queue with work in it: learners part-way through a course with a project
  // have sent theirs in and are waiting for the instructor.
  let waiting = 0;
  for (const e of commerce.enrollments) {
    if (waiting >= 7 || e.target >= 1 || e.target === 0) continue;
    const course = catalog.courses.find((x) => x.id === e.courseId)!;
    const project = course.items.find((i) => i.kind === "ASSIGNMENT");
    if (!project) continue;
    const has = await db.selectFrom("assignment_submissions").select("id").where("item_id", "=", project.id).where("user_id", "=", e.userId).executeTakeFirst();
    if (has) continue;
    await submit(e.userId, course, project, "SUBMITTED", instructors, new Date(now - int(1, 72) * 3_600_000));
    waiting += 1;
  }

  await communityActivity(learners, catalog, instructors, now);

  // Free sign-ups and grants happened over the last two months, not all at seed time.
  await sql`UPDATE enrollments SET created_at = now() - (random() * interval '58 days') - interval '1 day' WHERE source IN ('FREE', 'GRANT')`.execute(db);
  // Spread activity across the last weeks so charts and streaks look lived in.
  await sql`UPDATE enrollments SET last_activity_at = now() - (random() * interval '12 days') WHERE last_activity_at IS NOT NULL AND completed_at IS NULL`.execute(db);
  process.stdout.write(`seeded ${catalog.courses.length} courses, ${learners.length} learners, ${commerce.orders} orders\n`);
}

// ─── Courses ────────────────────────────────────────────────────────────────

export interface SeededItem {
  id: string;
  kind: "LECTURE" | "QUIZ" | "ASSIGNMENT";
  demo: DemoItem;
  durationSeconds: number;
  questions?: BankQuestion[];
}

export interface SeededCourse {
  id: string;
  slug: string;
  title: string;
  access: DemoCourse["access"];
  usd: number | null;
  inr: number | null;
  idr: number | null;
  inPlan: boolean;
  ownerId: string;
  items: SeededItem[];
}

function bankQuestion(q: DemoQuestion): Omit<BankQuestion, "id"> {
  return {
    kind: q.kind,
    prompt: q.prompt,
    explanation: q.explanation,
    points: q.kind === "MULTI" ? 2 : 1,
    options: (q.options ?? []).map(([text, correct], i) => ({ id: String.fromCharCode(97 + i), text, correct })),
    acceptedAnswers: q.accepted ?? [],
    matchMode: "CASE_INSENSITIVE",
  };
}

async function createCourse(c: DemoCourse, ci: number, categoryId: Map<string, string>, instructors: string[], nextVideo: () => number, now: number): Promise<SeededCourse> {
  const id = newId();
  const ownerId = instructors[c.instructors[0]!]!;
  const publishedAt = new Date(now - (90 - ci * 6) * DAY);
  await db
    .insertInto("courses")
    .values({
      id,
      slug: c.slug,
      title: c.title,
      subtitle: c.subtitle,
      description: c.description,
      outcomes: c.outcomes,
      prerequisites: c.prerequisites,
      level: c.level,
      language: "id",
      status: "PUBLISHED",
      access_mode: c.access,
      included_in_subscription: c.inPlan ?? true,
      certificate_enabled: true,
      featured: !!c.featured,
      created_by: ownerId,
      published_at: publishedAt,
      created_at: new Date(publishedAt.getTime() - 14 * DAY),
      updated_at: new Date(now - int(1, 20) * DAY),
    })
    .execute();
  await db.insertInto("course_categories").values({ course_id: id, category_id: categoryId.get(c.category)! }).execute();
  for (const [pos, ins] of c.instructors.entries()) {
    await db.insertInto("course_staff").values({ course_id: id, user_id: instructors[ins]!, role: pos === 0 ? "OWNER" : "EDITOR", listed: true, position: pos }).execute();
  }
  if (c.idr) await db.insertInto("prices").values({ id: newId(), sellable_type: "COURSE", sellable_id: id, currency: "IDR", amount_minor: c.idr, compare_at_minor: c.compareIdr ?? null }).execute();
  if (c.usd) await db.insertInto("prices").values({ id: newId(), sellable_type: "COURSE", sellable_id: id, currency: "USD", amount_minor: c.usd, compare_at_minor: c.compareUsd ?? null }).execute();
  if (c.inr) await db.insertInto("prices").values({ id: newId(), sellable_type: "COURSE", sellable_id: id, currency: "INR", amount_minor: c.inr }).execute();

  const items: SeededItem[] = [];
  let total = 0;
  for (const [si, s] of c.sections.entries()) {
    const sectionId = newId();
    await db.insertInto("course_sections").values({ id: sectionId, course_id: id, title: s.title, position: si }).execute();
    for (const [ii, it] of s.items.entries()) {
      const itemId = newId();
      const durationSeconds = it.minutes * 60 + (it.kind === "VIDEO" ? int(0, 50) : 0);
      total += durationSeconds;
      const kind = it.kind === "QUIZ" ? "QUIZ" : it.kind === "ASSIGNMENT" ? "ASSIGNMENT" : "LECTURE";
      await db
        .insertInto("course_items")
        .values({ id: itemId, course_id: id, section_id: sectionId, kind, title: it.title, position: ii, is_preview: "preview" in it && !!it.preview, duration_seconds: durationSeconds })
        .execute();
      const seeded: SeededItem = { id: itemId, kind, demo: it, durationSeconds };
      if (it.kind === "VIDEO") {
        await db.insertInto("lectures").values({ item_id: itemId, lecture_kind: "VIDEO", video_provider: "YOUTUBE", video_ref: DEMO_YOUTUBE_VIDEO_ID, video_status: "READY", body: it.notes ?? null }).execute();
      } else if (it.kind === "ARTICLE") {
        await db.insertInto("lectures").values({ item_id: itemId, lecture_kind: "ARTICLE", body: it.body }).execute();
      } else if (it.kind === "PDF") {
        const pdf = await storeUpload(ownerId, "LECTURE_PDF", await pdfBuffer(it.heading, it.points), "application/pdf", `${c.slug}-cheat-sheet.pdf`);
        await db.insertInto("lectures").values({ item_id: itemId, lecture_kind: "PDF", pdf_upload_id: pdf, body: "Download it, print it, keep it next to your editor." }).execute();
      } else if (it.kind === "QUIZ") {
        await db.insertInto("quizzes").values({ item_id: itemId, instructions: "Answer every question, then submit. You can see the explanations after you submit.", pass_percent: it.pass, max_attempts: it.attempts ?? null, time_limit_seconds: it.timed ?? null, reveal: "AFTER_SUBMIT" }).execute();
        const bank: BankQuestion[] = [];
        for (const [qi, q] of it.questions.entries()) {
          const qid = newId();
          const bq = bankQuestion(q);
          await db
            .insertInto("questions")
            .values({ id: qid, course_id: id, kind: bq.kind, prompt: bq.prompt, explanation: bq.explanation, points: bq.points, options: JSON.stringify(bq.options), accepted_answers: bq.acceptedAnswers, match_mode: bq.matchMode, tags: [c.category], created_by: ownerId })
            .execute();
          await db.insertInto("quiz_questions").values({ quiz_item_id: itemId, question_id: qid, position: qi }).execute();
          bank.push({ id: qid, ...bq });
        }
        seeded.questions = bank;
      } else {
        const rubric = it.rubric.map(([title, description, maxPoints], i) => ({ id: `c${i + 1}`, title, description, maxPoints }));
        await db.insertInto("assignments").values({ item_id: itemId, instructions: it.instructions, rubric: JSON.stringify(rubric), pass_points: Math.ceil(rubric.reduce((a, r) => a + r.maxPoints, 0) * 0.6), due_days: it.dueDays ?? null, accept_text: true, accept_files: true, accept_url: true }).execute();
      }
      items.push(seeded);
    }
  }
  await db.updateTable("courses").set({ item_count: items.length, duration_seconds: total }).where("id", "=", id).execute();
  return { id, slug: c.slug, title: c.title, access: c.access, usd: c.usd ?? null, inr: c.inr ?? null, idr: c.idr ?? null, inPlan: c.inPlan ?? true, ownerId, items };
}

// ─── Progress ───────────────────────────────────────────────────────────────

/**
 * Walk the curriculum for one learner up to `target` (0..1). Lessons complete through
 * the progress service; quizzes get graded attempts; projects get submissions in the
 * state that matches where the learner stopped.
 */
async function simulateProgress(userId: string, course: SeededCourse, target: number, instructors: string[], now: number): Promise<void> {
  const upTo = Math.round(course.items.length * target);
  const started = now - int(10, 50) * DAY;
  for (const [i, item] of course.items.entries()) {
    const when = new Date(started + i * int(6, 30) * 3_600_000);
    if (i >= upTo) {
      // The lesson they stopped on: half watched, so "resume" lands mid-video.
      if (i === upTo && item.demo.kind === "VIDEO" && target > 0) {
        const pos = Math.round(item.durationSeconds * 0.45);
        await db.insertInto("item_progress").values({ user_id: userId, item_id: item.id, course_id: course.id, position_seconds: pos, furthest_seconds: pos, watched_seconds: pos, updated_at: when }).execute();
        await db.updateTable("enrollments").set({ last_item_id: item.id }).where("user_id", "=", userId).where("course_id", "=", course.id).execute();
      }
      if (i === upTo && item.kind === "ASSIGNMENT" && target > 0) await submit(userId, course, item, rand() < 0.5 ? "SUBMITTED" : "CHANGES_REQUESTED", instructors, when);
      if (i === upTo && item.kind === "QUIZ" && target > 0) await attempt(userId, course, item, false, when);
      break;
    }
    if (item.kind === "QUIZ") {
      if (rand() < 0.3) await attempt(userId, course, item, false, new Date(when.getTime() - 3_600_000));
      await attempt(userId, course, item, true, when);
    } else if (item.kind === "ASSIGNMENT") {
      await submit(userId, course, item, "APPROVED", instructors, when);
    }
    await withTransaction(async (trx, fx) => {
      if (item.kind === "LECTURE" && item.demo.kind === "VIDEO") {
        await trx
          .insertInto("item_progress")
          .values({ user_id: userId, item_id: item.id, course_id: course.id, position_seconds: item.durationSeconds, furthest_seconds: item.durationSeconds, watched_seconds: item.durationSeconds, updated_at: when })
          .onConflict((oc) => oc.columns(["user_id", "item_id"]).doNothing())
          .execute();
      }
      await markItemComplete({ userId, courseId: course.id, itemId: item.id }, trx, fx);
    });
    await db.updateTable("item_progress").set({ completed_at: when, updated_at: when }).where("user_id", "=", userId).where("item_id", "=", item.id).execute();
  }
}

async function attempt(userId: string, course: SeededCourse, item: SeededItem, pass: boolean, when: Date): Promise<void> {
  const quiz = item.demo as Extract<DemoItem, { kind: "QUIZ" }>;
  const snapshot = buildSnapshot(item.questions ?? [], { selection: "FIXED", drawCount: null, shuffleQuestions: false, shuffleOptions: true }, rand);
  const answers: Record<string, { optionIds: string[] } | { text: string }> = {};
  for (const q of snapshot) {
    const right = pass ? rand() < 0.92 : rand() < 0.35;
    if (q.kind === "SHORT_TEXT") answers[q.id] = { text: right ? (q.acceptedAnswers[0] ?? "") : "not sure" };
    else {
      const correct = q.options.filter((o) => o.correct).map((o) => o.id);
      const wrong = q.options.filter((o) => !o.correct).map((o) => o.id);
      answers[q.id] = { optionIds: right ? correct : [pick(wrong.length ? wrong : correct)] };
    }
  }
  let g = grade(snapshot, answers, quiz.pass);
  // Keep the story straight: a "pass" attempt passes, a "fail" attempt fails.
  if (pass && !g.passed) for (const q of snapshot) answers[q.id] = q.kind === "SHORT_TEXT" ? { text: q.acceptedAnswers[0] ?? "" } : { optionIds: q.options.filter((o) => o.correct).map((o) => o.id) };
  g = grade(snapshot, answers, quiz.pass);
  const prior = await db.selectFrom("quiz_attempts").select((eb) => eb.fn.max("number").as("n")).where("quiz_item_id", "=", item.id).where("user_id", "=", userId).executeTakeFirst();
  await db
    .insertInto("quiz_attempts")
    .values({
      id: newId(),
      quiz_item_id: item.id,
      course_id: course.id,
      user_id: userId,
      number: Number(prior?.n ?? 0) + 1,
      status: "SUBMITTED",
      snapshot: JSON.stringify(snapshot),
      answers: JSON.stringify(answers),
      score_points: g.scorePoints,
      max_points: g.maxPoints,
      percent: g.percent,
      passed: g.passed,
      started_at: new Date(when.getTime() - int(4, 12) * 60_000),
      submitted_at: when,
    })
    .execute();
}

const SUBMISSION_TEXT = [
  "Here is my solution. I kept the public surface small and wrote down the one trade-off I was unsure about in the README.",
  "Submitted the repository link below. The tests cover the two race conditions from the lesson.",
  "My report is attached. I chose recall as the main metric because missing a churning customer costs more than a false alarm.",
];

async function submit(userId: string, course: SeededCourse, item: SeededItem, status: "SUBMITTED" | "CHANGES_REQUESTED" | "APPROVED", instructors: string[], when: Date): Promise<void> {
  const a = item.demo as Extract<DemoItem, { kind: "ASSIGNMENT" }>;
  const rubric = a.rubric.map(([title, description, maxPoints], i) => ({ id: `c${i + 1}`, title, description, maxPoints }));
  const reviewer = course.ownerId ?? instructors[0]!;
  const versions = status === "APPROVED" && rand() < 0.4 ? ["CHANGES_REQUESTED", "APPROVED"] : [status];
  for (const [vi, st] of versions.entries()) {
    const at = new Date(when.getTime() - (versions.length - 1 - vi) * 2 * DAY);
    const reviewed = st !== "SUBMITTED";
    const raw = Object.fromEntries(rubric.map((c) => [c.id, st === "APPROVED" ? Math.round(c.maxPoints * (0.7 + rand() * 0.3)) : Math.round(c.maxPoints * (0.3 + rand() * 0.3))]));
    const { scores, total } = clampScores(rubric, raw);
    await db
      .insertInto("assignment_submissions")
      .values({
        id: newId(),
        item_id: item.id,
        course_id: course.id,
        user_id: userId,
        version: vi + 1,
        body: pick(SUBMISSION_TEXT),
        url: "https://git.example.org/learner/project",
        status: st as "SUBMITTED" | "CHANGES_REQUESTED" | "APPROVED",
        scores: reviewed ? JSON.stringify(scores) : null,
        total_points: reviewed ? total : null,
        feedback: reviewed ? (st === "APPROVED" ? "Well done. The structure is clear and the tests prove the important case. One idea for next time: name the error types after what the caller should do." : "Good start. The main case works, but the concurrent retry still double-applies: add a conditional update and a test that fires two requests at once, then resubmit.") : null,
        reviewed_by: reviewed ? reviewer : null,
        reviewed_at: reviewed ? new Date(at.getTime() + DAY) : null,
        submitted_at: at,
      })
      .execute();
  }
}

// ─── Reviews, Q&A, a report ─────────────────────────────────────────────────

async function communityActivity(learners: DemoUser[], catalog: SeededCatalog, instructors: string[], now: number): Promise<void> {
  const eligible = await db.selectFrom("enrollments").select(["user_id", "course_id", "progress_percent"]).where("progress_percent", ">=", 20).execute();
  const reviewIds: string[] = [];
  for (const e of eligible) {
    if (rand() > 0.75) continue;
    const [rating, body] = pick(REVIEW_LINES);
    const id = newId();
    const course = catalog.courses.find((c) => c.id === e.course_id)!;
    const created = new Date(now - int(1, 30) * DAY);
    const reply = rating <= 4 && rand() < 0.6 ? "Thank you for the honest feedback. We have noted it for the next update of the course." : null;
    await db
      .insertInto("reviews")
      .values({ id, course_id: e.course_id, user_id: e.user_id, rating, body, reply, replied_by: reply ? course.ownerId : null, replied_at: reply ? new Date(created.getTime() + 2 * DAY) : null, created_at: created, updated_at: created })
      .execute();
    await db.updateTable("courses").set((eb) => ({ rating_count: eb("rating_count", "+", 1), rating_sum: eb("rating_sum", "+", rating) })).where("id", "=", e.course_id).execute();
    reviewIds.push(id);
  }

  // Q&A on the courses with the most learners.
  const busy = await db.selectFrom("courses").select(["id"]).orderBy("enrollment_count", "desc").limit(4).execute();
  for (const [bi, b] of busy.entries()) {
    const course = catalog.courses.find((c) => c.id === b.id)!;
    const learnersIn = await db.selectFrom("enrollments").select("user_id").where("course_id", "=", b.id).execute();
    for (const t of sample(QA_THREADS, 2 + (bi % 2))) {
      const author = pick(learnersIn).user_id;
      const threadId = newId();
      const item = pick(course.items.filter((i) => i.kind === "LECTURE"));
      const at = new Date(now - int(2, 25) * DAY);
      await db.insertInto("qa_threads").values({ id: threadId, course_id: b.id, item_id: item.id, author_id: author, title: t.title, body: t.body, last_activity_at: at, created_at: at, updated_at: at }).execute();
      const replyId = newId();
      const replyAt = new Date(at.getTime() + int(2, 30) * 3_600_000);
      await db.insertInto("qa_replies").values({ id: replyId, thread_id: threadId, author_id: course.ownerId, body: t.answer, is_staff: true, created_at: replyAt, updated_at: replyAt }).execute();
      let count = 1;
      if (rand() < 0.5) {
        const peer = pick(learnersIn).user_id;
        if (peer !== author) {
          await db.insertInto("qa_replies").values({ id: newId(), thread_id: threadId, author_id: peer, body: "This helped me too, thank you.", created_at: new Date(replyAt.getTime() + DAY), updated_at: new Date(replyAt.getTime() + DAY) }).execute();
          count += 1;
        }
      }
      await db.updateTable("qa_threads").set({ reply_count: count, accepted_reply_id: rand() < 0.7 ? replyId : null, last_activity_at: replyAt }).where("id", "=", threadId).execute();
    }
  }

  // One open report in the moderation queue.
  const target = reviewIds[0];
  if (target) {
    const reporter = learners.find((l) => l.id !== target)!;
    const review = await db.selectFrom("reviews").select(["course_id", "user_id"]).where("id", "=", target).executeTakeFirstOrThrow();
    if (review.user_id !== reporter.id) {
      await db.insertInto("reports").values({ id: newId(), target_type: "REVIEW", target_id: target, course_id: review.course_id, reporter_id: reporter.id, reason: "OFF_TOPIC", note: "This review is about a different course." }).execute();
    }
  }
  void instructors;
}
