'use client';

import { useState } from 'react';
import { updateRequestStatus } from './actions';

export default function RequestActions({ requestId }: { requestId: string }) {
  const [loadingAction, setLoadingAction] = useState<'ACCEPT' | 'REJECT' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAction = async (action: 'ACCEPT' | 'REJECT') => {
    setLoadingAction(action);
    setError(null);
    try {
      const result = await updateRequestStatus(requestId, action);
      if (result.error) {
        setError(result.error);
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div>
      <div className="flex gap-3">
        <button
          onClick={() => handleAction('ACCEPT')}
          disabled={loadingAction !== null}
          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 rounded-lg transition-colors disabled:bg-emerald-400"
        >
          {loadingAction === 'ACCEPT' ? '...' : 'Accept'}
        </button>
        <button
          onClick={() => handleAction('REJECT')}
          disabled={loadingAction !== null}
          className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 font-semibold py-2 rounded-lg transition-colors disabled:bg-slate-100 disabled:text-slate-400"
        >
          {loadingAction === 'REJECT' ? '...' : 'Reject'}
        </button>
      </div>
      {error && <p className="text-red-500 text-xs mt-2 text-center">{error}</p>}
    </div>
  );
}
