import { deserializeSession, serializeSession, type TableSession } from '../core/session';
import { getItem, setItem } from './db';

const SESSION_KEY = 'session.v1';

export async function saveSession(s: TableSession): Promise<void> {
  await setItem(SESSION_KEY, serializeSession(s));
}

export async function loadSession(): Promise<TableSession | null> {
  const value = await getItem(SESSION_KEY);
  if (value === null) return null;
  try {
    return deserializeSession(value);
  } catch {
    return null;
  }
}
