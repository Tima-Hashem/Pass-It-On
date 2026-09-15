export default function Avatar({ name }: { name: string }) {
  const initial = name ? name.charAt(0).toUpperCase() : '?';
  return (
    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-inner flex-shrink-0">
      {initial}
    </div>
  );
}
