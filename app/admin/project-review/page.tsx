import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function ProjectReviewPage() {
  const session = await getSession();

  if (!session || session.role !== 'ADMIN') {
    redirect('/login');
  }

  // Fetch projects that are waiting for Admin Approval (MENTOR_APPROVED)
  // Also optionally fetch recently ADMIN_APPROVED ones to show a history
  const pendingProjects = await prisma.projectSubmission.findMany({
    where: { status: 'MENTOR_APPROVED' },
    include: {
      mentorship: {
        include: {
          mentee: { select: { name: true, email: true } },
          mentor: { select: { name: true, email: true } },
          skill: { select: { name: true } }
        }
      }
    },
    orderBy: { updatedAt: 'asc' } // Oldest waiting first
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Project Reviews</h1>
        <p className="text-slate-500 mt-2 text-lg max-w-3xl">
          Review projects that have been approved by mentors. Approving a project here officially grants the student their skill certification and adds it to their profile.
        </p>
      </div>

      {pendingProjects.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 shadow-sm text-center">
          <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-900">All caught up!</h2>
          <p className="text-slate-500 mt-2">There are currently no projects awaiting administrative review.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pendingProjects.map((project) => (
            <Link 
              key={project.id} 
              href={`/admin/project-review/${project.id}`}
              className="group bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all flex flex-col h-full relative overflow-hidden"
            >
              {/* Highlight bar */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
              
              <div className="flex-1">
                <div className="flex justify-between items-start mb-4">
                  <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wider">
                    {project.mentorship.skill.name}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    {new Date(project.updatedAt).toLocaleDateString()}
                  </span>
                </div>
                
                <h2 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">
                  {project.title}
                </h2>
                <p className="text-sm text-slate-500 line-clamp-2 mb-6">
                  {project.description}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 mt-auto">
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Mentee</p>
                    <p className="font-semibold text-slate-700">{project.mentorship.mentee.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400 font-medium">Mentor</p>
                    <p className="font-semibold text-slate-700">{project.mentorship.mentor.name}</p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
