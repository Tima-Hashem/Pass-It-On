interface OutgoingRequestCardProps {
  id: string;
  mentorName: string;
  skillName: string;
  status: string;
  createdAt: Date;
}

export default function OutgoingRequestCard({ id, mentorName, skillName, status, createdAt }: OutgoingRequestCardProps) {
  return (
    <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
      <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto min-w-0">
        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 flex-shrink-0">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-slate-900 truncate">{mentorName}</h3>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider truncate">{skillName}</p>
        </div>
      </div>
      <div className="text-left sm:text-right flex flex-row sm:flex-col items-center sm:items-end gap-2 sm:gap-0 w-full sm:w-auto mt-2 sm:mt-0">
        <span className={`px-3 py-1 text-xs font-black rounded-full uppercase tracking-widest shadow-sm
          ${status === 'PENDING' ? 'bg-amber-50 text-amber-600 border border-amber-200' : ''}
          ${status === 'ACCEPTED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : ''}
          ${status === 'REJECTED' ? 'bg-red-50 text-red-600 border border-red-200' : ''}
        `}>
          {status}
        </span>
        <span className="text-[10px] text-slate-400 font-medium mt-1 uppercase">
          {createdAt.toLocaleDateString()}
        </span>
      </div>
    </div>
  );
}
