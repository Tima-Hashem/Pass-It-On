import prisma from '@/lib/prisma';
import CreateStudentForm from './CreateStudentForm';

/**
 * Server Component: AdminDashboardPage
 * 
 * The main dashboard for administrators. Fetches the 10 most recent users
 * to display in the table, and fetches the full list of available skills
 * so the admin can assign them when creating a new student account.
 */
export default async function AdminDashboardPage() {
  // 1. Fetch recent users to populate the table
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: {
      userSkills: {
        include: { skill: true }
      }
    }
  });

  // 2. Fetch all globally available skills to populate the creation form checkboxes
  const availableSkills = await prisma.skill.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true }
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      
      {/* Create User Form Section */}
      <div className="col-span-1">
        <h2 className="text-2xl font-bold text-slate-900 mb-6 tracking-tight">Create Student</h2>
        <div className="bg-white shadow-sm border border-slate-200 rounded-xl p-6">
          {/* We pass the fetched skills to the Client Component form */}
          <CreateStudentForm availableSkills={availableSkills} />
        </div>
      </div>

      {/* Recent Users List */}
      <div className="col-span-1 md:col-span-2">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Students</h2>
        <div className="bg-white shadow rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Skills</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{u.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {u.userSkills && u.userSkills.length > 0 ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-emerald-100 text-emerald-800">
                        Mentor
                      </span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        Learner
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {u.skills.join(', ') || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="bg-gray-50 px-6 py-3 border-t">
            <p className="text-xs text-gray-500 text-center">Showing {users.length} most recent users</p>
          </div>
        </div>
      </div>
      
    </div>
  );
}
