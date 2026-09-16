import Avatar from '@/components/ui/Avatar';
import RequestActions from '@/components/dashboard/RequestActions';

interface IncomingRequestCardProps {
  id: string;
  menteeName: string;
  menteeEmail: string;
  skillName: string;
}

export default function IncomingRequestCard({ id, menteeName, menteeEmail, skillName }: IncomingRequestCardProps) {
  return (
    <div className="bg-white p-4 sm:p-6 rounded-3xl shadow-sm border border-slate-200 hover:border-blue-300 transition-colors flex flex-col sm:flex-row gap-4 sm:gap-6 items-center justify-between">
      <div className="flex items-center gap-4 w-full min-w-0">
        <Avatar name={menteeName} />
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-slate-900 text-lg leading-tight truncate">{menteeName}</h3>
          <p className="text-sm text-slate-500 font-medium truncate">{menteeEmail}</p>
          <p className="text-xs text-blue-600 font-bold uppercase tracking-wider mt-1 bg-blue-50 inline-block px-2 py-0.5 rounded-md truncate max-w-full">
            {skillName} Mentorship
          </p>
        </div>
      </div>
      <div className="w-full sm:w-auto flex-shrink-0">
        <RequestActions requestId={id} />
      </div>
    </div>
  );
}
