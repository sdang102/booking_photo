export async function refreshPublicContent() {
  try {
    await fetch('/api/revalidate-public', { method: 'POST' });
  } catch {
    // The mutation already completed; a later TTL refresh will update public pages.
  }
}
