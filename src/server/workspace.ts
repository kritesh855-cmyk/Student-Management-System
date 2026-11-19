import { inspectUntrustedContent } from './gemini.ts';

export interface GmailSummaryItem {
  id: string;
  threadId: string;
  from: string;
  subject: string;
  date: string;
  snippet: string;
  bodyPreview: string;
  injectionFlagged: boolean;
  injectionReasons: string[];
}

export interface CalendarEventItem {
  id: string;
  summary: string;
  start: string;
  end: string;
  location: string;
  attendeesCount: number;
  status: string;
  htmlLink?: string;
}

export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  webViewLink?: string;
  size?: string;
}

function decodeBase64Url(input: string): string {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(normalized, 'base64').toString('utf-8');
}

function encodeBase64Url(input: string): string {
  return Buffer.from(input, 'utf-8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function extractTextFromPayload(payload: any): string {
  if (!payload) return '';
  if (payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }
  if (Array.isArray(payload.parts)) {
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        return decodeBase64Url(part.body.data);
      }
    }
    for (const part of payload.parts) {
      const nested = extractTextFromPayload(part);
      if (nested) return nested;
    }
  }
  return '';
}

export async function listGmailMessages(
  accessToken: string,
  query = 'in:inbox',
  maxResults = 8
): Promise<GmailSummaryItem[]> {
  const url = new URL('https://gmail.googleapis.com/gmail/v1/users/me/messages');
  url.searchParams.set('maxResults', String(maxResults));
  if (query) url.searchParams.set('q', query);

  const listRes = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!listRes.ok) {
    const errText = await listRes.text();
    throw new Error(`Gmail API error (${listRes.status}): ${errText}`);
  }

  const listJson = await listRes.json();
  const refs: Array<{ id: string; threadId: string }> = listJson.messages || [];

  const detailed = await Promise.all(
    refs.slice(0, maxResults).map(async (ref) => {
      const msgRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${ref.id}?format=full`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (!msgRes.ok) return null;
      const msg = await msgRes.json();
      const headers: Array<{ name: string; value: string }> = msg.payload?.headers || [];
      const getHeader = (name: string) =>
        headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

      const rawBody = extractTextFromPayload(msg.payload) || msg.snippet || '';
      const securityCheck = inspectUntrustedContent(
        `${getHeader('Subject')} ${rawBody}`
      );

      return {
        id: msg.id,
        threadId: msg.threadId,
        from: getHeader('From'),
        subject: getHeader('Subject') || '(No Subject)',
        date: getHeader('Date'),
        snippet: msg.snippet || '',
        bodyPreview: securityCheck.sanitized.slice(0, 700),
        injectionFlagged: securityCheck.flagged,
        injectionReasons: securityCheck.reasons,
      } as GmailSummaryItem;
    })
  );

  return detailed.filter((item): item is GmailSummaryItem => item !== null);
}

export async function sendGmailMessage(
  accessToken: string,
  params: { to: string; subject: string; body: string }
): Promise<{ id: string; threadId: string }> {
  const rawMime = [
    `To: ${params.to}`,
    `Subject: ${params.subject}`,
    'Content-Type: text/plain; charset="UTF-8"',
    'MIME-Version: 1.0',
    '',
    params.body,
  ].join('\r\n');

  const res = await fetch(
    'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw: encodeBase64Url(rawMime) }),
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gmail send failed (${res.status}): ${errText}`);
  }
  return res.json();
}

export async function listCalendarEvents(
  accessToken: string,
  timeMinIso?: string,
  timeMaxIso?: string
): Promise<CalendarEventItem[]> {
  const now = new Date();
  const min = timeMinIso || now.toISOString();
  const max =
    timeMaxIso || new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const url = new URL(
    'https://www.googleapis.com/calendar/v3/calendars/primary/events'
  );
  url.searchParams.set('singleEvents', 'true');
  url.searchParams.set('orderBy', 'startTime');
  url.searchParams.set('timeMin', min);
  url.searchParams.set('timeMax', max);
  url.searchParams.set('maxResults', '20');

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Calendar API error (${res.status}): ${errText}`);
  }
  const data = await res.json();
  const items: any[] = data.items || [];

  return items.map((ev) => ({
    id: ev.id,
    summary: ev.summary || '(Untitled Event)',
    start: ev.start?.dateTime || ev.start?.date || '',
    end: ev.end?.dateTime || ev.end?.date || '',
    location: ev.location || '',
    attendeesCount: Array.isArray(ev.attendees) ? ev.attendees.length : 0,
    status: ev.status || 'confirmed',
    htmlLink: ev.htmlLink,
  }));
}

export function findFreeSlots(
  events: CalendarEventItem[],
  dateStr: string
): Array<{ start: string; end: string }> {
  const dayStart = new Date(`${dateStr}T09:00:00`);
  const dayEnd = new Date(`${dateStr}T18:00:00`);
  if (Number.isNaN(dayStart.getTime())) return [];

  const busy = events
    .map((ev) => ({
      s: new Date(ev.start).getTime(),
      e: new Date(ev.end).getTime(),
    }))
    .filter((b) => !Number.isNaN(b.s) && !Number.isNaN(b.e))
    .filter((b) => b.e > dayStart.getTime() && b.s < dayEnd.getTime())
    .sort((a, b) => a.s - b.s);

  const slots: Array<{ start: string; end: string }> = [];
  let cursor = dayStart.getTime();

  for (const block of busy) {
    if (block.s > cursor + 30 * 60 * 1000) {
      slots.push({
        start: new Date(cursor).toISOString(),
        end: new Date(Math.min(block.s, dayEnd.getTime())).toISOString(),
      });
    }
    cursor = Math.max(cursor, block.e);
  }
  if (cursor + 30 * 60 * 1000 <= dayEnd.getTime()) {
    slots.push({
      start: new Date(cursor).toISOString(),
      end: dayEnd.toISOString(),
    });
  }
  return slots;
}

export async function createCalendarEvent(
  accessToken: string,
  params: {
    summary: string;
    description?: string;
    startIso: string;
    endIso: string;
    attendees?: string[];
  }
): Promise<CalendarEventItem> {
  const res = await fetch(
    'https://www.googleapis.com/calendar/v3/calendars/primary/events',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        summary: params.summary,
        description: params.description || '',
        start: { dateTime: params.startIso },
        end: { dateTime: params.endIso },
        attendees: (params.attendees || []).map((email) => ({ email })),
      }),
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Calendar create failed (${res.status}): ${errText}`);
  }
  const ev = await res.json();
  return {
    id: ev.id,
    summary: ev.summary,
    start: ev.start?.dateTime || ev.start?.date || '',
    end: ev.end?.dateTime || ev.end?.date || '',
    location: ev.location || '',
    attendeesCount: Array.isArray(ev.attendees) ? ev.attendees.length : 0,
    status: ev.status || 'confirmed',
    htmlLink: ev.htmlLink,
  };
}

export async function listDriveFiles(
  accessToken: string,
  query = ''
): Promise<DriveFileItem[]> {
  const url = new URL('https://www.googleapis.com/drive/v3/files');
  url.searchParams.set(
    'fields',
    'files(id,name,mimeType,modifiedTime,webViewLink,size)'
  );
  url.searchParams.set('pageSize', '20');
  url.searchParams.set('orderBy', 'modifiedTime desc');
  const qParts = ['trashed = false'];
  if (query.trim()) {
    const safe = query.replace(/'/g, "\\'");
    qParts.push(`name contains '${safe}'`);
  }
  url.searchParams.set('q', qParts.join(' and '));

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Drive API error (${res.status}): ${errText}`);
  }
  const data = await res.json();
  return data.files || [];
}

export async function readDriveFileText(
  accessToken: string,
  fileId: string,
  mimeType: string
): Promise<string> {
  const isGoogleDoc = mimeType === 'application/vnd.google-apps.document';
  const endpoint = isGoogleDoc
    ? `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/plain`
    : `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;

  const res = await fetch(endpoint, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(`Unable to read Drive file (${res.status})`);
  }
  const text = await res.text();
  return inspectUntrustedContent(text).sanitized;
}

export async function createDriveTextFile(
  accessToken: string,
  params: { name: string; content: string }
): Promise<DriveFileItem> {
  const boundary = 'autopilot_os_boundary_8841';
  const metadata = JSON.stringify({
    name: params.name.endsWith('.txt') ? params.name : `${params.name}.txt`,
    mimeType: 'text/plain',
  });

  const body =
    `--${boundary}\r\n` +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    `${metadata}\r\n` +
    `--${boundary}\r\n` +
    'Content-Type: text/plain; charset=UTF-8\r\n\r\n' +
    `${params.content}\r\n` +
    `--${boundary}--`;

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,modifiedTime,webViewLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body,
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Drive file creation failed (${res.status}): ${errText}`);
  }
  return res.json();
}
