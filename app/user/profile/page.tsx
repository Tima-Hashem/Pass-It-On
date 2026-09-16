import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import ProfileForm from './ProfileForm';

export default async function ProfilePage() {
  const session = await getSession();
  if (!session || session.role !== 'STUDENT') {
    redirect('/login');
  }

  // Fetch full user profile including their earned certifications
  const profile = await prisma.user.findUnique({ 
    where: { id: session.userId },
    include: {
      certifications: {
        include: { skill: true }
      }
    }
  });

  if (!profile) redirect('/login');

  return (
    <div className="max-w-5xl mx-auto space-y-4 sm:space-y-8 pb-10 sm:pb-16">
      
      {/* --- HEADER --- */}
      <div className="border-b border-slate-200 pb-4 sm:pb-8 mt-2 sm:mt-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Your Profile</h1>
        <p className="text-slate-500 mt-1 sm:mt-2 text-sm sm:text-lg">Manage your public information and community settings.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 sm:gap-8">
        
        {/* --- LEFT COLUMN: SETTINGS FORM --- */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          <section className="bg-white/50 backdrop-blur-sm border border-slate-100 rounded-3xl shadow-sm p-4 sm:p-6 md:p-8">
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 mb-4 sm:mb-6 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              Edit Profile
            </h2>
            
            {/* Read-Only Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-200">
                <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Full Name</p>
                <p className="text-sm sm:text-base text-slate-900 font-semibold">{profile.name}</p>
              </div>
              <div className="bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-200">
                <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Email Address</p>
                <p className="text-sm sm:text-base text-slate-900 font-semibold truncate">{profile.email}</p>
              </div>
            </div>

            {/* Interactive Form */}
            <ProfileForm 
              initialBio={profile.bio} 
            />
          </section>
        </div>

        {/* --- RIGHT COLUMN: STATS & ACHIEVEMENTS --- */}
        <div className="space-y-4 sm:space-y-6">
          
          {/* Economy Stat */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-4 sm:p-6 text-white shadow-lg relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-white opacity-5 rounded-full blur-2xl"></div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Community Balance</h3>
            <div className="flex items-end gap-2 mb-3 sm:mb-4">
              <span className="text-4xl sm:text-5xl font-black">{profile.mentorshipsOwed}</span>
              <span className="text-sm sm:text-base text-slate-400 font-medium mb-1">Owed</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {profile.mentorshipsOwed > 0 
                ? `You need to mentor ${profile.mentorshipsOwed} more student${profile.mentorshipsOwed > 1 ? 's' : ''} to pay it forward before requesting another mentorship.`
                : "You have a perfect balance! You are free to request a new mentorship whenever you're ready."}
            </p>
          </div>

          {/* Certifications (Learned Skills) */}
          <div className="bg-white/50 backdrop-blur-sm border border-slate-100 rounded-3xl shadow-sm p-6">
            <h3 className="text-lg font-extrabold text-slate-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
              Earned Certifications
            </h3>
            
            {profile.certifications.length === 0 ? (
              <div className="text-center p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <p className="text-slate-500 text-sm">No certifications yet.</p>
                <p className="text-slate-400 text-xs mt-1">Complete a mentorship to earn one!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Render list of earned certifications with explicit typing */}
                {profile.certifications.map((cert: { id: string; skill: { name: string }; issueDate: Date }) => (
                  <div key={cert.id} className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                    <span className="font-bold text-emerald-900">{cert.skill.name}</span>
                    <span className="text-xs text-emerald-600 font-medium">
                      {cert.issueDate.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
}
