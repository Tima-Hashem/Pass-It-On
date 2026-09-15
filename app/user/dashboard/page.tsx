import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';

import EmptyState from '@/components/ui/EmptyState';
import ActiveMentorshipCard from '@/components/cards/ActiveMentorshipCard';
import IncomingRequestCard from '@/components/cards/IncomingRequestCard';
import OutgoingRequestCard from '@/components/cards/OutgoingRequestCard';

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
            {mentorships.map((m) => (
              <ActiveMentorshipCard
                key={m.id}
                id={m.id}
                isMentor={m.mentorId === userId}
                counterpartName={m.mentorId === userId ? m.mentee.name : m.mentor.name}
                skillName={m.skill.name}
              />
            ))}
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
                <IncomingRequestCard
                  key={req.id}
                  id={req.id}
                  menteeName={req.mentee.name}
                  menteeEmail={req.mentee.email}
                  skillName={req.skill.name}
                />
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
                <OutgoingRequestCard
                  key={req.id}
                  id={req.id}
                  mentorName={req.mentor.name}
                  skillName={req.skill.name}
                  status={req.status}
                  createdAt={req.createdAt}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
