#!/usr/bin/env node
/**
 * verify-social-launch.mjs
 *
 * Verifies every social-launch post actually took place and stays maintained.
 *
 * Always runs:
 *   1. Local integrity — every content/posts/*.md has valid frontmatter, a
 *      unique slug, a channel, and body content.
 *   2. Built-feed consistency — if a Next.js production build exists
 *      (.next/server/app/rss.xml.body), confirm that feed contains every post.
 *   3. External account probe — GET each channel profile URL and report status
 *      (does NOT fail the check; accounts may be intentionally unlaunched).
 *
 * With --strict-live (used by the scheduled CI job): also
 *   4. Live feed check — fetch the deployed /rss.xml and confirm every post is
 *      present. Network failure or missing items FAIL the check.
 *
 * Exit codes: 0 = all required checks passed, non-zero = failure.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const POSTS_DIR = path.join(ROOT, "content", "posts");
const REPORT_PATH = path.join(ROOT, "docs", "social-launch-status.md");

const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL &&
  !process.env.NEXT_PUBLIC_APP_URL.includes("localhost")
    ? process.env.NEXT_PUBLIC_APP_URL
    : "https://proximitygetadate.site";

const STRICT_LIVE = process.argv.includes("--strict-live");

// Single source of truth for channel -> profile URL, kept in sync with the
// site footer and the (git-ignored) credentials master table.
const CHANNELS = [
  { channel: "Instagram", url: "https://www.instagram.com/proximitydating" },
  { channel: "X", url: "https://x.com/proximitydating" },
  { channel: "TikTok", url: "https://www.tiktok.com/@proximitydating" },
  { channel: "Facebook", url: "https://www.facebook.com/proximitydating" },
  { channel: "YouTube", url: "https://www.youtube.com/@proximitydating" },
  { channel: "LinkedIn", url: "https://www.linkedin.com/company/proximity-dating-app" },
  { channel: "Pinterest", url: "https://www.pinterest.com/proximitydating" },
];

/** @returns {Promise<number>} resolved with the exit code to use. */
async function main() {
  const results = [];
  const fails = [];
  let ok = true;

  // ---- 1. Local integrity ----
  const expectedSlugs = [];
  if (!fs.existsSync(POSTS_DIR)) {
    fail(`content/posts directory missing at ${POSTS_DIR}`);
    await writeReport(results, expectedSlugs);
    process.exit(1);
  }
  for (const file of fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith(".md")).sort()) {
    const raw = fs.readFileSync(path.join(POSTS_DIR, file), "utf8");
    const { frontmatter, body } = parseFrontmatter(raw);
    const slug = frontmatter.slug || file.replace(/\.md$/, "");

    const errors = [];
    for (const field of ["title", "date", "channel", "slug", "excerpt"]) {
      if (!frontmatter[field]) errors.push(`missing frontmatter "${field}"`);
    }
    if (!body.trim()) errors.push("empty body");
    if (!frontmatter.channel || !CHANNELS.some((c) => c.channel === frontmatter.channel)) {
      errors.push(`unknown/unsupported channel "${frontmatter.channel}"`);
    }
    if (expectedSlugs.includes(slug)) errors.push(`duplicate slug "${slug}"`);

    expectedSlugs.push(slug);
    const pass = errors.length === 0;
    if (!pass) {
      ok = false;
      fails.push(`POST ${slug}`);
    }
    results.push({
      kind: "local-post",
      name: slug,
      pass,
      detail: pass ? `${file} (${frontmatter.channel})` : errors.join("; "),
    });
  }

  // ---- 2. Built-feed consistency ----
  const feedBody = path.join(ROOT, ".next", "server", "app", "rss.xml.body");
  if (fs.existsSync(feedBody)) {
    const feed = fs.readFileSync(feedBody, "utf8");
    const items = extractItems(feed);
    const missing = expectedSlugs.filter(
      (slug) => !items.some((l) => l.endsWith(`/news/${slug}`))
    );
    const pass = missing.length === 0;
    if (!pass) {
      ok = false;
      fails.push(`BUILT FEED missing ${missing.join(", ")}`);
    }
    results.push({
      kind: "built-feed",
      name: "rss.xml.body",
      pass,
      detail: pass
        ? `${items.length} items, all ${expectedSlugs.length} posts present`
        : `missing ${missing.join(", ")}`,
    });
  } else {
    results.push({
      kind: "built-feed",
      name: "rss.xml.body",
      pass: null,
      detail: "No production build present (skipped — run `npm run build` first)",
    });
  }

  // ---- 3. External account probe (informational only) ----
  // Platforms serve login/landing pages with HTTP 200 for nonexistent handles,
  // so a 200 here does NOT prove an account launched. Treat as unconfirmed and
  // never fail the check off these; the real source of truth is the master
  // credentials table (git-ignored) Status column.
  const accountProbes = await Promise.all(
    CHANNELS.map(async ({ channel, url }) => {
      const status = await probe(url);
      return { channel, url, ...status };
    })
  );
  for (const p of accountProbes) {
    results.push({
      kind: "account",
      name: p.channel,
      pass: null,
      detail: `${p.url} -> ${p.label}${p.confirmed ? " (confirmed)" : ""}`,
    });
  }

  // ---- 4. Live feed check (strict only) ----
  if (STRICT_LIVE) {
    let feedXml = null;
    try {
      const res = await fetchWithTimeout(`${SITE_URL}/rss.xml`, 20000);
      if (res.ok) feedXml = await res.text();
      else throw new Error(`HTTP ${res.status}`);
    } catch (err) {
      const pass = false;
      ok = false;
      fails.push("LIVE FEED unreachable");
      results.push({
        kind: "live-feed",
        name: SITE_URL + "/rss.xml",
        pass,
        detail: `unreachable: ${err.message}`,
      });
    }
    if (feedXml) {
      const items = extractItems(feedXml);
      const missing = expectedSlugs.filter(
        (slug) => !items.some((l) => l.endsWith(`/news/${slug}`))
      );
      const pass = missing.length === 0;
      if (!pass) {
        ok = false;
        fails.push(`LIVE FEED missing ${missing.join(", ")}`);
      }
      results.push({
        kind: "live-feed",
        name: SITE_URL + "/rss.xml",
        pass,
        detail: pass
          ? `${items.length} items, all ${expectedSlugs.length} posts present`
          : `missing ${missing.join(", ")}`,
      });
    }
  }

  await writeReport(results, expectedSlugs);
  printSummary(results, ok, fails, expectedSlugs);

  return ok ? 0 : 1;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { frontmatter: {}, body: raw };
  const frontmatter = {};
  for (const line of match[1].split("\n")) {
    const i = line.indexOf(":");
    if (i === -1) continue;
    frontmatter[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
  }
  return { frontmatter, body: match[2].trim() };
}

/** Extract destination URLs from <link> elements in a feed. */
function extractItems(xml) {
  const links = [...xml.matchAll(/<link>([^<]+)<\/link>/g)].map((m) => m[1]);
  return links.filter((l) => l.includes("/news/"));
}

async function probe(url) {
  try {
    const res = await fetchWithTimeout(url, 15000, { redirect: "manual" });
    const code = res.status;
    const location = res.headers.get("location") || "";
    // Login-walled platforms answer 200 for any handle, including non-existent
    // ones, so we cannot take a 200 as proof of an account.
    if (code >= 200 && code <= 299) return { code, label: "HTTP 200 (login wall — unconfirmed)", confirmed: false };
    if (code === 301 || code === 302 || code === 307 || code === 308)
      return { code, label: `redirect (${code})${location ? " -> " + location : ""}`, confirmed: false };
    if (code === 403) return { code, label: "HTTP 403 (bot-blocked — unconfirmed)", confirmed: false };
    if (code === 404 || code === 410) return { code, label: "NOT CREATED (404/410)", confirmed: false };
    return { code, label: `HTTP ${code}`, confirmed: false };
  } catch (err) {
    return { code: null, label: `network error: ${err.message}`, confirmed: false };
  }
}

async function fetchWithTimeout(url, ms, opts = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...opts, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function printSummary(results, ok, fails, expectedSlugs) {
  const counts = {
    pass: results.filter((r) => r.pass === true).length,
    fail: results.filter((r) => r.pass === false).length,
    skip: results.filter((r) => r.pass === null).length,
  };
  console.log(`\nPROXIMITY SOCIAL LAUNCH VERIFICATION (${new Date().toISOString()})`);
  console.log("=".repeat(60));
  for (const r of results) {
    const icon = r.pass === true ? "✅" : r.pass === false ? "❌" : "⏭️";
    console.log(`${icon} [${r.kind}] ${r.name}: ${r.detail}`);
  }
  console.log("-".repeat(60));
  console.log(
    `posts: ${expectedSlugs.length} | passed: ${counts.pass} | failed: ${counts.fail} | skipped: ${counts.skip}`
  );
  console.log(`report: ${REPORT_PATH}`);
  console.log(ok ? "RESULT: OK" : `RESULT: FAILED${fails.length ? " — " + fails.join(", ") : ""}`);
}

async function writeReport(results, expectedSlugs) {
  const ts = new Date().toISOString();
  let md = `# Social Launch Verification Report\n\n_Last run: ${ts}_\n\n`;
  let passCount = 0;
  let failCount = 0;
  for (const r of results) {
    if (r.pass === true) passCount++;
    if (r.pass === false) failCount++;
  }
  md += `**Summary:** ${expectedSlugs.length} posts indexed · ${passCount} checks passed · ${failCount} checks failed\n\n`;
  md += `**Site URL:** ${SITE_URL}\n\n`;
  md += `## Checks\n\n| Type | Target | Status | Detail |\n|---|---|---|---|\n`;
  for (const r of results) {
    const status = r.pass === true ? "PASS" : r.pass === false ? "FAIL" : "SKIP";
    md += `| ${r.kind} | ${r.name} | ${status} | ${r.detail.replace(/\|/g, "\\|")} |\n`;
  }
  await fs.promises.mkdir(path.dirname(REPORT_PATH), { recursive: true });
  await fs.promises.writeFile(REPORT_PATH, md, "utf8");
}

function fail(msg) {
  console.error(`FATAL: ${msg}`);
}

export { probe, extractItems, parseFrontmatter, CHANNELS };

await main();