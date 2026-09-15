import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) redirect('/login');

  let profile = null;
  if (session.role === 'ADMIN') {
    profile = await prisma.admin.findUnique({ where: { id: session.userId } });
  } else {
    profile = await prisma.user.findUnique({ where: { id: session.userId } });
  }

  if (!profile) redirect('/login');

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Your Profile</h1>
      <div className="bg-white shadow rounded-lg p-6 max-w-2xl">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <div className="mt-1 p-2 bg-gray-50 border rounded text-black">{profile.name}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <div className="mt-1 p-2 bg-gray-50 border rounded text-black">{profile.email}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Role / Status</label>
            <div className="mt-1 p-2 bg-gray-50 border rounded text-black font-semibold text-blue-600">
              {session.role === 'ADMIN' ? 'Administrator' : ('isAcceptingMentees' in profile && profile.isAcceptingMentees ? 'Eligible Mentor' : 'Student')}
            </div>
          </div>
          {session.role !== 'ADMIN' && 'bio' in profile && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Bio</label>
              <textarea 
                className="mt-1 block w-full border rounded-md shadow-sm p-2 text-black" 
                rows={4}
                defaultValue={(profile as any).bio || ''}
                placeholder="Tell us about yourself..."
              />
            </div>
          )}
          <button className="bg-blue-600 text-white px-4 py-2 rounded mt-4">Save Changes</button>
        </div>
      </div>
    </div>
  );
}
