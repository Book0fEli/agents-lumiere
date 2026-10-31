# Security at Lumière Agents

Lumière Agents emails and texts your customers in your name, so it holds your invoices, quotes and contacts. This page describes how that data is protected today, including what we don't have yet.

Operated by Lumière LLC (Connecticut, USA). Contact: hello@lumierepaycheck.org. Full page: https://agents.lumierepaycheck.org/security

## Reporting a vulnerability

Please report security issues privately:

- **GitHub:** [open a private security advisory](https://github.com/Book0fEli/agents-lumiere/security/advisories/new)
- **Email:** hello@lumierepaycheck.org

We reply within two business days and won't take action against good-faith research. Please don't access other people's data, send email or texts to people who haven't agreed to it, or degrade the service while testing. Our [security.txt](https://agents.lumierepaycheck.org/.well-known/security.txt) has the same contact.

## Your data is kept apart

- Every customer's data sits behind database **row-level security that is forced on**: a query that forgets which business it's for returns nothing instead of another business's data.
- In a multi-location company, each location is its own account with the same separation. Head office sees locations only through the logins it has been given.

## Encryption

- All traffic uses HTTPS, with HSTS on.
- The database and backups are encrypted at rest by our hosting provider.
- Connection tokens (QuickBooks, Microsoft, Google, HubSpot, Twilio and the rest), API keys, webhook secrets, SMTP passwords and uploaded documents (certificates, receipts) are **additionally encrypted with a per-business key**, itself wrapped by a master key kept outside the database.
- Card numbers are never stored: Stripe handles payments. Tax IDs given for texting registration are encrypted the same way.

## Signing in

- **No passwords to leak.** People sign in with a one-time link or 6-digit code sent to their email, valid for 15 minutes. Codes lock after 5 wrong tries.
- **Single sign-on** for Enterprise companies (Google Workspace, Microsoft Entra ID, Okta and other OpenID Connect providers), with email sign-in switched off for their domain if they choose.
- Sessions are HttpOnly cookies protected against cross-site requests. Each person can choose to be signed out after a period of inactivity, and can sign out their other devices.
- **Roles per location:** owners, approvers (send and edit emails) and viewers (read only).

## You stay in control of what's sent

- Every agent starts in **approve-each-email** mode. Automatic sending is a switch the owner turns on, one agent at a time.
- **Read-only connections:** we read invoices, quotes and contacts from QuickBooks, Jobber, Housecall Pro, FreshBooks, Zoho Books, Wave and Square, and never write to them. Gmail and Outlook connections can only send, never read your mail.
- Daily sending limits per location, per-customer weekly limits, business-hours-only sending, and a one-click unsubscribe and STOP in every email. STOP works for texts too.

## API and webhooks

- API keys are random, shown once, stored encrypted, and can be read-only. Each key is limited to 120 requests a minute and can be revoked instantly.
- Webhooks are signed (HMAC-SHA256 with a per-webhook secret) and only go to public `https://` addresses. Private and internal networks are refused, and the address is checked again at every delivery. See [docs/api.md](docs/api.md#checking-the-signature).

## Bots and abuse

- Sign-in, sign-up and enquiry forms are rate-limited per address.
- The sign-up form has a hidden field for bots and a signed check on how quickly it was filled in. Sign-ups that look automated never receive follow-up emails, so nobody can use our form to have us email a stranger.

## Audit and exports

- An **append-only activity log** records who approved, edited or sent what, and when (without email bodies).
- Owners can download the activity log as CSV and all of their data as a file at any time. At the end of a contract, the account and everything in it are deleted.

## Who processes data for us

| Provider | What for |
|---|---|
| Render | Hosting and database (US) |
| Resend | Sending and receiving email |
| Stripe | Payments |
| Anthropic and OpenAI | AI reading and writing, only when AI is on. Not used to train their models under their API terms. Only the text needed for each task is sent. |
| Twilio | Texting: an account we manage for your business, or your own |
| Intuit, Microsoft, Google and the other tools you connect | Only when you connect them |

## What we don't have yet

- We don't currently hold a SOC 2 report.
- Have a security questionnaire? Send it to hello@lumierepaycheck.org and we'll answer it.

Live status, uptime and support response times: https://agents.lumierepaycheck.org/status
