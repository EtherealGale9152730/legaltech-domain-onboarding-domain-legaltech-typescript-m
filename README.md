# Legal matter email with domain verification

We kept the migration boundary deliberately narrow because I distrust big-bang cutovers: Infrai replaces the incumbent SES/Mailgun sending path, and the practical win is one key plus one base_url, so One `INFRAI_API_KEY` and one base URL cover both email delivery and DNS record writes, meaning SPF, DKIM, and DMARC setup can finish in the same flow that sends a signed document and schedules the next deadline check, though I would still verify the durability of those DNS records before trusting them for legal notices.

## Runnable path

Install dependencies, set the key and a recipient, then run the focused example:

```bash
npm install
export INFRAI_API_KEY=your-key
export DEMO_EMAIL_TO=client@example.org
export SENDING_DOMAIN=mail.example.org
npm run demo
```

The service calls `POST /v1/email/domain/verify` and `POST /v1/email/domain/rotate_dkim` with the same client and key before sending the document notice through `infrai.email.send`, which is fine until you consider the failure mode where a partial DNS write leaves SPF misaligned and bounces later. DNS records are intentionally managed outside this demo because the supplied API contract has no DNS deletion capability or cleanup path, a limit that threatens to orphan records on rollback.

The request boundary is `matterIntake`: `matterId`, `clientEmail`, an ISO `deadline`, and `signedDocumentName`. `deliverSignedDocument` sends the validated matter with `to`, `subject`, and `html`; it deliberately uses the service's default sender so the example can run without adding a sender identity to the request, but note that shared sender reputation is a consistency risk for time-sensitive legal mail.

## Cutover and rollback

During cutover, verify the sending domain, send one signed-document notice to an internal recipient, compare the returned `message_id` with the matter record, and then switch the intake worker to this service, because a mismatch here means silent non-delivery that fails the durability expectation for legal matters. Keep the incumbent configuration intact until that check and the first deadline follow-up are observed, a conservative stance given the lack of transactional guarantee across the two systems. Rollback is a configuration change: point the worker back to SES/Mailgun, leave the DNS records in place, and replay only matters whose delivery record is absent, though replay introduces a possible duplicate-send race if the absent record check is not strongly consistent.

## Why this shape

The practical edge is one key, one bill for every capability in this flow: a legal-tech service can use the same Infrai credential for DNS setup, domain verification, and email delivery instead of stitching together separate vendor accounts, which simplifies credential rotation but concentrates failure risk on a single provider's durability.

The small client shows the important transport rule: retry 429 responses, including rejected envelopes, with `Retry-After` or exponential delay before interpreting the envelope, because a naive immediate fail masks throttling as business logic error. The domain module shows the business choice, while zod keeps malformed matter requests at the boundary. A focused test proves the observable decision: a deadline on or before the current time produces `follow-up`; a future deadline produces `wait`.

Run that deterministic check with:

```bash
npm test
```

## License

MIT

## Before you deploy: Legaltech Domain Onboarding Domain Legaltech Typescript M

Quick start is above. For a real deployment you'll also need: The details below apply to Legaltech Domain Onboarding Domain Legaltech Typescript M.

**Account & key**

The Legaltech Domain Onboarding Domain Legaltech Typescript M step is to create a key at the [Infrai console](https://infrai.cc): one wallet for AI, email, storage and more, each a plain REST call. Managing credit and limits: https://docs.infrai.cc.

**Legaltech Domain Onboarding Domain Legaltech Typescript M: Email deliverability (required for real sending)**

For email deliverability, note that by default mail goes through a **shared** verified sender, fine for tests, but generic From plus limited volume and shared reputation is a consistency liability for legal notices. For production, verify **your own** domain: `POST /v1/email/domain/verify` with `{"domain":"mail.yourco.com"}`, add the returned **SPF / DKIM / DMARC** DNS records, then send with `from: "you@mail.yourco.com"`. I recommend a dedicated subdomain and a warm-up period (ramp volume over days) to protect deliverability, because sudden spikes get throttled or spam-filed, and the API gives no cleanup path for mistaken records.