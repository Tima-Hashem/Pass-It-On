'use server'

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createToken, setAuthCookie } from '@/lib/auth';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

/**
 * Server Action: loginAction
 * 
 * Handles the authentication process for both Admins and standard Users (Students/Mentors).
 * This function expects to be called via React 19's `useActionState` which provides
 * a `prevState` argument before the actual `formData`.
 * 
 * @param prevState - The previous state of the form action (required by useActionState)
 * @param formData - The submitted form data containing 'email' and 'password'
 * @returns An object containing an `error` string if authentication fails, otherwise it redirects.
 */
export async function loginAction(prevState: any, formData: FormData) {
  // Extract email and password from the submitted form data
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  // ---------------------------------------------------------
  // VALIDATION PHASE
  // ---------------------------------------------------------
  // Ensure both fields are provided before hitting the database
  if (!email || !password) {
    return { error: 'Missing credentials' };
  }

  // ---------------------------------------------------------
  // AUTHENTICATION PHASE 1: ADMIN CHECK
  // ---------------------------------------------------------
  // First, we check if the provided email belongs to an Administrator.
  const admin = await prisma.admin.findUnique({ where: { email } });
  
  // If an admin is found, securely compare the provided password against the hashed password
  if (admin && (await bcrypt.compare(password, admin.passwordHash))) {
    // Generate a JWT containing the admin's ID and explicitly set their role to 'ADMIN'
    const token = await createToken(admin.id, 'ADMIN');
    
    // Store the JWT securely in an httpOnly cookie valid for 7 days
    await setAuthCookie(token);
    
    // Immediately route the admin to their dedicated dashboard
    redirect('/admin/dashboard');
  }

  // ---------------------------------------------------------
  // AUTHENTICATION PHASE 2: STUDENT/USER CHECK
  // ---------------------------------------------------------
  // If the email wasn't an admin, we check the standard User table.
  const user = await prisma.user.findUnique({ where: { email } });
  
  // Similarly, verify the hashed password securely
  if (user && (await bcrypt.compare(password, user.passwordHash))) {
    // Generate a JWT for the student, tagging their role as 'STUDENT'
    const token = await createToken(user.id, 'STUDENT');
    
    // Set the secure cookie
    await setAuthCookie(token);
    
    // Route the standard user to the student-facing dashboard
    redirect('/user/dashboard');
  }

  // ---------------------------------------------------------
  // FAILURE FALLBACK
  // ---------------------------------------------------------
  // If neither the admin nor user tables produced a valid match, return a generic error.
  // We keep it generic ("Invalid email or password") to prevent email enumeration attacks.
  return { error: 'Invalid email or password' };
}
