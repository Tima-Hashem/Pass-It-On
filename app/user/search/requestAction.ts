'use server';

import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

/**
 * Server Action: requestMentorship
 * 
 * Creates a new MentorshipRequest for a specific mentor and skill.
 */
export async function requestMentorship(mentorId: string, skillId: string) {
  // 1. Authenticate user
  const session = await getSession();
  if (!session || session.role !== 'STUDENT') {
    return { error: 'You must be logged in as a student to request mentorship.' };
  }
  
  const menteeId = session.userId;
  
  // Prevent requesting yourself
  if (menteeId === mentorId) {
    return { error: 'You cannot request mentorship from yourself.' };
  }

  try {
    // 1.5 Check the Mentorship Economy rule
    const user = await prisma.user.findUnique({
      where: { id: menteeId },
      select: { mentorshipsOwed: true }
    });

    if (user && user.mentorshipsOwed > 1) {
      return { error: `You must mentor ${user.mentorshipsOwed} more students before you can request another mentorship.` };
    }

    // 2. Check if a request already exists between these two for this skill
    const existing = await prisma.mentorshipRequest.findUnique({
      where: {
        menteeId_mentorId_skillId: {
          menteeId,
          mentorId,
          skillId
        }
      }
    });

    if (existing) {
      if (existing.status === 'PENDING') return { error: 'You already have a pending request for this mentor and skill.' };
      if (existing.status === 'ACCEPTED') return { error: 'This mentor has already accepted your request.' };
    }

    // 3. Create the request
    await prisma.mentorshipRequest.create({
      data: {
        menteeId,
        mentorId,
        skillId,
        status: 'PENDING'
      }
    });

    // Revalidate paths if necessary (e.g., if we were showing a "Request Sent" state on search)
    // We will handle the UI state in the client component though.
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: 'An unexpected error occurred while requesting mentorship.' };
  }
}
