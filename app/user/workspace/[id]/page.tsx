import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Avatar from '@/components/ui/Avatar';
import WorkspaceForms from './WorkspaceForms'; // Client component for forms

export default async function WorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();

  if (!session) redirect('/login');

  // Fetch the mentorship and the associated project
  const mentorship = await prisma.mentorship.findUnique({
    where: { id },
    include: {
      mentee: { select: { id: true, name: true, email: true } },
      mentor: { select: { id: true, name: true, email: true } },
      skill: { select: { name: true } },
      projects: {
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    }
  });

  if (!mentorship) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold text-slate-800">Workspace not found</h1>
        <Link href="/user/dashboard" className="text-blue-600 mt-4 inline-block">Return to Dashboard</Link>
      </div>
    );
  }

  // Security check: Must be mentor or mentee
  if (mentorship.menteeId !== session.userId && mentorship.mentorId !== session.userId) {
    redirect('/user/dashboard');
  }

  const isMentor = mentorship.mentorId === session.userId;
  const counterpart = isMentor ? mentorship.mentee : mentorship.mentor;
  const project = mentorship.projects[0]; // Get the latest project submission (if any)

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      
      {/* HEADER SECTION */}
      <div className="bg-slate-900 rounded-3xl p-8 md:p-12 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -translate-x-1/2 translate-y-1/2"></div>
        
        <div className="relative z-10 space-y-4 text-center md:text-left">
          <Link href="/user/dashboard" className="text-indigo-300 hover:text-white transition-colors text-sm font-semibold uppercase tracking-wider flex items-center justify-center md:justify-start gap-1">
            &larr; Back to Dashboard
          </Link>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
            {mentorship.skill.name} Workspace
          </h1>
          <p className="text-slate-300 text-lg max-w-xl">
            {isMentor 
              ? `Review and guide ${counterpart.name}'s final project submission.` 
              : `Submit your final project to ${counterpart.name} for review.`
            }
          </p>
        </div>

        <div className="relative z-10 flex flex-col items-center bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/10 min-w-[200px]">
          <Avatar name={counterpart.name} />
          <h3 className="mt-4 font-bold text-xl">{counterpart.name}</h3>
          <p className="text-indigo-200 text-sm font-semibold uppercase tracking-widest mt-1">
            {isMentor ? 'Your Student' : 'Your Mentor'}
          </p>
        </div>
      </div>

      {/* STATUS & CONTENT SECTION */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 md:p-12">
        {!project ? (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900 border-b pb-4">Project Submission</h2>
            {isMentor ? (
              <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                <svg className="w-16 h-16 mx-auto text-slate-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-xl font-bold text-slate-700">Waiting for Submission</h3>
                <p className="text-slate-500 mt-2">Your student hasn't submitted their project yet.</p>
              </div>
            ) : (
              <WorkspaceForms 
                mode="SUBMIT" 
                mentorshipId={mentorship.id} 
              />
            )}
          </div>
        ) : (
          <div className="space-y-12">
            
            {/* Project Details View */}
            <div>
              <div className="flex items-center justify-between border-b pb-6 mb-6">
                <h2 className="text-3xl font-extrabold text-slate-900">{project.title}</h2>
                <span className={`px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider
                  ${project.status === 'SUBMITTED' ? 'bg-amber-100 text-amber-700' : ''}
                  ${project.status === 'MENTOR_APPROVED' ? 'bg-blue-100 text-blue-700' : ''}
                  ${project.status === 'ADMIN_APPROVED' ? 'bg-emerald-100 text-emerald-700' : ''}
                  ${project.status === 'CHANGES_REQUESTED' ? 'bg-red-100 text-red-700' : ''}
                `}>
                  {project.status.replace('_', ' ')}
                </span>
              </div>
              
              <div className="prose prose-slate max-w-none text-lg text-slate-700 mb-8">
                {project.description}
              </div>

              <div className="flex flex-wrap gap-4">
                <a href={project.githubUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl hover:bg-slate-800 transition">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                  View GitHub
                </a>
                {project.liveDemoUrl && (
                  <a href={project.liveDemoUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-blue-50 text-blue-700 border border-blue-200 px-6 py-3 rounded-xl hover:bg-blue-100 transition">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                    Live Demo
                  </a>
                )}
              </div>

              {/* Additional Links & Notes */}
              {project.additionalLinks && (
                <div className="mt-8 p-6 bg-slate-50 border border-slate-200 rounded-2xl">
                  <h4 className="text-sm font-bold text-slate-900 mb-2 uppercase tracking-wider flex items-center gap-2">
                    <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                    Additional Links & Notes
                  </h4>
                  <p className="text-slate-700 whitespace-pre-wrap">{project.additionalLinks}</p>
                </div>
              )}
            </div>

            {/* Mentor Feedback Display */}
            {project.mentorFeedback && (
              <div className={`p-6 rounded-2xl border ${project.status === 'CHANGES_REQUESTED' ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
                <h3 className={`font-bold mb-2 ${project.status === 'CHANGES_REQUESTED' ? 'text-red-900' : 'text-slate-900'}`}>Mentor Feedback</h3>
                <p className={project.status === 'CHANGES_REQUESTED' ? 'text-red-700' : 'text-slate-700'}>{project.mentorFeedback}</p>
              </div>
            )}

            {/* Role-Specific Actions */}
            {isMentor && project.status === 'SUBMITTED' && (
              <div>
                <h3 className="text-2xl font-bold text-slate-900 border-t pt-8 mb-6">Review Submission</h3>
                <WorkspaceForms 
                  mode="REVIEW" 
                  mentorshipId={mentorship.id} 
                  projectId={project.id} 
                />
              </div>
            )}

            {!isMentor && project.status === 'CHANGES_REQUESTED' && (
              <div>
                <h3 className="text-2xl font-bold text-slate-900 border-t pt-8 mb-6">Resubmit Project</h3>
                <WorkspaceForms 
                  mode="SUBMIT" 
                  mentorshipId={mentorship.id} 
                  initialData={project} 
                />
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
