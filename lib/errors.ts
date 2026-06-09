export type ServiceErrorCode =
  | "unauthorized" // not logged in
  | "forbidden" // logged in but lacks role/permission
  | "validation" // bad input
  | "not_found"
  | "conflict"; // e.g. duplicate bet, already settled

/** Domain error thrown by the service layer. Server Actions catch these and
 *  surface `.message` to the user. */
export class ServiceError extends Error {
  code: ServiceErrorCode;
  constructor(code: ServiceErrorCode, message: string) {
    super(message);
    this.name = "ServiceError";
    this.code = code;
  }
}

export const unauthorized = (m = "You must be signed in.") =>
  new ServiceError("unauthorized", m);
export const forbidden = (m = "You don't have permission to do that.") =>
  new ServiceError("forbidden", m);
export const validation = (m: string) => new ServiceError("validation", m);
export const notFound = (m = "Not found.") => new ServiceError("not_found", m);
export const conflict = (m: string) => new ServiceError("conflict", m);

/** Narrow an unknown thrown value into a user-safe message + code. */
export function toActionError(err: unknown): { code: ServiceErrorCode | "error"; message: string } {
  if (err instanceof ServiceError) return { code: err.code, message: err.message };
  return { code: "error", message: "Something went wrong. Please try again." };
}
