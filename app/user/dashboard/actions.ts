'use server';

import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

/**
 * Server Action: updateRequestStatus
 * 
 * Allows a mentor to accept or reject an incoming mentorship request.
 * If accepted, it automatically creates the actual Mentorship record.
 */
export async function updateRequestStatus(requestId: string, action: 'ACCEPT' | 'REJECT') {
  const session = await getSession();
  if (!session || session.role !== 'STUDENT') {
    return { error: 'Unauthorized.' };
  }
  
  try {
    // Ensure the request exists and belongs to the logged-in mentor
    const request = await prisma.mentorshipRequest.findUnique({
      where: { id: requestId }
    });

    if (!request) return { error: 'Request not found.' };
    if (request.mentorId !== session.userId) return { error: 'You are not the mentor for this request.' };
    if (request.status !== 'PENDING') return { error: 'This request has already been processed.' };

    if (action === 'REJECT') {
      await prisma.mentorshipRequest.update({
        where: { id: requestId },
        data: { status: 'REJECTED' }
      });
    } else if (action === 'ACCEPT') {
      // Execute in a transaction to ensure both operations succeed or fail together
      await prisma.$transaction([
        prisma.mentorshipRequest.update({
          where: { id: requestId },
          data: { status: 'ACCEPTED' }
        }),
        prisma.mentorship.create({
          data: {
            menteeId: request.menteeId,
            mentorId: request.mentorId,
            skillId: request.skillId
          }
        })
      ]);
    }

    revalidatePath('/user/dashboard');
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: 'Failed to process request.' };
  }
}
