# Examples

Copy-paste examples for the [Lumière Agents API and webhooks](../docs/api.md). MIT licensed: use them however you like.

| File | What it does |
|---|---|
| [curl.md](curl.md) | Every API call as a curl command |
| [add-invoice.mjs](add-invoice.mjs) | Node.js 18+: add an invoice, then mark it paid (no packages needed) |
| [add_invoice.py](add_invoice.py) | Python 3: the same, standard library only |
| [csv-to-invoices.mjs](csv-to-invoices.mjs) | Node.js: send every row of a CSV export to the invoice chaser |
| [verify-webhook.mjs](verify-webhook.mjs) | Node.js: a webhook receiver that checks the signature (no packages needed) |
| [verify_webhook.py](verify_webhook.py) | Python: the same, standard library only |

Set your key first (Settings → API, webhooks and HubSpot):

```bash
export LUMIERE_AGENTS_KEY=la_your_key            # macOS / Linux
set LUMIERE_AGENTS_KEY=la_your_key               # Windows cmd
```

For the webhook receivers, also set the signing secret you got when you added the webhook:

```bash
export LUMIERE_WEBHOOK_SECRET=whsec_your_secret
```

Never commit keys or secrets to a repository.
