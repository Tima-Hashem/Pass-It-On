'use client'; // Required for Next.js to run this as a client component with hooks.

import { useActionState, useRef, useEffect } from 'react';
import { createStudentAction } from '../actions';

/**
 * Prop Interface definition ensuring we receive the correctly shaped skill array.
 */
interface CreateStudentFormProps {
  availableSkills: { id: string; name: string }[];
}

/**
 * CreateStudentForm Component
 * 
 * Renders the form used by administrators to manually create new student accounts.
 * Now includes a robust multi-select checkbox list so admins can assign initial skills.
 */
export default function CreateStudentForm({ availableSkills }: CreateStudentFormProps) {
  // ---------------------------------------------------------------------------
  // STATE & HOOKS
  // ---------------------------------------------------------------------------
  const [state, formAction, isPending] = useActionState(createStudentAction, null);
  const formRef = useRef<HTMLFormElement>(null);

  /**
   * Reset form fields safely after successful submission.
   * Executed via useEffect rather than during component render to comply with React 19 rules.
   */
  useEffect(() => {
    if (state?.success && formRef.current) {
      formRef.current.reset();
    }
  }, [state?.success]);

  // ---------------------------------------------------------------------------
  // RENDER UI
  // ---------------------------------------------------------------------------
  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      
      {/* NOTIFICATION BANNERS */}
      {state?.error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-md text-sm">
          {state.error}
        </div>
      )}
      
      {state?.success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 px-3 py-2 rounded-md text-sm">
          Student created successfully!
        </div>
      )}

      {/* --- CORE TEXT FIELDS --- */}
      <div>
        <label className="block text-sm font-medium mb-1 text-slate-700">Full Name</label>
        <input 
          name="name" type="text" required 
          className="w-full border border-slate-300 p-2 rounded-md text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
          placeholder="John Doe"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1 text-slate-700">Email Address</label>
        <input 
          name="email" type="email" required 
          className="w-full border border-slate-300 p-2 rounded-md text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
          placeholder="student@example.com"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1 text-slate-700">Temporary Password</label>
        <input 
          name="password" type="password" required 
          className="w-full border border-slate-300 p-2 rounded-md text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
          placeholder="pass123"
        />
      </div>

      {/* --- INITIAL SKILLS SELECTION --- */}
      {/* Administrators define the starting skills here. Users cannot modify this themselves later except through project submissions. */}
      <div>
        <label className="block text-sm font-medium mb-2 text-slate-700">Starting Skills (Optional)</label>
        <div className="bg-slate-50 border border-slate-200 rounded-md p-3 max-h-48 overflow-y-auto space-y-2">
          {availableSkills.length === 0 ? (
            <p className="text-sm text-slate-500 italic">No skills available in the database.</p>
          ) : (
            availableSkills.map((skill) => (
              <label key={skill.id} className="flex items-center space-x-2 cursor-pointer">
                {/* 
                  We use the same input name ('skills') for all checkboxes. 
                  FormData.getAll('skills') will capture an array of all checked values.
                */}
                <input 
                  type="checkbox" 
                  name="skills" 
                  value={skill.id} 
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700">{skill.name}</span>
              </label>
            ))
          )}
        </div>
        <p className="text-xs text-slate-500 mt-1">Students can only increase skills via successful project submissions.</p>
      </div>
      
      {/* --- SUBMIT BUTTON --- */}
      <button 
        type="submit" 
        disabled={isPending}
        className="w-full bg-slate-900 text-white p-2 rounded-md hover:bg-slate-800 disabled:bg-slate-700 flex justify-center mt-4"
      >
        {isPending ? 'Creating...' : 'Create Student'}
      </button>
    </form>
  );
}
