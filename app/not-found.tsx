import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function NotFound() {
  const session = await getSession();

  // If they are logged in and hit a URL that doesn't exist, route them to their respective dashboard
  if (session) {
    if (session.role === 'ADMIN') {
      redirect('/admin/dashboard');
    } else {
      redirect('/user/dashboard');
    }
  }

  // If they aren't logged in, send them to login
  redirect('/login');
}
