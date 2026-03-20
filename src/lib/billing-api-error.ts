/** Thrown when a billing/trial API returns a structured error (e.g. 403 + code). */
export class BillingApiError extends Error {
  readonly code: string | undefined;

  constructor(message: string, code?: string) {
    super(message);
    this.name = "BillingApiError";
    this.code = code;
  }
}
