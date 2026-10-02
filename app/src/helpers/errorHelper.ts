// Turns low-level fetch/server errors into copy that is safe to show to users.
export function friendlyError(error: unknown, fallback = 'Something went wrong. Please try again.') {
  const message = error instanceof Error ? error.message : String(error ?? '');
  if (/could not connect|network request failed|fetch failed|timed out|offline/i.test(message)) {
    return 'We couldn’t reach GasMeUp. Check your connection and try again.';
  }
  const cleaned = message.replace(/^(Error:\s*)+/i, '').trim();
  if (!cleaned || cleaned === 'undefined' || /exception|\.swift|\(\d{3}\)$/i.test(cleaned)) {
    return fallback;
  }
  return cleaned;
}

export default { friendlyError };
