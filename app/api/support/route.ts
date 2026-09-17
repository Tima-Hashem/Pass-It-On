import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { getGeminiClient } from '@/lib/gemini';

export async function POST(request: Request) {
  let userMessage = '';

  try {
    const body = await request.json();
    userMessage = body.userMessage;
    const messageHistory = body.messageHistory;
    const session = await getSession();

if (!session) {
  return new Response('Unauthorized', { status: 401 });
}

const user = await prisma.user.findUnique({
  where: { id: session.userId },
  include: {
    mentorshipsAsStudent: {
      include: {
        skill: true,
      },
    },
    mentorshipsAsMentor: {
      include: {
        skill: true,
      },
    },
  },
});
const suggestedLinks: { label: string; href: string }[] = [];

if (user.role === 'ADMIN') {
  suggestedLinks.push({
    label: 'Admin Dashboard',
    href: '/admin/dashboard',
  });
} else {
  suggestedLinks.push({
    label: 'My Dashboard',
    href: '/user/dashboard',
  });

  suggestedLinks.push({
    label: 'Find Mentors',
    href: '/user/search',
  });

  const studentMentorships = user.mentorshipsAsStudent ?? [];
  const mentorMentorships = user.mentorshipsAsMentor ?? [];

  if (studentMentorships.length > 0 || mentorMentorships.length > 0) {
    const activeId =
      studentMentorships[0]?.id || mentorMentorships[0]?.id;

    if (activeId) {
      suggestedLinks.push({
        label: 'Open Active Workspace',
        href: `/user/workspace/${activeId}`,
      });
    }
  }
}

if (!user) {
  return new Response('User not found', { status: 404 });
}

    if (!userMessage) {
      return new Response('Missing userMessage', { status: 400 });
    }

    const ai = getGeminiClient();

    if (!ai) {
      return new Response('Gemini is not configured', { status: 503 });
    }

    const userContextSummary = `
Current User:
- Name: ${user.name}
- Role: ${user.role}
- Mentorships Owed to Community: ${user.mentorshipsOwed}
- Active learning mentorships (as student): ${(user.mentorshipsAsStudent ?? []).length} (${(user.mentorshipsAsStudent ?? []).map((m: any) => `${m.skill.name}: ${m.status}`).join(', ') || 'None'})
- Active mentoring sessions (as mentor): ${(user.mentorshipsAsMentor ?? []).length} (${(user.mentorshipsAsMentor ?? []).map((m: any) => `${m.skill.name}: ${m.status}`).join(', ') || 'None'})
`;
    const systemInstruction = `You are the friendly, knowledgeable Support AI for "PassItOn", a student skill mentorship platform with a pay-it-forward philosophy.

Your job is to help users understand:
- How PassItOn works
- Finding mentors
- Mentorship requests
- The Pay-It-Forward model
- Mentorships owed
- Collaborative workspaces
- Project submissions
- Mentor review
- Admin verification
- Certificates
- Platform navigation

IMPORTANT:
- Give factual answers based only on PassItOn platform rules.
- Do not invent platform features, mentors, users, links, or policies.
- Give clear, practical step-by-step guidance.
- Be friendly, professional, and concise.
- You may use Markdown formatting.
`;

    const contents = [
      ...(Array.isArray(messageHistory)
        ? messageHistory.slice(-6).map((msg: any) => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }],
          }))
        : []),
      {
        role: 'user',
        parts: [
          {
            text: `${systemInstruction}\n\n${userContextSummary}\n\nUser Question: ${userMessage}`,
          },
        ],
      },
    ];

    let response;

for (let attempt = 1; attempt <= 3; attempt++) {
  try {
    response = await ai.models.generateContentStream({
      model: 'gemini-3.8-flash',
      contents,
    });
    break;
  } catch (error: any) {
    console.error(`Support Gemini attempt ${attempt} failed:`, error);

    // Free-tier quota exhausted or temporary model overload.
    if (error?.status === 429 || error?.status === 503) {
      if (attempt < 3) {
        await new Promise((resolve) =>
          setTimeout(resolve, attempt * 1000)
        );
        continue;
      }
    }

    throw error;
  }
}

if (!response) {
  throw new Error('Gemini did not return a streaming response');
}

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of response) {
            const text = chunk.text || '';

            if (text) {
              controller.enqueue(
  encoder.encode(`data: ${JSON.stringify(text)}\n\n`)
);
            }
          }

          controller.enqueue(
  encoder.encode(
    `event: links\ndata: ${JSON.stringify(suggestedLinks)}\n\n`
  )
);

controller.close();
        } catch (error) {
          console.error('Support streaming error:', error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
  status: 200,
  headers: {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  },
});
    } catch (error: any) {
    console.error('Support API error:', error);

    const normalized = String(userMessage || '').toLowerCase();
    let fallback = '';

    if (
      normalized.includes('pay it forward') ||
      normalized.includes('owed') ||
      normalized.includes('owe') ||
      normalized.includes('community commitment') ||
      normalized.includes('mentorships owed')
    ) {
      fallback = `**The PassItOn "Pay-It-Forward" Philosophy:**

1. **Free Peer Mentorship:** You receive dedicated 1-on-1 mentorship from an experienced peer at zero financial cost.
2. **The Community Promise:** In exchange, once you finish your project and earn your verified certificate, you commit to mentoring another student who wants to learn that skill.
3. **Owed Balance:** If you complete a track, your mentorships owed can increase. You fulfill this commitment by mentoring another peer in your certified skill!`;
    } else if (
      normalized.includes('submit') ||
      normalized.includes('project') ||
      normalized.includes('workspace')
    ) {
      fallback = `**How to Submit Your Project for Review:**

1. Navigate to your active mentorship workspace from your Dashboard.
2. Make sure your GitHub Repository URL and Live Demo URL are ready.
3. Submit your project inside the workspace.
4. Your mentor reviews the submission.
5. After mentor approval, an admin performs the final verification.`;
    } else if (
      normalized.includes('certificate') ||
      normalized.includes('cert')
    ) {
      fallback = `**About Certificates & Verification:**

- Your project must first be approved by your mentor.
- An admin then performs final verification.
- Once approved, your digital certificate appears on your profile and dashboard.
- Each certificate has a unique ID and issue date.`;
    } else if (
      normalized.includes('matchmaker') ||
      normalized.includes('find a mentor') ||
      normalized.includes('find mentor')
    ) {
      fallback = `**Finding the Right Mentor:**

- Use the **AI Matchmaker** to receive mentor recommendations based on your learning goals.
- You can also use the **Mentor Directory** to browse available mentors and their skills.`;
    } else {
      fallback = `Welcome to PassItOn Support!

I can help you with:

- **Pay-It-Forward Rules**
- **Mentorships Owed**
- **Project Submissions**
- **Workspace & Milestones**
- **Certificates**
- **Finding Mentors**
- **AI Matchmaker**

Ask me what you would like help with.`;
    }

    const encoder = new TextEncoder();

const fallbackStream = new ReadableStream({
  async start(controller) {
    const words = fallback.split(' ');

    for (let i = 0; i < words.length; i++) {
      const chunk = words[i] + (i < words.length - 1 ? ' ' : '');

      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`)
      );

      await new Promise((resolve) => setTimeout(resolve, 35));
    }

        

    controller.close();
  },
});

return new Response(fallbackStream, {
  status: 200,
  headers: {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  },
});
  }
}