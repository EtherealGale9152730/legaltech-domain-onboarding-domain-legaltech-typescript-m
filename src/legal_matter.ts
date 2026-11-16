import { z } from "zod";
import { InfraiClient, infrai } from "./infrai_client.js";

export const matterIntake = z.object({ matterId: z.string().min(1), clientEmail: z.string().email(), deadline: z.string().datetime(), signedDocumentName: z.string().min(1) });
export type MatterIntake = z.infer<typeof matterIntake>;

export async function onboardSendingDomain(client: InfraiClient, domain: string) {
  const verification = await infrai.email.domain.verify(client, domain);
  await infrai.email.domain.rotate_dkim(client, domain);
  return { verificationStatus: verification.verification.status };
}

export async function deliverSignedDocument(client: InfraiClient, input: MatterIntake) {
  const matter = matterIntake.parse(input);
  return infrai.email.send(client, { to: matter.clientEmail, subject: `Signed document for matter ${matter.matterId}`, html: `<p>Your signed document, ${matter.signedDocumentName}, is ready for review.</p><p>Deadline: ${matter.deadline}</p>` });
}

export function followUpDecision(input: MatterIntake, now: Date): "follow-up" | "wait" {
  const matter = matterIntake.parse(input);
  return new Date(matter.deadline).getTime() <= now.getTime() ? "follow-up" : "wait";
}
