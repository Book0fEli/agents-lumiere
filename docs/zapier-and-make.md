# Zapier and Make

Connect Lumière Agents to thousands of apps without writing code. Everything here is set up under **Settings → API, webhooks and HubSpot** (the account owner).

## When something happens in Lumière Agents, do something elsewhere

Examples: post to Slack when a customer promises to pay, add a row to a sheet for every missed call, create a task when something needs you.

**Zapier**

1. Create a Zap. For the trigger, choose **Webhooks by Zapier → Catch Hook**.
2. Copy the webhook address Zapier shows you.
3. In Lumière Agents, add it under **Webhooks**. Pick every event, or only the ones you want (for example `reply.received` and `item.needs_you`).
4. Click **Send a test** so Zapier sees an example, then build the rest of the Zap with the fields it found (`type`, `data.contact.email`, `data.item.ref` and so on).

**Make**

1. Create a scenario that starts with **Webhooks → Custom webhook**, and copy its address.
2. Add it under **Webhooks** in Lumière Agents and click **Send a test**.
3. Make reads the structure from the test. Add a filter on `type` to handle different events differently.

Zapier and Make don't need to check the signature. If you build your own receiver, see [Checking the signature](api.md#checking-the-signature).

**Popular recipes**

| When | Then |
|---|---|
| `invoice.payment_recorded` | Post "💵 Paid: {company}, invoice {ref}" in Slack or Teams |
| `reply.received` with intent `promise` | Add the promised date to Google Calendar |
| `item.needs_you` | Create a task in Asana, Trello or Todoist |
| `call.missed` | Add a row to a Google Sheet of missed callers |
| `quote.won` | Create the job in your scheduling tool |
| `draft.created` | Send yourself a text so you can approve it quickly |

## Add invoices to Lumière Agents from another app

Examples: an invoice created in a tool we don't connect to directly, or a row added to a form.

1. Create an API key under **API keys**, choosing **Read and add invoices**. Copy it now: it isn't shown again.
2. In Zapier, add an action **Webhooks by Zapier → POST** (in Make: **HTTP → Make a request**).
3. Set:
   - **URL:** `https://agents.lumierepaycheck.org/api/v1/invoices`
   - **Payload type / Body type:** JSON
   - **Headers:** `Authorization` = `Bearer la_your_key`
   - **Data:** `company`, `email`, `amount`, `due_date` (YYYY-MM-DD), and optionally `name`, `invoice_number`, `phone`, `pay_url`, `memo`
4. To stop reminders when it's paid elsewhere, add another POST to `https://agents.lumierepaycheck.org/api/v1/invoices/{invoice number}/paid` with the same header.

A new customer needs your one-time "this is a business" confirmation in the app before reminders start.

All fields and responses: [API reference](api.md).
