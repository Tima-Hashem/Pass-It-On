'use client';

import { useState } from 'react';
import { updateProfile } from './actions';
import SubmitButton from '@/components/ui/SubmitButton';

interface ProfileFormProps {
  initialBio: string | null;
}

export default function ProfileForm({ initialBio }: ProfileFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleAction = async (formData: FormData) => {
    setError(null);
    setSuccess(false);
    
    const result = await updateProfile(formData);
    
    if (result?.error) {
      setError(result.error);
    } else {
      setSuccess(true);
      // clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    }
  };

  return (
    <form action={handleAction} className="space-y-6">
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-emerald-50 text-emerald-600 p-4 rounded-xl text-sm border border-emerald-100 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Profile updated successfully!
        </div>
      )}

      <div>
        <label className="block text-sm font-bold text-slate-700 mb-2">About Me (Bio)</label>
        <textarea 
          name="bio"
          className="w-full border border-slate-300 rounded-xl p-4 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none shadow-sm" 
          rows={5}
          defaultValue={initialBio || ''}
          placeholder="Tell the community about yourself, your goals, and what you are building..."
        />
      </div>

      <SubmitButton
        className="w-full bg-slate-900 hover:bg-black text-white font-bold py-4 rounded-xl transition-colors shadow-md"
        loadingText="Saving Changes..."
      >
        Save Changes
      </SubmitButton>
    </form>
  );
}
