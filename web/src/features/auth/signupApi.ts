import { blocksClient } from "../../lib/blocks/client";

export type SignUpRequest = {
  email: string;
  firstName: string;
  lastName: string;
};

/** IAM's answer: success, or field messages keyed by IAM's own field names ("Email"). */
export type SignUpResult = { ok: true } | { ok: false; fieldErrors: Record<string, string> };

type SignUpResponse = {
  isSuccess?: boolean;
  errors?: Record<string, string> | null;
};

/**
 * Registers an account with Blocks IAM. Only the email is required: IAM then
 * emails a link where the person sets their password and activates the
 * account, so this form never handles a password. IAM owns every rule
 * (format, duplicates), so its messages are shown as they come.
 */
export async function signUp(request: SignUpRequest): Promise<SignUpResult> {
  const response = (await blocksClient.auth.signup({
    email: request.email,
    // Blank names are left out rather than sent as empty strings.
    ...(request.firstName && { firstName: request.firstName }),
    ...(request.lastName && { lastName: request.lastName })
  })) as SignUpResponse;

  if (response.isSuccess) return { ok: true };
  return { ok: false, fieldErrors: response.errors ?? {} };
}
