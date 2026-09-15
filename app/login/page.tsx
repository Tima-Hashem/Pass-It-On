import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import LoginForm from './LoginForm';

export default async function LoginPage() {
  const session = await getSession();
  
  if (session) {
    if (session.role === 'ADMIN') {
      redirect('/admin/dashboard');
    } else {
      redirect('/user/dashboard');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full p-8 bg-white shadow-lg rounded-xl border border-slate-100">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">PassItOn</h1>
          <p className="text-slate-500 mt-2">Sign in to your account</p>
        </div>
        
        <LoginForm />
      </div>
    </div>
  );
}
