'use client';

import { useState } from 'react';
import { submitProject, reviewProject } from './actions';
import SubmitButton from '@/components/ui/SubmitButton';

interface WorkspaceFormsProps {
  mode: 'SUBMIT' | 'REVIEW';
  mentorshipId: string;
  projectId?: string;
  initialData?: any;
}

export default function WorkspaceForms({ mode, mentorshipId, projectId, initialData }: WorkspaceFormsProps) {
  const [error, setError] = useState<string | null>(null);

  async function handleAction(formData: FormData) {
    setError(null);

    let result;
    if (mode === 'SUBMIT') {
      if (initialData?.id) {
        formData.append('projectId', initialData.id);
      }
      result = await submitProject(mentorshipId, formData);
    } else {
      if (!projectId) return;
      result = await reviewProject(projectId, mentorshipId, formData);
    }

    if (result?.error) {
      setError(result.error);
    }
  }

  if (mode === 'SUBMIT') {
    return (
      <form action={handleAction} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-lg">{error}</div>
        )}

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">
            Project Title *
          </label>
          <input
            type="text"
            name="title"
            required
            defaultValue={initialData?.title}
            className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none"
            placeholder="e.g., E-commerce Dashboard in React"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">
            Project Description *
          </label>
          <textarea
            name="description"
            required
            rows={5}
            defaultValue={initialData?.description}
            className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none"
            placeholder="Explain what you built, the challenges you faced, and what you learned."
          ></textarea>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              GitHub Repository URL *
            </label>
            <input
              type="url"
              name="githubUrl"
              required
              defaultValue={initialData?.githubUrl}
              className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="https://github.com/yourusername/repo"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Live Demo URL (Optional)
            </label>
            <input
              type="url"
              name="liveDemoUrl"
              defaultValue={initialData?.liveDemoUrl}
              className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="https://your-project.vercel.app"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">
            Additional Links or Notes (Optional)
          </label>
          <textarea
            name="additionalLinks"
            rows={3}
            defaultValue={initialData?.additionalLinks}
            className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none"
            placeholder="youtube link for the project : https://www.youtube.com/my-project-explanation"
          ></textarea>
        </div>

        <SubmitButton
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl transition"
          loadingText="Submitting..."
        >
          {initialData ? "Resubmit Project" : "Submit Final Project"}
        </SubmitButton>
      </form>
    );
  }

  // REVIEW MODE
  return (
    <form action={handleAction} className="space-y-6">
      {error && <div className="p-4 bg-red-50 text-red-600 rounded-lg">{error}</div>}
      
      <div>
        <label className="block text-sm font-bold text-slate-700 mb-2">Constructive Feedback</label>
        <textarea 
          name="mentorFeedback" 
          required 
          rows={4}
          className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none"
          placeholder="Provide helpful feedback on their code, architecture, and UI..."
        ></textarea>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <SubmitButton 
          name="action"
          value="REQUEST_CHANGES"
          className="flex-1 bg-white border-2 border-red-200 text-red-600 hover:bg-red-50 font-bold py-4 rounded-xl transition"
          loadingText="Requesting..."
        >
          Request Changes
        </SubmitButton>
        <SubmitButton 
          name="action"
          value="APPROVE"
          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl transition"
          loadingText="Approving..."
        >
          Approve Project
        </SubmitButton>
      </div>
    </form>
  );
}
