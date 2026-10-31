# curl

Replace `la_your_key` with your API key. On Windows cmd, put each command on one line and use `^` instead of `\`, or use the Node.js or Python examples.

## Your business and agents

```bash
curl https://agents.lumierepaycheck.org/api/v1/me \
  -H "Authorization: Bearer la_your_key"
```

## Open invoices and quotes

```bash
curl "https://agents.lumierepaycheck.org/api/v1/invoices?limit=50" \
  -H "Authorization: Bearer la_your_key"

curl "https://agents.lumierepaycheck.org/api/v1/quotes?status=all" \
  -H "Authorization: Bearer la_your_key"
```

## Add an invoice

```bash
curl -X POST https://agents.lumierepaycheck.org/api/v1/invoices \
  -H "Authorization: Bearer la_your_key" \
  -H "Content-Type: application/json" \
  -d '{
    "company": "Maple Property Group",
    "name": "Dana Reyes",
    "email": "ap@mapleproperty.example",
    "invoice_number": "1042",
    "amount": "4850.00",
    "due_date": "2026-11-12",
    "pay_url": "https://pay.example.com/1042",
    "memo": "Kitchen remodel, phase 2"
  }'
```

## Mark it paid

```bash
curl -X POST https://agents.lumierepaycheck.org/api/v1/invoices/1042/paid \
  -H "Authorization: Bearer la_your_key"
```

## The activity log since a date

```bash
curl "https://agents.lumierepaycheck.org/api/v1/activity?since=2026-11-01" \
  -H "Authorization: Bearer la_your_key"
```
