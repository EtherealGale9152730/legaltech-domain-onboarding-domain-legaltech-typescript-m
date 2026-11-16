import { InfraiClient } from "./infrai_client.js";
import { deliverSignedDocument, onboardSendingDomain } from "./legal_matter.js";

const key = process.env.INFRAI_API_KEY;
const to = process.env.DEMO_EMAIL_TO;
if (!key || !to) throw new Error("INFRAI_API_KEY and DEMO_EMAIL_TO are required");
const client = new InfraiClient(key);
const domain = process.env.SENDING_DOMAIN ?? "example.org";
console.log(await onboardSendingDomain(client, domain));
console.log(await deliverSignedDocument(client, { matterId: "matter-104", clientEmail: to, deadline: "2030-04-12T17:00:00.000Z", signedDocumentName: "engagement-letter.pdf" }));
