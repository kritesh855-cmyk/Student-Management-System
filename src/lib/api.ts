import { getIdToken, getWorkspaceAccessToken } from './firebase';

export async function apiFetch<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const idToken = await getIdToken();
  if (!idToken) {
    throw new Error('Authentication required. Please sign in with Google.');
  }

  const wsToken = getWorkspaceAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${idToken}`,
    ...(wsToken ? { 'X-Workspace-Token': wsToken } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };

  const res = await fetch(path, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data as T;
}
