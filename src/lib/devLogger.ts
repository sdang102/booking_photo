/** Keep diagnostic warnings out of production browser/server logs. */
export function devWarn(...args: unknown[]) {
  if (process.env.NODE_ENV !== 'production') console.warn(...args);
}
