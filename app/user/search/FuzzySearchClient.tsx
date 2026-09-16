'use client'; // Client Component for interactivity and hooks

import { useState, useMemo, useTransition } from 'react';
import Fuse from 'fuse.js';
import { useRouter, useSearchParams } from 'next/navigation';

/**
 * TypeScript Interfaces
 * Defines the shape of the data we expect from the server to ensure type safety.
 */
interface Skill {
  id: string;
  name: string;
  description: string | null;
}

interface FuzzySearchClientProps {
  skills: Skill[];
}

/**
 * FuzzySearchClient Component
 * 
 * This component provides a real-time, fuzzy search experience for skills.
 * It uses 'fuse.js' to tolerate typos and partial matches.
 * 
 * @param skills - The complete list of skills fetched from the server.
 */
export default function FuzzySearchClient({ skills }: FuzzySearchClientProps) {
  // ---------------------------------------------------------------------------
  // HOOKS & STATE
  // ---------------------------------------------------------------------------
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // useTransition allows us to track the loading state of server navigations
  const [isPending, startTransition] = useTransition();
  
  // We read the current skillId from the URL to visually highlight the active selection
  const currentSkillId = searchParams.get('skillId');

  // Local state to store the user's current search query
  const [query, setQuery] = useState('');

  // ---------------------------------------------------------------------------
  // FUZZY SEARCH INITIALIZATION
  // ---------------------------------------------------------------------------
  // useMemo ensures we only configure the Fuse instance once, preventing performance
  // hits on every re-render. We configure it to search specifically the 'name' field.
  const fuse = useMemo(() => {
    return new Fuse(skills, {
      keys: ['name', 'description'], // Search across both name and description
      threshold: 0.6, // Increased threshold for "extra fuzz"
      includeScore: true,
    });
  }, [skills]);

  // ---------------------------------------------------------------------------
  // SEARCH EXECUTION
  // ---------------------------------------------------------------------------
  // If the user has typed something, we run the fuzzy search.
  // Otherwise, we just return the first 5 skills as suggestions.
  // Results are strictly limited to a maximum of 5 items for a cleaner UI.
  const searchResults = useMemo(() => {
    if (!query) {
      return skills.slice(0, 5).map(skill => ({ item: skill }));
    }
    return fuse.search(query).slice(0, 5);
  }, [query, fuse, skills]);

  // ---------------------------------------------------------------------------
  // HANDLERS
  // ---------------------------------------------------------------------------
  /**
   * Handles clicking on a skill. It updates the URL with the selected skill ID,
   * which triggers the server component (page.tsx) to fetch the mentors for that skill.
   */
  const handleSelectSkill = (skillId: string) => {
    startTransition(() => {
      router.push(`/user/search?skillId=${skillId}#mentors-section`);
    });
  };

  // ---------------------------------------------------------------------------
  // RENDER UI
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* 
        SEARCH INPUT & MATCHMAKER ROW
        We wrap the search input and the new Matchmaker button in a flex container.
        On small screens (mobile), they stack vertically (flex-col). On larger screens (sm:flex-row), they sit side-by-side.
      */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        
        {/* Search Input Container - takes up remaining space (flex-1) */}
        <div className="relative flex-1">
          <label htmlFor="search" className="sr-only">Search Skills</label>
          <input 
            id="search"
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. React, Python, Figma..." 
            className="w-full border border-slate-300 p-3 sm:p-4 rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm text-base sm:text-lg pl-4 pr-12"
          />
          <div className="absolute right-4 top-3 sm:top-4 text-slate-400 pointer-events-none">
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* 
          AI Matchmaker Button 
          Routes the user to the dedicated ChatGPT-like UI for AI matchmaking.
          It uses a subtle gradient and a sparkle icon to indicate "AI/Magic".
        */}
        <button
          onClick={() => router.push('/user/matchmaker')}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-base sm:text-lg px-4 py-3 sm:px-8 sm:py-4 rounded-xl shadow-md transition-all hover:shadow-lg flex-shrink-0 cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          AI Matchmaker
        </button>

      </div>

      {/* 
        RESULTS GRID 
        Displays the filtered skills as selectable cards.
      */}
      <div>
        <h3 className="text-xs sm:text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2 sm:mb-3">
          {query ? 'Search Results (Top 5)' : 'Suggested Skills'}
        </h3>
        
        {searchResults.length === 0 ? (
          <p className="text-slate-500 py-4 text-sm sm:text-base">No skills found matching "{query}".</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            {searchResults.map((result) => {
              const skill = result.item;
              const isSelected = currentSkillId === skill.id;

              return (
                <button
                  key={skill.id}
                  onClick={() => handleSelectSkill(skill.id)}
                  disabled={isPending}
                  className={`
                    text-left p-3 sm:p-4 rounded-xl border transition-all duration-200 shadow-sm
                    ${isSelected 
                      ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' // Highlight state
                      : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-md' // Default state
                    }
                    ${isPending ? 'opacity-75 cursor-not-allowed' : ''}
                  `}
                >
                  <h4 className={`font-bold text-base sm:text-lg ${isSelected ? 'text-blue-900' : 'text-slate-800'}`}>
                    {skill.name}
                  </h4>
                  <p className={`text-sm mt-1 line-clamp-2 ${isSelected ? 'text-blue-700' : 'text-slate-500'}`}>
                    {skill.description}
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* LOADING ANIMATION */}
      {isPending && (
        <div className="mt-12 pt-8 border-t border-slate-200 flex flex-col items-center justify-center space-y-4">
          <svg className="animate-spin h-10 w-10 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-slate-500 font-medium animate-pulse">Searching global network for available mentors...</p>
        </div>
      )}
    </div>
  );
}
