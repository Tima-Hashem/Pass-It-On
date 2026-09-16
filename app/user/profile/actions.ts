'use server';

import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function updateProfile(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== 'STUDENT') {
    return { error: 'Unauthorized' };
  }

  const bio = formData.get('bio') as string;

  try {
    await prisma.user.update({
      where: { id: session.userId },
      data: {
        bio: bio?.trim() || null
      }
    });

    revalidatePath('/user/profile');
    return { success: true };
  } catch (error) {
    console.error('Failed to update profile:', error);
    return { error: 'Failed to update profile. Please try again.' };
  }
}
