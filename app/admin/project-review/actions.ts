'use server';

import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

/**
 * reviewProjectAsAdmin
 * Admin reviews a MENTOR_APPROVED project.
 * If approved, grants the Skill and Certification to the mentee.
 */
export async function reviewProjectAsAdmin(projectId: string, formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return { error: 'Unauthorized' };

  const adminFeedback = formData.get('adminFeedback') as string;
  const action = formData.get('action') as 'APPROVE' | 'REQUEST_CHANGES' | 'REJECT';

  try {
    // Determine the new status
    let newStatus: 'ADMIN_APPROVED' | 'CHANGES_REQUESTED' | 'REJECTED';
    if (action === 'APPROVE') newStatus = 'ADMIN_APPROVED';
    else if (action === 'REQUEST_CHANGES') newStatus = 'CHANGES_REQUESTED';
    else newStatus = 'REJECTED';

    // Update the project
    const updatedProject = await prisma.projectSubmission.update({
      where: { id: projectId },
      data: {
        status: newStatus,
        adminFeedback: adminFeedback || null
      },
      include: {
        mentorship: true
      }
    });

    // If Admin approves, grant the skill and certification to the mentee
    if (newStatus === 'ADMIN_APPROVED') {
      const { menteeId, skillId, id: mentorshipId } = updatedProject.mentorship;

      // 1. Grant the UserSkill (Upsert to avoid duplicates if they already have it)
      await prisma.userSkill.upsert({
        where: { userId_skillId: { userId: menteeId, skillId: skillId } },
        create: { userId: menteeId, skillId: skillId },
        update: {} // do nothing if it already exists
      });

      // 2. Issue the Certification (Upsert to avoid dupes)
      await prisma.certification.upsert({
        where: { mentorshipId: mentorshipId },
        create: {
          userId: menteeId,
          skillId: skillId,
          mentorshipId: mentorshipId
        },
        update: {}
      });

      // 3. Complete the Mentorship
      await prisma.mentorship.update({
        where: { id: mentorshipId },
        data: { status: 'COMPLETED' }
      });

      // 4. Update the Mentorship Economy (Owed Balances)
      // Mentee receives a mentorship, they now owe +2
      await prisma.user.update({
        where: { id: menteeId },
        data: { mentorshipsOwed: { increment: 2 } }
      });

      // Mentor provided a mentorship, they owe -1 (we can enforce a floor in code if needed, but Prisma atomic decrement is easy. Let's fetch current to prevent negative)
      const mentorData = await prisma.user.findUnique({ where: { id: updatedProject.mentorship.mentorId }, select: { mentorshipsOwed: true } });
      if (mentorData && mentorData.mentorshipsOwed > 0) {
        await prisma.user.update({
          where: { id: updatedProject.mentorship.mentorId },
          data: { mentorshipsOwed: { decrement: 1 } }
        });
      }
    }

    revalidatePath('/admin/project-review');
    // We do not redirect here because it throws an error that would be caught by catch block
  } catch (error: any) {
    console.error("Admin review error:", error);
    return { error: 'Failed to update project status. Please try again.' };
  }

  // Redirect must be called outside try-catch
  redirect('/admin/project-review');
}
