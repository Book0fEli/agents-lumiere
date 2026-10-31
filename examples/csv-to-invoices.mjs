// Send every row of a CSV export to the Lumière Agents invoice chaser.
// Node.js 18+, no packages.   LUMIERE_AGENTS_KEY=la_... node csv-to-invoices.mjs invoices.csv
// Columns (any order, header row required): invoice_number, company, name, email, amount, due_date (YYYY-MM-DD), pay_url
// (You can also just upload the CSV in the app: Invoices → Import. This is for doing it from a script or a schedule.)
import { readFileSync } from "node:fs";

const KEY = process.env.LUMIERE_AGENTS_KEY;
if (!KEY) throw new Error("Set LUMIERE_AGENTS_KEY to your API key.");
const file = process.argv[2];
if (!file) throw new Error("Usage: node csv-to-invoices.mjs invoices.csv");

// A small CSV reader: quoted fields, "" escapes, commas and new lines inside quotes.
function parseCsv(text) {
  const rows = []; let row = [], field = "", q = false;
  const s = text.replace(/^﻿/, "");
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (q) { if (ch === '"') { if (s[i + 1] === '"') { field += '"'; i++; } else q = false; } else field += ch; }
    else if (ch === '"') q = true;
    else if (ch === ",") { row.push(field); field = ""; }
    else if (ch === "\n" || ch === "\r") { if (ch === "\r" && s[i + 1] === "\n") i++; row.push(field); field = ""; if (row.some(v => v.trim())) rows.push(row); row = []; }
    else field += ch;
  }
  row.push(field); if (row.some(v => v.trim())) rows.push(row);
  const head = rows.shift().map(h => h.trim().toLowerCase().replace(/\s+/g, "_"));
  return rows.map(r => Object.fromEntries(head.map((h, i) => [h, (r[i] ?? "").trim()])));
}

let added = 0, skipped = 0;
for (const r of parseCsv(readFileSync(file, "utf8"))) {
  const res = await fetch("https://agents.lumierepaycheck.org/api/v1/invoices", {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ invoice_number: r.invoice_number, company: r.company, name: r.name, email: r.email, amount: r.amount, due_date: r.due_date, pay_url: r.pay_url || undefined }),
  });
  const data = await res.json().catch(() => ({}));
  if (res.ok) { added++; console.log(`added ${data.invoice_number}`); }
  else { skipped++; console.log(`skipped ${r.invoice_number || r.email}: ${data.error ?? res.status}`); }
  if (res.status === 429) await new Promise(ok => setTimeout(ok, 60_000));   // at most 120 requests a minute
  else await new Promise(ok => setTimeout(ok, 600));
}
console.log(`${added} added, ${skipped} skipped.`);
