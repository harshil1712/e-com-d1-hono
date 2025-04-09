export interface RetryConfig {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
}

const shouldRetry = (error: unknown): boolean => {
  const errMsg = error instanceof Error ? error.message : String(error);
  return (
    errMsg.includes("Network connection lost") ||
    errMsg.includes("storage caused object to be reset") ||
    errMsg.includes("reset because its code was updated")
  );
};

export const defaultRetryConfig: RetryConfig = {
  maxRetries: 3,
  initialDelay: 100,
  maxDelay: 1000,
  backoffFactor: 2,
};

export async function withRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig = defaultRetryConfig
): Promise<T> {
  const maxRetries = config.maxRetries ?? defaultRetryConfig.maxRetries!;
  const initialDelay = config.initialDelay ?? defaultRetryConfig.initialDelay!;
  const maxDelay = config.maxDelay ?? defaultRetryConfig.maxDelay!;
  const backoffFactor =
    config.backoffFactor ?? defaultRetryConfig.backoffFactor!;

  let lastError: Error | unknown;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await operation();
      return result;
    } catch (error) {
      lastError = error;

      if (!shouldRetry(error) || attempt === maxRetries) {
        throw error;
      }

      // Wait for the calculated delay
      await new Promise((resolve) => setTimeout(resolve, delay));

      // Calculate next delay with exponential backoff
      delay = Math.min(delay * backoffFactor, maxDelay);
    }
  }

  throw lastError;
}
