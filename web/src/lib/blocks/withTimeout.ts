/** How long any single Blocks call may take before it is treated as failed. */
const DEFAULT_TIMEOUT_MS = 15_000;

export class BlocksTimeoutError extends Error {
  constructor(public readonly label: string, ms: number) {
    super(`${label} didn't respond within ${Math.round(ms / 1000)}s.`);
    this.name = "BlocksTimeoutError";
  }
}

/**
 * Fails a Blocks call that never settles.
 *
 * The SDK has no request timeout, so a call that hangs -- for any reason,
 * including one inside the SDK's own token handling -- leaves the query
 * pending forever and the screen on a spinner with no way out. Rejecting
 * instead turns that into an error state the UI already knows how to show.
 *
 * The underlying request is not cancelled: it is not ours to abort, and if it
 * does eventually answer, nothing is listening. This bounds the *UI's* wait,
 * which is the part that matters.
 */
export function withTimeout<T>(work: Promise<T>, label: string, ms = DEFAULT_TIMEOUT_MS): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new BlocksTimeoutError(label, ms)), ms);
    work.then(
      (value) => {
        window.clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        window.clearTimeout(timer);
        reject(error);
      }
    );
  });
}
