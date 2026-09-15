'use client'; // Client Component for interactivity and hooks

import { useState, useMemo } from 'react';
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
      threshold: 0.3, // 0.0 is a perfect match, 1.0 matches anything. 0.3 allows slight typos.
      includeScore: true,
    });
  }, [skills]);

  // ---------------------------------------------------------------------------
  // SEARCH EXECUTION
  // ---------------------------------------------------------------------------
  // If the user has typed something, we run the fuzzy search.
  // Otherwise, we just return the full list of skills.
  const searchResults = useMemo(() => {
    if (!query) return skills.map(skill => ({ item: skill }));
    return fuse.search(query);
  }, [query, fuse, skills]);

  // ---------------------------------------------------------------------------
  // HANDLERS
  // ---------------------------------------------------------------------------
  /**
   * Handles clicking on a skill. It updates the URL with the selected skill ID,
   * which triggers the server component (page.tsx) to fetch the mentors for that skill.
   */
  const handleSelectSkill = (skillId: string) => {
    router.push(`/user/search?skillId=${skillId}`);
  };

  // ---------------------------------------------------------------------------
  // RENDER UI
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* 
        SEARCH INPUT BAR 
        A clean, sleek input field for the user to type their desired skill.
      */}
      <div className="relative">
        <label htmlFor="search" className="sr-only">Search Skills</label>
        <input 
          id="search"
          type="text" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. React, Python, Figma..." 
          className="w-full border border-slate-300 p-4 rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm text-lg"
        />
        <div className="absolute right-4 top-4 text-slate-400">
          🔍
        </div>
      </div>

      {/* 
        RESULTS GRID 
        Displays the filtered skills as selectable cards.
      */}
      <div>
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
          {query ? 'Search Results' : 'All Available Skills'}
        </h3>
        
        {searchResults.length === 0 ? (
          <p className="text-slate-500 py-4">No skills found matching "{query}".</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {searchResults.map((result) => {
              const skill = result.item;
              const isSelected = currentSkillId === skill.id;

              return (
                <button
                  key={skill.id}
                  onClick={() => handleSelectSkill(skill.id)}
                  className={`
                    text-left p-4 rounded-xl border transition-all duration-200 shadow-sm
                    ${isSelected 
                      ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' // Highlight state
                      : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-md' // Default state
                    }
                  `}
                >
                  <h4 className={`font-bold text-lg ${isSelected ? 'text-blue-900' : 'text-slate-800'}`}>
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
    </div>
  );
}
