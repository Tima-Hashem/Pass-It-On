'use server';

import prisma from '@/lib/prisma';

/**
 * Server Action: fetchMentorsBySkill
 * 
 * Fetches a paginated list of mentors for a specific skill.
 * We use this both for the initial server render and for the "Load More" button on the client.
 * 
 * @param skillId - The UUID of the selected skill
 * @param skip - How many records to skip (for pagination)
 * @param take - How many records to return (defaults to 10)
 */
export async function fetchMentorsBySkill(skillId: string, skip: number = 0, take: number = 10) {
  const mentors = await prisma.user.findMany({
    where: {
      isAcceptingMentees: true,
      userSkills: {
        some: { skillId }
      }
    },
    include: {
      userSkills: {
        include: { skill: true }
      }
    },
    // We order by creation date so the pagination remains stable
    orderBy: { createdAt: 'desc' },
    skip,
    take,
  });
  
  return mentors;
}
