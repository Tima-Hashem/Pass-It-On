import Avatar from '@/components/ui/Avatar';
import Link from 'next/link';

interface MentorshipCardProps {
  id: string;
  isMentor: boolean;
  counterpartName: string;
  skillName: string;
}

export default function ActiveMentorshipCard({ id, isMentor, counterpartName, skillName }: MentorshipCardProps) {
  const roleLabel = isMentor ? 'Mentoring' : 'Learning';
  const roleColor = isMentor ? 'from-emerald-500 to-teal-600' : 'from-orange-400 to-pink-500';

  return (
    <div className="group relative bg-white p-4 sm:p-6 rounded-3xl shadow-lg shadow-slate-200/50 border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col">
      <div className={`absolute top-0 right-0 w-20 h-20 sm:w-24 sm:h-24 rounded-bl-full rounded-tr-3xl bg-gradient-to-br ${roleColor} opacity-10 group-hover:opacity-20 transition-opacity`}></div>
      <div className="flex justify-between items-start mb-4 sm:mb-6 relative z-10">
        <span className={`text-[10px] sm:text-xs font-black px-2 sm:px-3 py-1 sm:py-1.5 rounded-full uppercase tracking-widest text-white bg-gradient-to-r ${roleColor} shadow-sm`}>
          {roleLabel}
        </span>
      </div>
      <div className="relative z-10 flex items-center gap-3 sm:gap-4 mb-4 flex-1">
        <Avatar name={counterpartName} />
        <div className="min-w-0">
          <p className="text-xs sm:text-sm text-slate-400 font-medium uppercase tracking-widest truncate">{skillName}</p>
          <h3 className="font-bold text-lg sm:text-xl text-slate-900 leading-tight truncate">{counterpartName}</h3>
        </div>
      </div>
      <Link 
        href={`/user/workspace/${id}`}
        className="w-full mt-auto block text-center bg-slate-50 hover:bg-slate-100 text-slate-600 font-semibold py-2 sm:py-2.5 text-sm sm:text-base rounded-xl transition-colors border border-slate-200"
      >
        Go to Project Workspace
      </Link>
    </div>
  );
}
