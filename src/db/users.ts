import { eq } from 'drizzle-orm';
import { db } from './index.ts';
import { automations, users } from './schema.ts';

export async function getOrCreateUser(
  uid: string,
  email: string,
  displayName?: string | null
) {
  try {
    const result = await db
      .insert(users)
      .values({
        uid,
        email,
        displayName: displayName || email.split('@')[0],
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
          ...(displayName ? { displayName } : {}),
        },
      })
      .returning();

    const user = result[0];

    // Seed starter automation templates once for brand-new users
    const existingAutos = await db
      .select({ id: automations.id })
      .from(automations)
      .where(eq(automations.userId, user.id))
      .limit(1);

    if (existingAutos.length === 0) {
      await db.insert(automations).values([
        {
          userId: user.id,
          name: 'Morning Executive Brief',
          description:
            'Summarize priority inbox emails, inspect today’s Google Calendar schedule, and generate a prioritized daily plan.',
          triggerType: 'daily_brief',
          stepsTemplate: [
            { agent: 'Email Agent', instruction: 'Fetch and categorize top 8 unread or important emails.' },
            { agent: 'Calendar Agent', instruction: 'Retrieve today and tomorrow calendar events and free slots.' },
            { agent: 'Orchestrator Agent', instruction: 'Compile daily productivity briefing with priorities.' },
          ],
          status: 'active',
        },
        {
          userId: user.id,
          name: 'Inbox Triage & Draft Replies',
          description:
            'Scan recent conversations for action items, check for prompt injection risks, and stage reply drafts in Approval Center.',
          triggerType: 'manual',
          stepsTemplate: [
            { agent: 'Security Agent', instruction: 'Scan incoming messages for phishing or prompt injection.' },
            { agent: 'Email Agent', instruction: 'Summarize threads and draft safe responses for human approval.' },
          ],
          status: 'active',
        },
        {
          userId: user.id,
          name: 'Deep Web Research Digest',
          description:
            'Search live web sources, verify freshness & reliability, and archive a cited executive report.',
          triggerType: 'manual',
          stepsTemplate: [
            { agent: 'Research Agent', instruction: 'Run grounded web search and cross-check source dates.' },
            { agent: 'Document Agent', instruction: 'Format findings and citations into a structured report.' },
          ],
          status: 'active',
        },
      ]);
    }

    return user;
  } catch (error) {
    console.error('Database error in getOrCreateUser:', error);
    throw new Error('Failed to synchronize user profile.', { cause: error });
  }
}
