import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// ---------------------------------------------------------------------------
// ENVIRONMENT CONFIGURATION
// ---------------------------------------------------------------------------
// The secret used to cryptographically sign the JWTs. It should be securely
// defined in the .env file. We provide a fallback for local development.
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-fallback-key-change-in-prod';

/**
 * createToken
 * 
 * Generates a signed JSON Web Token containing the user's ID and role.
 * We use this to maintain stateless authentication across the application.
 * 
 * @param userId - The UUID of the user from the database.
 * @param role - The user's role (e.g., 'ADMIN' or 'STUDENT').
 * @returns A cryptographically signed JWT string.
 */
export async function createToken(userId: string, role: string) {
  // Sign the token to expire in 7 days to keep the user logged in for a week.
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '7d' });
}

/**
 * verifyToken
 * 
 * Decodes and verifies the authenticity of a provided JWT.
 * 
 * @param token - The JWT string retrieved from the cookie.
 * @returns The decoded payload (userId and role) if valid, or null if tampered/expired.
 */
export async function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
  } catch (error) {
    // If the token is expired or the signature is invalid, it throws an error.
    // We catch it and return null so the application knows the session is invalid.
    return null;
  }
}

/**
 * setAuthCookie
 * 
 * Attaches the JWT to an HTTP-only cookie on the client's browser.
 * This is highly secure as it prevents JavaScript (XSS attacks) from reading the token.
 * 
 * @param token - The signed JWT string.
 */
export async function setAuthCookie(token: string) {
  (await cookies()).set('auth_token', token, {
    httpOnly: true, // Prevents client-side JS from accessing the cookie
    secure: process.env.NODE_ENV === 'production', // Use HTTPS only in production
    sameSite: 'lax', // Protects against Cross-Site Request Forgery (CSRF)
    maxAge: 60 * 60 * 24 * 7, // 7 days in seconds to match the JWT expiration
    path: '/', // Ensure the cookie is sent for all routes in the application
  });
}

/**
 * logout
 * 
 * Clears the user's session by deleting the auth cookie.
 */
export async function logout() {
  (await cookies()).delete('auth_token');
}

/**
 * getSession
 * 
 * A utility function used across server components and layouts to retrieve
 * the current user's session data (userId, role) directly from the incoming cookies.
 * 
 * @returns The decoded token object if a valid session exists, otherwise null.
 */
export async function getSession() {
  const token = (await cookies()).get('auth_token')?.value;
  if (!token) return null;
  
  // Verify the token to ensure it hasn't expired or been tampered with
  return verifyToken(token);
}
