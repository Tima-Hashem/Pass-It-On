'use server';

import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { getGeminiClient } from '@/lib/gemini';

export interface RecommendedMentor {
  id: string;
  name: string;
  bio: string | null;
  skills: { id: string; name: string }[];
  matchScore: number;
  matchReason: string;
}

export interface MatchmakerResponse {
  text: string;
  recommendations: RecommendedMentor[];
  mentorshipOwedNotice?: string;
  error?: string;
}

interface AIMatch {
  mentorId: string;
  relevance: 'high' | 'medium' | 'low';
  matchReason: string;
}

interface AIResult {
  response: string;
  matches: AIMatch[];
}

/**
 * AI Mentor Matchmaker
 *
 * Architecture:
 *
 * Learner message
 *      ↓
 * Real mentor directory from PostgreSQL
 *      ↓
 * Gemini analyzes the learner's goal against real mentor skills
 *      ↓
 * Structured JSON
 *      ↓
 * Server validates mentor IDs
 *      ↓
 * Deterministic match score
 *      ↓
 * Existing MatchmakerMentorCard
 *      ↓
 * Existing requestMentorship()
 *
 * Important:
 * Gemini recommends.
 * The application/database remain the source of truth.
 */
export async function getAIResponse(
  userMessage: string,
  messageHistory: { role: 'user' | 'assistant'; content: string }[] = []
): Promise<MatchmakerResponse> {
  const session = await getSession();

  if (!session) {
    return {
      text: 'Please log in to use the AI mentor matchmaker.',
      recommendations: [],
      error: 'Not authenticated.'
    };
  }

  try {
    // ------------------------------------------------------------
    // 1. Get the current learner
    // ------------------------------------------------------------

    const currentUser = await prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        userSkills: {
          include: {
            skill: true
          }
        }
      }
    });

    if (!currentUser) {
      return {
        text: 'I could not find your learner profile.',
        recommendations: [],
        error: 'User not found.'
      };
    }

    // ------------------------------------------------------------
    // 2. Get the real skill catalog
    // ------------------------------------------------------------

    const skills = await prisma.skill.findMany({
      select: {
        id: true,
        name: true,
        description: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    // ------------------------------------------------------------
    // 3. Get real potential mentors
    //
    // PassItOn is a pay-it-forward platform, so we do NOT require
    // a permanent MENTOR role.
    //
    // Anyone other than the learner who has verified UserSkills
    // can potentially be recommended.
    // ------------------------------------------------------------

    const users = await prisma.user.findMany({
      where: {
        id: {
          not: session.userId
        },
        userSkills: {
          some: {}
        }
      },
      select: {
        id: true,
        name: true,
        bio: true,
        userSkills: {
          include: {
            skill: {
              select: {
                id: true,
                name: true,
                description: true
              }
            }
          }
        }
      }
    });

    const activeMentors = users.map((user) => ({
      id: user.id,
      name: user.name,
      bio: user.bio,
      skills: user.userSkills.map((us) => ({
        id: us.skill.id,
        name: us.skill.name,
        description: us.skill.description
      }))
    }));

    // ------------------------------------------------------------
    // 4. Mentorship economy information
    // ------------------------------------------------------------

    const mentorshipsOwed = currentUser.mentorshipsOwed;

    const mentorshipOwedNotice =
      mentorshipsOwed > 1
        ? `You currently need to mentor ${mentorshipsOwed} more student${
            mentorshipsOwed === 1 ? '' : 's'
          } before requesting another mentorship.`
        : undefined;

    // ------------------------------------------------------------
    // 5. Handle empty mentor directory
    // ------------------------------------------------------------

    if (activeMentors.length === 0) {
      return {
        text: 'I could not find any potential mentors with registered skills yet.',
        recommendations: [],
        mentorshipOwedNotice
      };
    }

    // ------------------------------------------------------------
    // 6. Prepare learner context
    // ------------------------------------------------------------

    const learnerSkills = currentUser.userSkills.map(
      (userSkill) => userSkill.skill.name
    );

    const learnerContext = {
      name: currentUser.name,
      bio: currentUser.bio,
      knownSkills: learnerSkills
    };

    // ------------------------------------------------------------
    // 7. If Gemini is unavailable, use deterministic fallback
    // ------------------------------------------------------------

    const ai = getGeminiClient();

    if (!ai) {
      return buildFallbackResponse(
        userMessage,
        activeMentors,
        learnerContext,
        mentorshipOwedNotice
      );
    }

    // ------------------------------------------------------------
    // 8. Build structured AI prompt
    // ------------------------------------------------------------

    const mentorDirectory = activeMentors.map((mentor) => ({
      id: mentor.id,
      name: mentor.name,
      bio: mentor.bio,
      skills: mentor.skills.map((skill) => skill.name)
    }));

    const recentHistory = messageHistory.slice(-6);

    const historyText = recentHistory
      .map(
        (message) =>
          `${message.role === 'user' ? 'Learner' : 'Mentor Agent'}: ${
            message.content
          }`
      )
      .join('\n');

    const systemInstruction = `
You are PassItOn's AI Mentor Matching Agent.

Your job is to help a learner find realistic mentors from the REAL mentor directory supplied by the application.

CORE PRINCIPLES:

1. Understand the learner's actual goal.
2. Prioritize direct skill/expertise relevance.
3. Consider the learner's existing skills when useful.
4. Consider the learner's stated experience level when they provide it.
5. Consider project or learning objectives when stated.
6. Prefer direct evidence over broad or speculative connections.
7. Recommend UP TO 3 mentors.
8. If only 1 or 2 mentors are genuinely relevant, return only those.
9. Never invent qualifications, experience, availability, interests, or certifications.
10. Never recommend a mentor who is not present in the supplied directory.
11. Never invent mentor IDs.
12. Do not match people based on irrelevant personal characteristics.
13. Do not claim that a match is perfect.
14. A mentor does not need a permanent MENTOR role. PassItOn uses a pay-it-forward model where students can potentially mentor other students.
15. If the learner's request is unclear, ask a useful clarification question instead of inventing a goal.
16. The response should be helpful and concise.

RELEVANCE LEVELS:

HIGH:
The mentor has a direct skill strongly connected to the learner's stated goal.

MEDIUM:
The mentor has a useful related skill, but the connection is indirect or broader.

LOW:
The connection is weak. Avoid recommending LOW matches unless there is genuinely no better relevant option.

IMPORTANT:
You are selecting from real application data. Treat the mentor directory as authoritative.
`;

    const prompt = `
${systemInstruction}

LEARNER PROFILE:
${JSON.stringify(learnerContext, null, 2)}

CURRENT LEARNER MESSAGE:
${userMessage}

RECENT CONVERSATION:
${historyText || '(No previous conversation)'}

REAL MENTOR DIRECTORY:
${JSON.stringify(mentorDirectory, null, 2)}

AVAILABLE SKILL CATALOG:
${JSON.stringify(
  skills.map((skill) => ({
    id: skill.id,
    name: skill.name,
    description: skill.description
  })),
  null,
  2
)}

Analyze the learner's request and return ONLY the structured response requested by the response schema.
`;

    // ------------------------------------------------------------
    // 9. Ask Gemini for structured output
    // ------------------------------------------------------------

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        temperature: 0.2,
        maxOutputTokens: 1200,
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'object',
          properties: {
            response: {
              type: 'string',
              description:
                'A concise natural-language response to the learner.'
            },
            matches: {
              type: 'array',
              maxItems: 3,
              items: {
                type: 'object',
                properties: {
                  mentorId: {
                    type: 'string',
                    description:
                      'Exact mentor ID from the supplied mentor directory.'
                  },
                  relevance: {
                    type: 'string',
                    enum: ['high', 'medium', 'low']
                  },
                  matchReason: {
                    type: 'string',
                    description:
                      'Evidence-based explanation of why this mentor fits the learner goal.'
                  }
                },
                required: ['mentorId', 'relevance', 'matchReason']
              }
            }
          },
          required: ['response', 'matches']
        }
      }
    });

    // ------------------------------------------------------------
    // 10. Parse structured response
    // ------------------------------------------------------------

    let aiResult: AIResult;

    try {
      aiResult = JSON.parse(response.text || '{}') as AIResult;
    } catch {
      console.error('AI returned invalid JSON:', response.text);

      return buildFallbackResponse(
        userMessage,
        activeMentors,
        learnerContext,
        mentorshipOwedNotice
      );
    }

    if (
      typeof aiResult.response !== 'string' ||
      !Array.isArray(aiResult.matches)
    ) {
      return buildFallbackResponse(
        userMessage,
        activeMentors,
        learnerContext,
        mentorshipOwedNotice
      );
    }

    // ------------------------------------------------------------
    // 11. Validate AI recommendations against real database data
    // ------------------------------------------------------------

    const mentorMap = new Map(
      activeMentors.map((mentor) => [mentor.id, mentor])
    );

    const validatedMatches = aiResult.matches
      .slice(0, 3)
      .map((match) => {
        const mentor = mentorMap.get(match.mentorId);

        if (!mentor) {
          return null;
        }

        return {
          mentor,
          relevance: match.relevance,
          reason: match.matchReason
        };
      })
      .filter(
        (
          item
        ): item is {
          mentor: (typeof activeMentors)[number];
          relevance: 'high' | 'medium' | 'low';
          reason: string;
        } => item !== null
      );

    // ------------------------------------------------------------
    // 12. Calculate a transparent score
    //
    // The AI does NOT invent "95%" or "87%".
    //
    // The score is derived from the relevance category:
    // HIGH   = 90
    // MEDIUM = 70
    // LOW    = 50
    //
    // This keeps the existing UI compatible while avoiding fake
    // precision.
    // ------------------------------------------------------------

    const scoreForRelevance = {
      high: 90,
      medium: 70,
      low: 50
    } as const;

    const recommendations: RecommendedMentor[] = validatedMatches
      .filter((match) => match.relevance !== 'low')
      .map((match) => ({
        id: match.mentor.id,
        name: match.mentor.name,
        bio: match.mentor.bio,
        skills: match.mentor.skills.map((skill) => ({
          id: skill.id,
          name: skill.name
        })),
        matchScore: scoreForRelevance[match.relevance],
        matchReason: match.reason
      }));

    // ------------------------------------------------------------
    // 13. Return result to existing UI
    // ------------------------------------------------------------

    return {
      text: aiResult.response,
      recommendations,
      mentorshipOwedNotice
    };
  } catch (error) {
    console.error('AI Matchmaker error:', error);

    return {
      text:
        'I ran into a problem while searching for mentors. Please try describing your learning goal again.',
      recommendations: [],
      error: 'AI matching failed.'
    };
  }
}

/**
 * Deterministic fallback used when Gemini is unavailable.
 *
 * This does NOT pretend to understand semantic meaning.
 * It simply looks for explicit skill names in the learner's message.
 */
function buildFallbackResponse(
  userMessage: string,
  mentors: {
    id: string;
    name: string;
    bio: string | null;
    skills: {
      id: string;
      name: string;
      description: string | null;
    }[];
  }[],
  learner: {
    name: string;
    bio: string | null;
    knownSkills: string[];
  },
  mentorshipOwedNotice?: string
): MatchmakerResponse {
  const normalizedInput = userMessage.toLowerCase();

  const candidates = mentors
    .map((mentor) => {
      const matchingSkills = mentor.skills.filter((skill) => {
        const skillName = skill.name.toLowerCase();

        return (
          normalizedInput.includes(skillName) ||
          (skill.description &&
            normalizedInput.includes(skill.description.toLowerCase()))
        );
      });

      return {
        mentor,
        matchingSkills
      };
    })
    .filter((candidate) => candidate.matchingSkills.length > 0)
    .sort(
      (a, b) => b.matchingSkills.length - a.matchingSkills.length
    )
    .slice(0, 3);

  const recommendations: RecommendedMentor[] = candidates.map(
    ({ mentor, matchingSkills }) => ({
      id: mentor.id,
      name: mentor.name,
      bio: mentor.bio,
      skills: mentor.skills.map((skill) => ({
        id: skill.id,
        name: skill.name
      })),
      matchScore: 90,
      matchReason: `This mentor has registered expertise in ${matchingSkills
        .map((skill) => skill.name)
        .join(', ')}, which directly matches part of your request.`
    })
  );

  if (recommendations.length === 0) {
    return {
      text:
        'I could not identify a direct skill match from your message. Try naming the technology or subject you want to learn, along with what you want to accomplish with it.',
      recommendations: [],
      mentorshipOwedNotice
    };
  }

  return {
    text: `I found ${recommendations.length} mentor${
      recommendations.length === 1 ? '' : 's'
    } whose registered skills directly match your request.`,
    recommendations,
    mentorshipOwedNotice
  };
}
