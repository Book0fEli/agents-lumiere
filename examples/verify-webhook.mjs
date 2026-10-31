// A Lumière Agents webhook receiver that checks the signature. Node.js 18+, no packages.
//   LUMIERE_WEBHOOK_SECRET=whsec_... node verify-webhook.mjs      (listens on port 3000, path /lumiere)
// Put it behind https (a reverse proxy, a tunnel, or your host's TLS): webhook addresses must be https.
import { createServer } from "node:http";
import { createHmac, timingSafeEqual } from "node:crypto";

const SECRET = process.env.LUMIERE_WEBHOOK_SECRET;
if (!SECRET) throw new Error("Set LUMIERE_WEBHOOK_SECRET to the signing secret shown when you added the webhook.");
const TOLERANCE_SECONDS = 300;
const seen = new Set();   // event ids already handled (use your database in production)

/** true when the Lumiere-Signature header matches this exact raw body and is recent. */
export function verify(rawBody, header, secret = SECRET, now = Math.floor(Date.now() / 1000)) {
  const parts = Object.fromEntries(String(header ?? "").split(",").map(p => p.trim().split("=", 2)));
  const t = Number(parts.t), sig = parts.v1 ?? "";
  if (!Number.isInteger(t) || !/^[0-9a-f]{64}$/.test(sig)) return false;
  if (Math.abs(now - t) > TOLERANCE_SECONDS) return false;
  const expected = createHmac("sha256", secret).update(`${t}.${rawBody}`).digest("hex");
  return timingSafeEqual(Buffer.from(expected), Buffer.from(sig));
}

createServer((req, res) => {
  if (req.method !== "POST" || req.url !== "/lumiere") { res.writeHead(404).end(); return; }
  const chunks = [];
  req.on("data", c => chunks.push(c));
  req.on("end", () => {
    const raw = Buffer.concat(chunks).toString("utf8");   // check the raw body, before parsing it
    if (!verify(raw, req.headers["lumiere-signature"])) { res.writeHead(401).end("bad signature"); return; }
    const event = JSON.parse(raw);
    res.writeHead(200).end("ok");                          // answer quickly; do slow work afterwards
    if (seen.has(event.id)) return;                        // retries can deliver an event twice
    seen.add(event.id);
    switch (event.type) {
      case "invoice.payment_recorded": console.log("Payment:", event.data.item?.ref, event.data.contact?.company); break;
      case "reply.received": console.log("Reply from", event.data.contact?.email, "meaning:", event.data.intent ?? event.data.message?.intent); break;
      case "item.needs_you": console.log("Needs you:", event.data.contact?.company ?? event.data.contact?.email); break;
      case "call.missed": console.log("Missed call from", event.data.contact?.phone); break;
      default: console.log(event.type, event.id);
    }
  });
}).listen(3000, () => console.log("Listening on http://localhost:3000/lumiere"));
