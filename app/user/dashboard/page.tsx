import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';

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
  // DATA FETCHING (Sequential execution to prevent connection pool exhaustion)
  // ---------------------------------------------------------------------------
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { mentorshipsOwed: true }
  });

  const incomingRequests = await prisma.mentorshipRequest.findMany({
    where: { mentorId: userId, status: 'PENDING' },
    include: {
      mentee: { select: { name: true, email: true } },
      skill: { select: { name: true } }
    },
    orderBy: { createdAt: 'desc' }
  });

  const outgoingRequests = await prisma.mentorshipRequest.findMany({
    where: { menteeId: userId },
    include: {
      mentor: { select: { name: true } },
      skill: { select: { name: true } }
    },
    orderBy: { createdAt: 'desc' }
  });

  const activeMentorships = await prisma.mentorship.findMany({
    where: {
      OR: [
        { menteeId: userId },
        { mentorId: userId }
      ],
      // Must be actively ongoing and NOT have an approved project
      status: 'ACTIVE',
      projects: { none: { status: 'ADMIN_APPROVED' } }
    },
    include: {
      mentee: { select: { id: true, name: true, email: true } },
      mentor: { select: { id: true, name: true, email: true } },
      skill: { select: { name: true } }
    },
    orderBy: { createdAt: 'desc' }
  });

  const completedMentorships = await prisma.mentorship.findMany({
    where: {
      AND: [
        {
          OR: [
            { menteeId: userId },
            { mentorId: userId }
          ]
        },
        {
          OR: [
            { status: 'COMPLETED' },
            { projects: { some: { status: 'ADMIN_APPROVED' } } }
          ]
        }
      ]
    },
    include: {
      mentee: { select: { name: true } },
      mentor: { select: { name: true } },
      skill: { select: { name: true } },
      cert: true
    },
    orderBy: { updatedAt: 'desc' }
  });
  // ---------------------------------------------------------------------------
// DASHBOARD STATISTICS
// ---------------------------------------------------------------------------

const activeCount = activeMentorships.length;

const certificatesCount = completedMentorships.filter(
  (m) => m.mentorId !== userId && !!m.cert
).length;

const owedCount = currentUser?.mentorshipsOwed ?? 0;

const skillsTaughtCount = new Set(
  [...activeMentorships, ...completedMentorships]
    .filter((m) => m.mentorId === userId)
    .map((m) => m.skillId)
).size;

  // ---------------------------------------------------------------------------
  // RENDER UI
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-12 pb-16">
      {/* --- HEADER & ECONOMY STATUS --- */}
      <div className="border-b border-slate-200 pb-8 mt-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-slate-500 mt-2 text-lg">Manage your mentorship requests and active connections.</p>
        </div>
        
        {/* Mentorship Economy Widget */}
        {currentUser && currentUser.mentorshipsOwed > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-4 max-w-sm">
            <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-amber-900">Community Balance</p>
              <p className="text-xs text-amber-700 mt-1 leading-tight">
                You must mentor <strong>{currentUser.mentorshipsOwed}</strong> more student{currentUser.mentorshipsOwed > 1 ? 's' : ''} to pay it forward before requesting a new mentorship!
              </p>
            </div>
          </div>
        )}
      </div>
      {/* ---------------------------------------------------------------------------
          DASHBOARD STATISTICS
      --------------------------------------------------------------------------- */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">

        {/* Active Mentorships */}
<div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
  <div className="flex items-center justify-between">
    <div className="text-sm font-medium text-slate-500">
      Active Mentorships
    </div>
    <div className="text-2xl">⚡</div>
  </div>

  <div className="mt-2 text-3xl font-bold text-slate-900">
    {activeCount}
  </div>

  <p className="mt-1 text-xs text-slate-500">
    Currently in progress
  </p>
</div>

        {/* Certificates Earned */}
<div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
  <div className="flex items-center justify-between">
    <div className="text-sm font-medium text-slate-500">
      Certificates Earned
    </div>
    <div className="text-2xl">🎓</div>
  </div>

  <div className="mt-2 text-3xl font-bold text-slate-900">
    {certificatesCount}
  </div>

  <p className="mt-1 text-xs text-slate-500">
    Successfully completed
  </p>
</div>

        {/* Mentorships Owed */}
<div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
  <div className="flex items-center justify-between">
    <div className="text-sm font-medium text-slate-500">
      Mentorships Owed
    </div>
    <div className="text-2xl">🤝</div>
  </div>

  <div className="mt-2 text-3xl font-bold text-slate-900">
    {owedCount}
  </div>

  <p className="mt-1 text-xs text-slate-500">
    {owedCount === 0
      ? 'All caught up!'
      : 'Pledged to mentor peers'}
  </p>
</div>

        {/* Skills Taught */}
<div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
  <div className="flex items-center justify-between">
    <div className="text-sm font-medium text-slate-500">
      Skills Taught
    </div>
    <div className="text-2xl">🧑‍🏫</div>
  </div>

  <div className="mt-2 text-3xl font-bold text-slate-900">
    {skillsTaughtCount}
  </div>

  <p className="mt-1 text-xs text-slate-500">
    Different skills shared
  </p>
</div>

      </div>

      {/* --- ACTIVE MENTORSHIPS --- */}
      <section className="bg-white/50 backdrop-blur-sm border border-slate-100 rounded-3xl shadow-sm p-4 sm:p-6 md:p-8">
        <Link href="/user/search" className="inline-flex items-center gap-3 mb-4 sm:mb-6 hover:opacity-80 transition-opacity cursor-pointer group">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            Active Mentorships
            <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
              Browse skills &rarr;
            </span>
          </h2>
        </Link>

        {activeMentorships.length === 0 ? (
          <Link href="/user/search" className="block group/empty">
            <div className="group-hover/empty:bg-slate-50 transition-colors rounded-2xl border border-transparent group-hover/empty:border-slate-100 cursor-pointer">
              <EmptyState 
                title="No Active Mentorships" 
                description="You don't have any active mentorships yet. Click here to search for a skill and send a request!"
                icon={<svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>}
              />
            </div>
          </Link>
        ) : (
          <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
            {activeMentorships.map((m) => (
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

      {/* --- COMPLETED MENTORSHIPS --- */}
      {completedMentorships.length > 0 && (
        <section className="bg-indigo-50/50 border border-indigo-100 rounded-3xl p-4 sm:p-6 md:p-8">
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-indigo-900 tracking-tight">Completed Mentorships</h2>
          </div>
          <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
            {completedMentorships.map((m) => {
              const isMentor = m.mentorId === userId;
              
              return (
                <div key={m.id} className="bg-white border-2 border-indigo-100 rounded-xl p-4 sm:p-6 shadow-sm flex flex-col relative overflow-hidden">
                  {/* Decorative background accent */}
                  <div className="absolute -right-6 -top-6 w-24 h-24 bg-indigo-50 rounded-full opacity-50 pointer-events-none"></div>
                  <div className="relative">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-black text-lg sm:text-xl text-indigo-900">{m.skill.name}</h3>
                      <span className={`text-[10px] sm:text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wide ${isMentor ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {isMentor ? 'Taught' : 'Learned'}
                      </span>
                    </div>
                    
                    <p className="text-sm text-indigo-600/80 mb-3 sm:mb-4">
                      {isMentor ? `Mentored ${m.mentee.name}` : `Taught by ${m.mentor.name}`}
                    </p>
                    
                    {!isMentor && m.cert && (
                      <div className="flex items-center gap-2 mt-auto text-[10px] sm:text-xs font-bold text-slate-500 bg-slate-50 p-2 sm:p-3 rounded-lg border border-slate-100">
                        <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Certified on {m.cert.issueDate.toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <div className="grid lg:grid-cols-2 gap-4 sm:gap-8 mt-4 sm:mt-0">
        {/* --- INCOMING REQUESTS (For Mentors) --- */}
        <section className="bg-white/50 backdrop-blur-sm border border-slate-100 rounded-3xl shadow-sm p-4 sm:p-6 md:p-8">
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 13l-7 7-7-7m14-8l-7 7-7-7" /></svg>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">Incoming Requests</h2>
          </div>

          {incomingRequests.length === 0 ? (
            <EmptyState 
              title="Inbox Zero!" 
              description="You have no pending requests to mentor students right now."
              icon={<svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
            />
          ) : (
            <div className="space-y-3 sm:space-y-4">
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
        <section className="bg-white/50 backdrop-blur-sm border border-slate-100 rounded-3xl shadow-sm p-4 sm:p-6 md:p-8">
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 11l7-7 7 7M5 19l7-7 7 7" /></svg>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">My Requests</h2>
          </div>

          {outgoingRequests.length === 0 ? (
            <EmptyState 
              title="No Requests Sent" 
              description="You haven't reached out to any mentors yet. Search for a skill and send a request!"
              icon={<svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>}
            />
          ) : (
            <div className="space-y-3 sm:space-y-4">
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
