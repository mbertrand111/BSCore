/**
 * crypto.randomUUID() is a global available in both Node.js (≥19) and the
 * Edge Runtime, so no node:crypto import is needed here.
 */
export function generateRequestId(): string {
  return crypto.randomUUID()
}
