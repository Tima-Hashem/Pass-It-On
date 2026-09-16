export default function GlobalLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen space-y-6 w-full bg-slate-100">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-2xl border-4 border-slate-200 opacity-50"></div>
        <div className="absolute inset-0 rounded-2xl border-4 border-indigo-600 border-t-transparent animate-spin shadow-lg shadow-indigo-500/20"></div>
      </div>
      <p className="text-slate-400 font-bold tracking-widest uppercase text-sm animate-pulse">
        Loading PassItOn...
      </p>
    </div>
  );
}
