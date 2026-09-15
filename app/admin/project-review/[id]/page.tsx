import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import AdminReviewForm from '../AdminReviewForm';

export default async function SingleProjectReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();

  if (!session || session.role !== 'ADMIN') {
    redirect('/login');
  }

  const { id } = await params;

  const project = await prisma.projectSubmission.findUnique({
    where: { id },
    include: {
      mentorship: {
        include: {
          mentee: { select: { name: true, email: true } },
          mentor: { select: { name: true, email: true } },
          skill: { select: { name: true } }
        }
      }
    }
  });

  if (!project) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold text-slate-800">Project not found</h1>
        <Link href="/admin/project-review" className="text-blue-600 mt-4 inline-block">Return to Queue</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      
      {/* Header and Back Link */}
      <div>
        <Link href="/admin/project-review" className="text-indigo-600 hover:text-indigo-800 transition-colors text-sm font-semibold uppercase tracking-wider flex items-center gap-1 mb-6">
          &larr; Back to Pending Queue
        </Link>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Project Details</h1>
        <p className="text-slate-500 mt-2 text-lg">
          Review the submission carefully before granting the <strong className="text-slate-700">{project.mentorship.skill.name}</strong> skill certification.
        </p>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
        {/* Highlight bar based on status */}
        <div className={`absolute top-0 left-0 w-2 h-full 
          ${project.status === 'MENTOR_APPROVED' ? 'bg-blue-500' : 
            project.status === 'ADMIN_APPROVED' ? 'bg-emerald-500' : 'bg-slate-300'}`}>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 pl-4">
          
          {/* Left Side: Meta Info */}
          <div className="lg:w-1/3 space-y-6">
            <div>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Status</h3>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider inline-block
                  ${project.status === 'MENTOR_APPROVED' ? 'bg-blue-100 text-blue-700' : ''}
                  ${project.status === 'ADMIN_APPROVED' ? 'bg-emerald-100 text-emerald-700' : ''}
                  ${project.status === 'CHANGES_REQUESTED' ? 'bg-red-100 text-red-700' : ''}
                  ${project.status === 'REJECTED' ? 'bg-slate-100 text-slate-700' : ''}
                  ${project.status === 'SUBMITTED' ? 'bg-amber-100 text-amber-700' : ''}
                `}>
                  {project.status.replace('_', ' ')}
              </span>
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Skill Certification</h3>
              <p className="text-lg font-bold text-slate-900">{project.mentorship.skill.name}</p>
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Student (Mentee)</h3>
              <p className="font-semibold text-slate-800">{project.mentorship.mentee.name}</p>
              <p className="text-sm text-slate-500">{project.mentorship.mentee.email}</p>
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Approved By (Mentor)</h3>
              <p className="font-semibold text-slate-800">{project.mentorship.mentor.name}</p>
              <p className="text-sm text-slate-500">{project.mentorship.mentor.email}</p>
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Dates</h3>
              <p className="text-sm text-slate-500">Submitted: {new Date(project.createdAt).toLocaleDateString()}</p>
              <p className="text-sm text-slate-500">Last Update: {new Date(project.updatedAt).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Right Side: Project Content */}
          <div className="lg:w-2/3">
            <div className="border-b border-slate-100 pb-6 mb-6">
              <h2 className="text-2xl font-extrabold text-slate-900 mb-4">{project.title}</h2>
              <p className="text-slate-700 whitespace-pre-wrap">{project.description}</p>
              
              <div className="flex flex-wrap gap-4 mt-6">
                <a href={project.githubUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                  GitHub Repository
                </a>
                {project.liveDemoUrl && (
                  <a href={project.liveDemoUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold bg-blue-50 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-100 transition border border-blue-200">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                    Live Demo
                  </a>
                )}
              </div>
            </div>

            {/* Additional Links & Notes */}
            {project.additionalLinks && (
              <div className="mb-6 p-5 bg-slate-50 border border-slate-200 rounded-xl">
                <h4 className="text-sm font-bold text-slate-900 mb-2 uppercase tracking-wider flex items-center gap-2">
                  <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                  Additional Links & Notes
                </h4>
                <p className="text-slate-700 whitespace-pre-wrap">{project.additionalLinks}</p>
              </div>
            )}

            <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 mb-8">
              <h3 className="text-sm font-black text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                Mentor's Approval Notes
              </h3>
              <p className="text-blue-900 italic">"{project.mentorFeedback || 'No additional feedback provided.'}"</p>
            </div>

            {/* Admin Review Action Form - Only show if pending admin review */}
            {project.status === 'MENTOR_APPROVED' && (
              <AdminReviewForm projectId={project.id} />
            )}
            
          </div>
        </div>
      </div>
    </div>
  );
}
