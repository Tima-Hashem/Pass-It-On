'use client'; // Marks this as a Client Component in Next.js, allowing the use of React hooks and interactivity.

import { useActionState } from 'react';
import { loginAction } from './actions';
import SubmitButton from '@/components/ui/SubmitButton';

/**
 * LoginForm Component
 * 
 * A client-side React component that renders the authentication form.
 * It uses the `useActionState` hook from React 19 to progressively enhance
 * the form submission, managing loading states and server-returned errors
 * without requiring manual fetch requests or full page reloads.
 */
export default function LoginForm() {
  // ---------------------------------------------------------------------------
  // STATE MANAGEMENT
  // ---------------------------------------------------------------------------
  // useActionState takes our server action (loginAction) and an initial state (null).
  // - state: The returned data from our server action (e.g., { error: "Invalid email" })
  // - formAction: The function we pass to the <form action={...}> handler
  // - isPending: A boolean that is strictly true while the server action is processing
  const [state, formAction, isPending] = useActionState(loginAction, null);

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------
  return (
    <form action={formAction} className="space-y-6">
      
      {/* 
        ERROR STATE RENDERING 
        If the server action returns an object with an `error` property, 
        we display it here in a styled red banner.
      */}
      {state?.error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
          {state.error}
        </div>
      )}
      
      {/* EMAIL INPUT FIELD */}
      <div>
        <label className="block text-sm font-medium mb-1 text-slate-700">Email Address</label>
        <input 
          name="email" 
          type="email" 
          required 
          // Styling: We use slate borders that transition to a blue ring when focused
          className="w-full border border-slate-300 p-3 rounded-md text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
          placeholder="student@example.com"
        />
      </div>
      
      {/* PASSWORD INPUT FIELD */}
      <div>
        <label className="block text-sm font-medium mb-1 text-slate-700">Password</label>
        <input 
          name="password" 
          type="password" 
          required 
          className="w-full border border-slate-300 p-3 rounded-md text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
          placeholder="••••••••"
        />
      </div>
      
      <SubmitButton 
        className="w-full bg-slate-900 text-white p-3 rounded-md font-semibold hover:bg-slate-800 transition-colors disabled:bg-slate-700"
      >
        Sign In
      </SubmitButton>
    </form>
  );
}
