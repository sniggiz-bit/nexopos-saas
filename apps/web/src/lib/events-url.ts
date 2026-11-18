export function eventsUrl(): string {
  const api = new URL(import.meta.env.VITE_API_URL || '/api', window.location.origin);
  return api.origin + '/events';
}
