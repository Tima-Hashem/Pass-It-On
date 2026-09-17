'use client';

import { useEffect } from 'react';
import { CheckCircle2, Sparkles } from 'lucide-react';

interface CelebrationPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CelebrationPopup({
  isOpen,
  onClose,
}: CelebrationPopupProps) {
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="relative mx-4 w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl">
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-12 w-12 text-green-600" />
        </div>

        <Sparkles className="absolute right-8 top-8 h-6 w-6 text-yellow-500" />

        <h2 className="mb-2 text-2xl font-bold text-gray-900">
          Mentorship Request Sent! 🎉
        </h2>

        <p className="text-gray-600">
          Great step forward! Your mentor will be notified and can respond to
          your request.
        </p>

        <button
          onClick={onClose}
          className="mt-6 rounded-xl bg-gray-900 px-6 py-3 font-medium text-white transition hover:bg-gray-800"
        >
          Continue
        </button>
      </div>
    </div>
  );
}