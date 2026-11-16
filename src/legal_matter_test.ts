import assert from "node:assert/strict";
import { followUpDecision } from "./legal_matter.js";

const matter = { matterId: "matter-104", clientEmail: "client@example.org", deadline: "2026-04-20T17:00:00.000Z", signedDocumentName: "order.pdf" };
assert.equal(followUpDecision(matter, new Date("2026-04-21T09:00:00.000Z")), "follow-up");
assert.equal(followUpDecision(matter, new Date("2026-04-19T09:00:00.000Z")), "wait");
console.log("deadline decision test passed");
