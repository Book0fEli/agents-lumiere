"""A Lumiere Agents webhook receiver that checks the signature. Python 3, standard library only.
   LUMIERE_WEBHOOK_SECRET=whsec_... python verify_webhook.py      (listens on port 3000, path /lumiere)
Put it behind https (a reverse proxy, a tunnel, or your host's TLS): webhook addresses must be https."""
import hashlib, hmac, json, os, time
from http.server import BaseHTTPRequestHandler, HTTPServer

SECRET = os.environ.get("LUMIERE_WEBHOOK_SECRET", "")
TOLERANCE_SECONDS = 300
seen = set()  # event ids already handled (use your database in production)


def verify(raw_body: bytes, header: str, secret: str = SECRET, now: int | None = None) -> bool:
    """True when the Lumiere-Signature header matches this exact raw body and is recent."""
    parts = dict(p.strip().split("=", 1) for p in (header or "").split(",") if "=" in p)
    try:
        t = int(parts.get("t", ""))
    except ValueError:
        return False
    sig = parts.get("v1", "")
    if abs((now or int(time.time())) - t) > TOLERANCE_SECONDS:
        return False
    expected = hmac.new(secret.encode(), f"{t}.".encode() + raw_body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, sig)


class Handler(BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path != "/lumiere":
            self.send_response(404); self.end_headers(); return
        raw = self.rfile.read(int(self.headers.get("Content-Length", 0)))  # check the raw body, before parsing it
        if not verify(raw, self.headers.get("Lumiere-Signature", "")):
            self.send_response(401); self.end_headers(); self.wfile.write(b"bad signature"); return
        event = json.loads(raw)
        self.send_response(200); self.end_headers(); self.wfile.write(b"ok")  # answer quickly
        if event["id"] in seen:  # retries can deliver an event twice
            return
        seen.add(event["id"])
        data = event.get("data", {})
        if event["type"] == "invoice.payment_recorded":
            print("Payment:", (data.get("item") or {}).get("ref"), (data.get("contact") or {}).get("company"))
        elif event["type"] == "reply.received":
            print("Reply from", (data.get("contact") or {}).get("email"), "meaning:", data.get("intent"))
        else:
            print(event["type"], event["id"])


if __name__ == "__main__":
    if not SECRET:
        raise SystemExit("Set LUMIERE_WEBHOOK_SECRET to the signing secret shown when you added the webhook.")
    print("Listening on http://localhost:3000/lumiere")
    HTTPServer(("", 3000), Handler).serve_forever()
