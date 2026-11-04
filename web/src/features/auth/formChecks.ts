// Light checks so obvious slips fail before the round trip; IAM still makes
// the final call on what counts as a valid address or a strong password.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const NETWORK_ERROR = "Something went wrong. Try again.";

export function checkEmail(email: string): string | undefined {
  if (!email) return "Enter your email address.";
  if (!EMAIL_PATTERN.test(email)) return "Enter an email address like name@example.com.";
  return undefined;
}

export function checkNewPassword(password: string, confirm: string): { password?: string; confirm?: string } {
  if (!password) return { password: "Choose a password." };
  if (password !== confirm) return { confirm: "The two passwords don't match." };
  return {};
}

/** Reads a trimmed text field from a submitted form. */
export function readField(form: HTMLFormElement, name: string): string {
  return String(new FormData(form).get(name) ?? "").trim();
}

/**
 * Reads a password exactly as typed (no trimming), then empties the input,
 * so the value only lives for the length of the request.
 */
export function takePassword(form: HTMLFormElement, name: string): string {
  const input = form.elements.namedItem(name);
  if (!(input instanceof HTMLInputElement)) return "";
  const value = input.value;
  input.value = "";
  return value;
}
