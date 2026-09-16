'use server'

import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';

/**
 * Server Action: createStudentAction
 * 
 * Handles the creation of a new student/user account from the Admin Dashboard.
 * It validates inputs, ensures uniqueness of the email across both Admin and User tables,
 * securely hashes the temporary password, and saves the user to the database.
 * 
 * @param prevState - The previous state of the form action (required by React 19's useActionState).
 * @param formData - The submitted form data (name, email, password).
 * @returns An object with `success: true` or `error: string` for the client to display.
 */
export async function createStudentAction(prevState: any, formData: FormData) {
  // Extract the fields from the incoming form data
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const rawPassword = formData.get('password') as string;
  
  // Extract all selected skills (returns an array of skill IDs since we named all checkboxes 'skills')
  const selectedSkillIds = formData.getAll('skills') as string[];

  // ---------------------------------------------------------------------------
  // VALIDATION PHASE
  // ---------------------------------------------------------
  // Prevent empty submissions at the server level, even if frontend validation exists
  if (!name || !email || !rawPassword) {
    return { error: 'All fields are required.' };
  }

  // ---------------------------------------------------------------------------
  // UNIQUENESS CHECKS
  // ---------------------------------------------------------
  // 1. Check if a standard user already exists with this email
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: 'Email already exists.' };
  }

  // 2. Check if an admin already exists with this email (to prevent role collisions)
  const existingAdmin = await prisma.admin.findUnique({ where: { email } });
  if (existingAdmin) {
    return { error: 'Email already exists as an Admin.' };
  }

  // ---------------------------------------------------------------------------
  // USER CREATION
  // ---------------------------------------------------------
  try {
    // Hash the password securely using bcrypt with a salt factor of 10
    const passwordHash = await bcrypt.hash(rawPassword, 10);
    
    // Fetch the names of the skills selected to populate the literal array column
    const selectedSkills = await prisma.skill.findMany({
      where: { id: { in: selectedSkillIds } },
      select: { name: true }
    });
    const skillNamesList = selectedSkills.map(s => s.name);

    // We also map the selectedSkillIds into the UserSkill relation table AND populate the explicit array column.
    await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        skills: skillNamesList, // Direct array column of skill strings
        userSkills: {
          create: selectedSkillIds.map((skillId) => ({
            skill: { connect: { id: skillId } }
          }))
        }
      },
    });

    // Revalidate the admin dashboard path so Next.js clears the route cache
    // and fetches the newly created user for the UI table immediately.
    revalidatePath('/admin/dashboard');
    
    // Return success to the client component so it can reset the form fields
    return { success: true };
  } catch (error) {
    // Log the error for server diagnostics but return a clean error to the user
    console.error(error);
    return { error: 'An error occurred creating the user.' };
  }
}
