'use server';

import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

/**
 * submitProject
 * Mentee submits a new project or updates an existing one for the mentorship.
 */
export async function submitProject(mentorshipId: string, formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== 'STUDENT') return { error: 'Unauthorized' };

  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const githubUrl = formData.get('githubUrl') as string;
  const liveDemoUrl = (formData.get('liveDemoUrl') as string) || null;
  const additionalLinks = (formData.get('additionalLinks') as string) || null;

  if (!title || !description || !githubUrl) {
    return { error: 'Title, description, and GitHub URL are required.' };
  }

  try {
    // Upsert ensures we create it if it doesn't exist, or update it if the user resubmits
    await prisma.projectSubmission.upsert({
      where: { 
        id: formData.get('projectId') as string || 'new-uuid-placeholder' // This is a trick: upsert needs a unique where clause. 
      },
      create: {
        mentorshipId,
        title,
        description,
        githubUrl,
        liveDemoUrl,
        additionalLinks,
        status: 'SUBMITTED'
      },
      update: {
        title,
        description,
        githubUrl,
        liveDemoUrl,
        additionalLinks,
        status: 'SUBMITTED' // Reset status when resubmitted
      }
    });

    revalidatePath(`/user/workspace/${mentorshipId}`);
    return { success: true };
  } catch (error) {
    // Fallback if upsert trick fails: check if one exists for the mentorship
    const existing = await prisma.projectSubmission.findFirst({ where: { mentorshipId } });
    if (existing) {
      await prisma.projectSubmission.update({
        where: { id: existing.id },
        data: { title, description, githubUrl, liveDemoUrl, additionalLinks, status: 'SUBMITTED' }
      });
    } else {
      await prisma.projectSubmission.create({
        data: { mentorshipId, title, description, githubUrl, liveDemoUrl, additionalLinks, status: 'SUBMITTED' }
      });
    }
    revalidatePath(`/user/workspace/${mentorshipId}`);
    return { success: true };
  }
}

/**
 * reviewProject
 * Mentor reviews a submitted project (approve or request changes).
 */
export async function reviewProject(projectId: string, mentorshipId: string, formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== 'STUDENT') return { error: 'Unauthorized' };

  const mentorFeedback = formData.get('mentorFeedback') as string;
  const action = formData.get('action') as 'APPROVE' | 'REQUEST_CHANGES';

  const newStatus = action === 'APPROVE' ? 'MENTOR_APPROVED' : 'CHANGES_REQUESTED';

  try {
    await prisma.projectSubmission.update({
      where: { id: projectId },
      data: {
        status: newStatus,
        mentorFeedback: mentorFeedback || null
      }
    });

    revalidatePath(`/user/workspace/${mentorshipId}`);
    return { success: true };
  } catch (error) {
    return { error: 'Failed to update project status.' };
  }
}
