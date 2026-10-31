# Lumière Agents API and webhooks

Connect Lumière Agents to your own tools: add invoices from any app, read what's open, and get a signed webhook the moment something happens (a payment, a reply, a missed call, a won quote).

- **Base URL:** `https://agents.lumierepaycheck.org`
- **Where to set it up:** Settings → API, webhooks and HubSpot (the account owner only)
- **No code?** Use [Zapier or Make](zapier-and-make.md).

## Contents

- [Authentication](#authentication)
- [Limits and errors](#limits-and-errors)
- [Endpoints](#endpoints)
  - [GET /api/v1/me](#get-apiv1me)
  - [GET /api/v1/invoices and /api/v1/quotes](#get-apiv1invoices-and-apiv1quotes)
  - [POST /api/v1/invoices](#post-apiv1invoices)
  - [POST /api/v1/invoices/{number}/paid](#post-apiv1invoicesnumberpaid)
  - [GET /api/v1/activity](#get-apiv1activity)
- [Webhooks](#webhooks)
  - [Events](#events)
  - [Payload](#payload)
  - [Checking the signature](#checking-the-signature)
  - [Retries](#retries)
- [HubSpot](#hubspot)

---

## Authentication

Create a key under **Settings → API, webhooks and HubSpot**. It's shown once, so copy it then. Keys start with `la_`.

Send it on every request:

```
Authorization: Bearer la_your_key
```

There are two kinds of key:

| Key | Can use |
|---|---|
| **Read and add invoices** | Every endpoint |
| **Read only** | The `GET` endpoints |

Revoke a key from the same page at any time; anything using it stops working immediately. Keys are stored encrypted. Never put a key in front-end code or a public repository.

## Limits and errors

At most **120 requests a minute per key.** Errors come back as JSON with a plain-English `error`:

| Status | Meaning |
|---|---|
| `400` | Something in the request needs fixing (the `error` says what) |
| `401` | Missing or unknown key: `{"error": "Send a valid API key as Authorization: Bearer la_…"}` |
| `403` | A read-only key tried to add or change something |
| `404` | Not found (for example, no invoice with that number) |
| `429` | Over 120 requests a minute: wait and try again |

## Endpoints

### GET /api/v1/me

Your business and its agents.

```json
{
  "business": "Maple & Sons Plumbing",
  "location": null,
  "timezone": "America/New_York",
  "status": "active",
  "agents": [
    { "kind": "invoice", "mode": "approve_first", "paused": false },
    { "kind": "missed_call", "mode": "auto", "paused": false }
  ]
}
```

`kind` is one of `invoice`, `quote`, `missed_call`, `paperwork`, `receipt`, `review`. `mode` is `approve_first` (every email waits for your OK) or `auto`.

### GET /api/v1/invoices and /api/v1/quotes

What's open: items still being followed up, promised, waiting or handed to you.

| Query | |
|---|---|
| `status=all` | Include closed items too (paid, won, lost, stopped) |
| `limit` | 1 to 500 (default 100), newest first |

```json
{
  "data": [
    {
      "id": "5b0c…",
      "kind": "invoice",
      "ref": "1042",
      "status": "promised",
      "amount_cents": 485000,
      "balance_cents": 485000,
      "due_date": "2026-11-12",
      "source": "quickbooks",
      "customer": { "company": "Maple Property Group", "name": "Dana Reyes", "email": "ap@mapleproperty.example" },
      "updated_at": "2026-11-14T15:47:02.118Z"
    }
  ]
}
```

Amounts are in cents. `status` is `open`, `promised` (the customer said when they'll pay), `waiting`, `handoff` (it needs you), or, with `status=all`, a closed status.

### POST /api/v1/invoices

Add an invoice for the invoice chaser. Needs a **Read and add invoices** key.

| Field | | |
|---|---|---|
| `company` | required | The customer's business name (or send `name`) |
| `email` | required | Where reminders go |
| `amount` | required | What's owed: `1250`, `"1,250.00"` |
| `due_date` | required | `YYYY-MM-DD` |
| `invoice_number` | optional | Your number. Without one, they're numbered A-101, A-102… |
| `name` | optional | The contact's name, used in "Hi Dana," |
| `phone` | optional | A US mobile number, for text reminders |
| `pay_url` | optional | An `https://` link where they can pay |
| `memo` | optional | What it's for, shown in the reminder |

```bash
curl -X POST https://agents.lumierepaycheck.org/api/v1/invoices \
  -H "Authorization: Bearer la_your_key" \
  -H "Content-Type: application/json" \
  -d '{"company":"Maple Property Group","name":"Dana Reyes","email":"ap@mapleproperty.example","invoice_number":"1042","amount":"4850.00","due_date":"2026-11-12","pay_url":"https://pay.example.com/1042"}'
```

```json
{ "ok": true, "invoice_number": "1042", "needs_business_confirmation": true }
```

The invoice chaser is for **business customers only.** When a customer is new, `needs_business_confirmation` is `true`: confirm once in the app that they're a business, and reminders start after the due date. Sending the same invoice number twice returns `400`.

### POST /api/v1/invoices/{number}/paid

Mark an invoice paid and stop its reminders. Use your invoice number in the path (URL-encode it if it has spaces or slashes).

```bash
curl -X POST https://agents.lumierepaycheck.org/api/v1/invoices/1042/paid \
  -H "Authorization: Bearer la_your_key"
```

```json
{ "ok": true, "changed": true }
```

`changed` is `false` when it was already closed. Unknown numbers return `404`.

### GET /api/v1/activity

The activity log: what the agents did and who approved what.

| Query | |
|---|---|
| `since` | An ISO date or time (default: the last 7 days). Up to 500 entries, newest first. |

```json
{
  "data": [
    { "at": "2026-11-14T15:47:02.118Z", "action": "reply_handled", "target": "9f2e…", "detail": { "intent": "promise", "agent": "invoice" } }
  ]
}
```

## Webhooks

Add a webhook address under **Settings → API, webhooks and HubSpot**, for every event or only the ones you pick. You get a **signing secret** (shown once) for checking that requests really come from us. **Send a test** posts a `ping` event so you can see one arrive.

Addresses must be `https://` and public (private networks are refused, and checked again at every delivery).

### Events

| Event | When |
|---|---|
| `invoice.payment_recorded` | A payment came in (sync, upload, the pay page or Mark paid) |
| `invoice.plan_created` | A payment plan was set up |
| `message.sent` | An email went out |
| `text.sent` | A text went out |
| `reply.received` | A customer replied, with what they meant (paid, promise, dispute…) |
| `item.needs_you` | Something stopped and needs your decision |
| `draft.created` | An email is waiting for your approval |
| `quote.won` | A quote was marked won |
| `quote.lost` | A quote was marked lost |
| `call.missed` | The missed-call text-back caught a missed call |
| `receipt.received` | A receipt arrived for a card charge |
| `ping` | Your test from the settings page |

### Payload

Each event is a JSON `POST`:

```json
{
  "id": "evt_8127",
  "type": "reply.received",
  "created_at": "2026-11-14T15:47:02.118Z",
  "data": {
    "intent": "promise",
    "agent": "invoice",
    "message": { "id": "9f2e…", "channel": "email", "direction": "in", "subject": "Re: Invoice 1042", "status": "received", "intent": "promise", "agent": "invoice" },
    "contact": { "email": "ap@mapleproperty.example", "phone": null, "company": "Maple Property Group", "name": "Dana Reyes" },
    "item_ids": ["5b0c…"]
  }
}
```

`data` holds the event's details plus a short summary of what it's about: a `message` and its `contact` (emails, texts, replies), or an `item` (`id`, `kind`, `status`, `ref`, `amount_cents`, `balance_cents`, `due_date`, `source`) and its `contact`. Use `id` to ignore an event you've already handled.

Headers:

```
Content-Type: application/json
User-Agent: LumiereAgents-Webhooks/1
Lumiere-Event: reply.received
Lumiere-Signature: t=1794761222,v1=5f2c…
```

### Checking the signature

`Lumiere-Signature` is `t=TIMESTAMP,v1=SIGNATURE`:

- `TIMESTAMP` is Unix time in seconds.
- `SIGNATURE` is the HMAC-SHA256 of `TIMESTAMP.BODY` (the timestamp, a dot, then the raw request body exactly as received) with your webhook's signing secret, as lowercase hex.

Check the signature with a constant-time comparison, and reject timestamps more than 5 minutes old. Ready-made receivers: [Node.js](../examples/verify-webhook.mjs) and [Python](../examples/verify_webhook.py). Zapier and Make can skip this.

### Retries

Answer with any `2xx` status within 10 seconds. Otherwise we try again for about two days (after 1 minute, 5, 15, an hour, then longer). After 50 failures in a row the webhook is switched off and the account owner is emailed. Redirects aren't followed.

## HubSpot

Click **Connect HubSpot** on the same page. Every email and text the agents send, and every reply, is logged as a note on the HubSpot contact with the same email address. People who aren't in HubSpot are skipped: we never create contacts or change anything else.
