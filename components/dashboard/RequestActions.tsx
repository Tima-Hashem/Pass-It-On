'use client';

import { useState } from 'react';
import { updateRequestStatus } from '@/app/user/dashboard/actions';
import SubmitButton from '@/components/ui/SubmitButton';

export default function RequestActions({ requestId }: { requestId: string }) {
  const [error, setError] = useState<string | null>(null);

  const handleFormAction = async (formData: FormData) => {
    setError(null);
    const action = formData.get('action') as 'ACCEPT' | 'REJECT';
    try {
      const result = await updateRequestStatus(requestId, action);
      if (result.error) {
        setError(result.error);
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    }
  };

  return (
    <form action={handleFormAction}>
      <div className="flex gap-3">
        <SubmitButton
          name="action"
          value="ACCEPT"
          loadingText="..."
          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 rounded-lg transition-colors"
        >
          Accept
        </SubmitButton>
        <SubmitButton
          name="action"
          value="REJECT"
          loadingText="..."
          className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 font-semibold py-2 rounded-lg transition-colors"
        >
          Reject
        </SubmitButton>
      </div>
      {error && <p className="text-red-500 text-xs mt-2 text-center">{error}</p>}
    </form>
  );
}
