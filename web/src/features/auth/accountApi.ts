import { blocksClient } from "../../lib/blocks/client";

// Account steps behind Limereel's own screens (SPEC §7.9). IAM owns the
// accounts, the password rules and the emails; these calls only relay what
// the person typed. Payload names match what Blocks' own hosted pages send.

/** IAM's answer: success, or messages keyed by IAM's own field names. */
export type AccountResult = { ok: true } | { ok: false; errors: Record<string, string> };

type IamResponse = {
  isSuccess?: boolean;
  errors?: Record<string, string> | null;
};

function toResult(response: unknown): AccountResult {
  const body = (response ?? {}) as IamResponse;
  if (body.isSuccess) return { ok: true };
  return { ok: false, errors: body.errors ?? {} };
}

/**
 * Sends the password-reset email. The caller shows the same answer whatever
 * IAM says, so nobody can learn which addresses have accounts.
 */
export async function requestPasswordReset(email: string): Promise<void> {
  await blocksClient.auth.recover({ email: email.trim() });
}

/** Sets a new password from the emailed reset link's code. */
export async function resetPassword(code: string, password: string): Promise<AccountResult> {
  return toResult(await blocksClient.auth.resetPassword({ code, password }));
}

/** Sets the first password from the emailed activation link's code, which activates the account. */
export async function activateAccount(code: string, password: string): Promise<AccountResult> {
  return toResult(await blocksClient.auth.activate({ code, password }));
}

/**
 * Asks for a fresh activation email. IAM's resend endpoint needs the user's
 * id, which a signed-out visitor doesn't have; signing up again with the same
 * address re-sends the activation for an account that isn't active yet, and
 * answers the same either way, so it never reveals whether the email exists.
 */
export async function requestActivationEmail(email: string): Promise<void> {
  await blocksClient.auth.signup({ email: email.trim() });
}

/** True when IAM's messages point at the link's code rather than the password. */
export function isLinkProblem(errors: Record<string, string>): boolean {
  return Object.entries(errors).some(([field, message]) => /code|token|link|expire/i.test(`${field} ${message}`));
}
