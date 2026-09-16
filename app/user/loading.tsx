export default function UserLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 w-full">
      {/* Sleek animated spinner */}
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-2xl border-4 border-slate-200 opacity-50"></div>
        <div className="absolute inset-0 rounded-2xl border-4 border-indigo-600 border-t-transparent animate-spin shadow-lg shadow-indigo-500/20"></div>
      </div>
      
      {/* Pulsing Text */}
      <p className="text-slate-400 font-bold tracking-widest uppercase text-sm animate-pulse">
        Loading...
      </p>
    </div>
  );
}
