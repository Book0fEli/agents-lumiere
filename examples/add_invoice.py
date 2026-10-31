"""Add an invoice for the Lumiere Agents invoice chaser, then mark it paid.
Python 3, standard library only.   LUMIERE_AGENTS_KEY=la_... python add_invoice.py"""
import json, os, urllib.error, urllib.parse, urllib.request

BASE = "https://agents.lumierepaycheck.org"
KEY = os.environ.get("LUMIERE_AGENTS_KEY")
if not KEY:
    raise SystemExit("Set LUMIERE_AGENTS_KEY to your API key (Settings -> API, webhooks and HubSpot).")


def call(method, path, body=None):
    req = urllib.request.Request(BASE + path, method=method, data=json.dumps(body).encode() if body else None,
                                 headers={"Authorization": f"Bearer {KEY}", **({"Content-Type": "application/json"} if body else {})})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return json.loads(r.read() or b"{}")
    except urllib.error.HTTPError as e:
        raise SystemExit(f"{e.code}: {json.loads(e.read() or b'{}').get('error', e.reason)}")


me = call("GET", "/api/v1/me")
print(f"Connected to {me['business']}: {', '.join(a['kind'] for a in me['agents'])}")

added = call("POST", "/api/v1/invoices", {
    "company": "Maple Property Group",
    "name": "Dana Reyes",
    "email": "ap@mapleproperty.example",
    "invoice_number": "1042",
    "amount": "4850.00",
    "due_date": "2026-11-12",
    "pay_url": "https://pay.example.com/1042",
})
print(f"Added invoice {added['invoice_number']}.")
if added.get("needs_business_confirmation"):
    print("New customer: confirm once in the app that they're a business, and reminders start after the due date.")

# Later, when it's paid in your own system:
paid = call("POST", f"/api/v1/invoices/{urllib.parse.quote(added['invoice_number'], safe='')}/paid")
print("Marked paid: reminders stopped." if paid.get("changed") else "It was already closed.")
