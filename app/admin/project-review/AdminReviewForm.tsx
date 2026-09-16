'use client';

import { useState } from 'react';
import { reviewProjectAsAdmin } from './actions';
import SubmitButton from '@/components/ui/SubmitButton';

interface AdminReviewFormProps {
  projectId: string;
}

export default function AdminReviewForm({ projectId }: AdminReviewFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleAction(formData: FormData) {
    setError(null);
    setSuccess(false);

    const result = await reviewProjectAsAdmin(projectId, formData);

    if (result?.error) {
      setError(result.error);
    } else {
      setSuccess(true);
    }
  }

  if (success) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-6 rounded-xl flex items-center gap-3">
        <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <span className="font-bold">Review submitted successfully!</span>
      </div>
    );
  }

  return (
    <form action={handleAction} className="space-y-6 mt-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      {error && <div className="p-4 bg-red-50 text-red-600 rounded-lg font-medium">{error}</div>}
      
      <div>
        <label className="block text-sm font-bold text-slate-900 mb-2">Admin Feedback / Internal Notes</label>
        <textarea 
          name="adminFeedback" 
          rows={3}
          className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-slate-900 outline-none"
          placeholder="Leave feedback for the student, or internal notes for other admins..."
        ></textarea>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <SubmitButton 
          name="action"
          value="REJECT"
          className="flex-1 bg-white border-2 border-slate-300 text-slate-700 hover:bg-slate-50 font-bold py-3 rounded-xl transition"
          loadingText="Rejecting..."
        >
          Reject (Cancel)
        </SubmitButton>
        <SubmitButton 
          name="action"
          value="REQUEST_CHANGES"
          className="flex-1 bg-white border-2 border-red-200 text-red-600 hover:bg-red-50 font-bold py-3 rounded-xl transition"
          loadingText="Requesting..."
        >
          Request Changes
        </SubmitButton>
        <SubmitButton 
          name="action"
          value="APPROVE"
          className="flex-1 bg-slate-900 hover:bg-black text-white font-bold py-3 rounded-xl transition"
          loadingText="Approving..."
        >
          Approve & Grant Skill
        </SubmitButton>
      </div>
    </form>
  );
}
