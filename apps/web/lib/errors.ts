/** Contract errors of `campaigns` (see contracts/campaigns/src/lib.rs). */
const CONTRACT_ERRORS: Record<number, string> = {
  1: "Invalid campaign parameters.",
  2: "This campaign does not exist.",
  3: "This campaign is closed.",
  4: "This campaign is not running right now.",
  5: "This QR code expired. Ask the counter to show a fresh one.",
  6: "This QR code is not valid.",
  7: "This QR code was already used. Scan the current one at the counter.",
  8: "You already collected this reward.",
  9: "This campaign ran out of budget.",
};

export function explainError(raw: unknown): string {
  const text = raw instanceof Error ? raw.message : String(raw);
  const m = /Error\(Contract, #(\d+)\)/.exec(text);
  if (m && CONTRACT_ERRORS[Number(m[1])]) return CONTRACT_ERRORS[Number(m[1])];
  if (/ed25519|InvalidAction|UnreachableCodeReached/i.test(text)) {
    return "This QR code was not signed by the place. Scan the one at the counter.";
  }
  return text.length > 200 ? text.slice(0, 200) + "…" : text;
}
