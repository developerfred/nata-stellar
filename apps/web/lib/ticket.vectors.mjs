// Prints a reference payload used by the Rust test `ticket_payload_matches_web_encoding`.
import { StrKey } from "@stellar/stellar-sdk";
const { ticketPayload, toHex } = await import("./ticket.ts");
const contractId = StrKey.encodeContract(Buffer.alloc(32, 1));
const payload = ticketPayload(contractId, 42n, new Uint8Array(32).fill(5), 1793000020n);
console.log(contractId);
console.log(toHex(payload));
