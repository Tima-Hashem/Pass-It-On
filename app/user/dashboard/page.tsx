import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import RequestActions from './RequestActions';

// ---------------------------------------------------------------------------
// HELPER COMPONENTS FOR MODERN UI
// ---------------------------------------------------------------------------
const EmptyState = ({ title, description, icon }: { title: string, description: string, icon: React.ReactNode }) => (
  <div className="flex flex-col items-center justify-center p-8 text-center">
    <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4">
      {icon}
    </div>
    <h3 className="text-xl font-bold text-slate-800 tracking-tight">{title}</h3>
    <p className="text-slate-500 mt-2 max-w-sm">{description}</p>
  </div>
);

const Avatar = ({ name }: { name: string }) => {
  const initial = name ? name.charAt(0).toUpperCase() : '?';
  return (
    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-inner flex-shrink-0">
      {initial}
    </div>
  );
};

export default async function DashboardPage() {
  const session = await getSession();
  if (!session || session.role !== 'STUDENT') {
    redirect('/login');
  }

  const userId = session.userId;

  // ---------------------------------------------------------------------------
  // DATA FETCHING (Optimized with Promise.all for concurrent execution)
  // ---------------------------------------------------------------------------
  const [incomingRequests, outgoingRequests, mentorships] = await Promise.all([
    prisma.mentorshipRequest.findMany({
      where: { mentorId: userId, status: 'PENDING' },
      include: {
        mentee: { select: { name: true, email: true } },
        skill: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.mentorshipRequest.findMany({
      where: { menteeId: userId },
      include: {
        mentor: { select: { name: true } },
        skill: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.mentorship.findMany({
      where: {
        OR: [
          { menteeId: userId },
          { mentorId: userId }
        ]
      },
      include: {
        mentee: { select: { id: true, name: true, email: true } },
        mentor: { select: { id: true, name: true, email: true } },
        skill: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    })
  ]);

  // ---------------------------------------------------------------------------
  // RENDER UI
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-12 pb-16">
      {/* --- HEADER --- */}
      <div className="border-b border-slate-200 pb-8 mt-4">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Dashboard</h1>
        <p className="text-slate-500 mt-2 text-lg">Manage your mentorship requests and active connections.</p>
      </div>

      {/* --- ACTIVE MENTORSHIPS --- */}
      <section className="bg-white/50 backdrop-blur-sm border border-slate-100 rounded-3xl shadow-sm p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Active Mentorships</h2>
        </div>

        {mentorships.length === 0 ? (
          <EmptyState 
            title="No Active Mentorships" 
            description="You don't have any active mentorships yet. Start by sending a request or accepting one!"
            icon={<svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>}
          />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {mentorships.map((m) => {
              const isMentor = m.mentorId === userId;
              const counterpart = isMentor ? m.mentee : m.mentor;
              const roleLabel = isMentor ? 'Mentoring' : 'Learning';
              const roleColor = isMentor ? 'from-emerald-500 to-teal-600' : 'from-orange-400 to-pink-500';

              return (
                <div key={m.id} className="group relative bg-white p-6 rounded-3xl shadow-lg shadow-slate-200/50 border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  <div className={`absolute top-0 right-0 w-24 h-24 rounded-bl-full rounded-tr-3xl bg-gradient-to-br ${roleColor} opacity-10 group-hover:opacity-20 transition-opacity`}></div>
                  <div className="flex justify-between items-start mb-6 relative z-10">
                    <span className={`text-xs font-black px-3 py-1.5 rounded-full uppercase tracking-widest text-white bg-gradient-to-r ${roleColor} shadow-sm`}>
                      {roleLabel}
                    </span>
                  </div>
                  <div className="relative z-10 flex items-center gap-4 mb-4">
                    <Avatar name={counterpart.name} />
                    <div>
                      <p className="text-sm text-slate-400 font-medium uppercase tracking-widest">{m.skill.name}</p>
                      <h3 className="font-bold text-xl text-slate-900 leading-tight">{counterpart.name}</h3>
                    </div>
                  </div>
                  <button className="w-full mt-2 bg-slate-50 hover:bg-slate-100 text-slate-600 font-semibold py-2.5 rounded-xl transition-colors border border-slate-200">
                    Go to Project Workspace
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* --- INCOMING REQUESTS (For Mentors) --- */}
        <section className="bg-white/50 backdrop-blur-sm border border-slate-100 rounded-3xl shadow-sm p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 13l-7 7-7-7m14-8l-7 7-7-7" /></svg>
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Incoming Requests</h2>
          </div>

          {incomingRequests.length === 0 ? (
            <EmptyState 
              title="Inbox Zero!" 
              description="You have no pending requests to mentor students right now."
              icon={<svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
            />
          ) : (
            <div className="space-y-4">
              {incomingRequests.map((req) => (
                <div key={req.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 hover:border-blue-300 transition-colors flex flex-col sm:flex-row gap-6 items-center justify-between">
                  <div className="flex items-center gap-4 w-full">
                    <Avatar name={req.mentee.name} />
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg leading-tight">{req.mentee.name}</h3>
                      <p className="text-sm text-slate-500 font-medium">{req.mentee.email}</p>
                      <p className="text-xs text-blue-600 font-bold uppercase tracking-wider mt-1 bg-blue-50 inline-block px-2 py-0.5 rounded-md">
                        {req.skill.name} Mentorship
                      </p>
                    </div>
                  </div>
                  <div className="w-full sm:w-auto flex-shrink-0">
                    <RequestActions requestId={req.id} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* --- OUTGOING REQUESTS (For Mentees) --- */}
        <section className="bg-white/50 backdrop-blur-sm border border-slate-100 rounded-3xl shadow-sm p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 11l7-7 7 7M5 19l7-7 7 7" /></svg>
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">My Requests</h2>
          </div>

          {outgoingRequests.length === 0 ? (
            <EmptyState 
              title="No Requests Sent" 
              description="You haven't reached out to any mentors yet. Search for a skill and send a request!"
              icon={<svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>}
            />
          ) : (
            <div className="space-y-4">
              {outgoingRequests.map((req) => (
                <div key={req.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">{req.mentor.name}</h3>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{req.skill.name}</p>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <span className={`px-3 py-1 text-xs font-black rounded-full uppercase tracking-widest shadow-sm
                      ${req.status === 'PENDING' ? 'bg-amber-50 text-amber-600 border border-amber-200' : ''}
                      ${req.status === 'ACCEPTED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : ''}
                      ${req.status === 'REJECTED' ? 'bg-red-50 text-red-600 border border-red-200' : ''}
                    `}>
                      {req.status}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium mt-1 uppercase">
                      {req.createdAt.toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
