/**
 * Session Manager for Checkout Funnel Tracking
 *
 * Manages browser session IDs for tracking user flow through checkout funnel.
 * Session persists across page reloads within the same browser tab.
 */

const SESSION_KEY = 'venvl_funnel_session_id';
const SESSION_TIMESTAMP_KEY = 'venvl_funnel_session_timestamp';
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Generates a new unique session ID
 */
function generateSessionId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 11);
  return `session_${timestamp}_${random}`;
}

/**
 * Gets or creates a session ID for funnel tracking
 * Returns existing session if within timeout, otherwise creates new one
 */
export function getFunnelSessionId(): string {
  try {
    const existingSessionId = sessionStorage.getItem(SESSION_KEY);
    const sessionTimestamp = sessionStorage.getItem(SESSION_TIMESTAMP_KEY);

    if (existingSessionId && sessionTimestamp) {
      const elapsed = Date.now() - parseInt(sessionTimestamp, 10);

      // If session is still valid (within 30 minutes), return it
      if (elapsed < SESSION_TIMEOUT_MS) {
        // Update timestamp to extend session
        sessionStorage.setItem(SESSION_TIMESTAMP_KEY, Date.now().toString());
        return existingSessionId;
      }
    }

    // Create new session
    const newSessionId = generateSessionId();
    sessionStorage.setItem(SESSION_KEY, newSessionId);
    sessionStorage.setItem(SESSION_TIMESTAMP_KEY, Date.now().toString());

    return newSessionId;
  } catch (error) {
    // Fallback if sessionStorage is not available
    console.warn('SessionStorage not available, using temporary session ID');
    return generateSessionId();
  }
}

/**
 * Clears the funnel session (e.g., after booking completion)
 */
export function clearFunnelSession(): void {
  try {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_TIMESTAMP_KEY);
  } catch (error) {
    console.warn('Failed to clear funnel session');
  }
}

/**
 * Gets the current session ID if it exists (doesn't create new one)
 */
export function getCurrentSessionId(): string | null {
  try {
    return sessionStorage.getItem(SESSION_KEY);
  } catch (error) {
    return null;
  }
}

/**
 * Checks if the current session is expired
 */
export function isSessionExpired(): boolean {
  try {
    const sessionTimestamp = sessionStorage.getItem(SESSION_TIMESTAMP_KEY);
    if (!sessionTimestamp) return true;

    const elapsed = Date.now() - parseInt(sessionTimestamp, 10);
    return elapsed >= SESSION_TIMEOUT_MS;
  } catch (error) {
    return true;
  }
}
