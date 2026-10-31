// Add an invoice for the Lumière Agents invoice chaser, then mark it paid.
// Node.js 18+ (built-in fetch), no packages.   LUMIERE_AGENTS_KEY=la_... node add-invoice.mjs
const BASE = "https://agents.lumierepaycheck.org";
const KEY = process.env.LUMIERE_AGENTS_KEY;
if (!KEY) throw new Error("Set LUMIERE_AGENTS_KEY to your API key (Settings → API, webhooks and HubSpot).");

async function call(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: { Authorization: `Bearer ${KEY}`, ...(body ? { "Content-Type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${res.status}: ${data.error ?? res.statusText}`);
  return data;
}

const me = await call("GET", "/api/v1/me");
console.log(`Connected to ${me.business}: ${me.agents.map(a => a.kind).join(", ")}`);

const added = await call("POST", "/api/v1/invoices", {
  company: "Maple Property Group",
  name: "Dana Reyes",
  email: "ap@mapleproperty.example",
  invoice_number: "1042",
  amount: "4850.00",
  due_date: "2026-11-12",
  pay_url: "https://pay.example.com/1042",
});
console.log(`Added invoice ${added.invoice_number}.`);
if (added.needs_business_confirmation) console.log("New customer: confirm once in the app that they're a business, and reminders start after the due date.");

// Later, when it's paid in your own system:
const paid = await call("POST", `/api/v1/invoices/${encodeURIComponent(added.invoice_number)}/paid`);
console.log(paid.changed ? "Marked paid: reminders stopped." : "It was already closed.");
