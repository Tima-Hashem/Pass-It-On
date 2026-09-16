import prisma from '@/lib/prisma';
import FuzzySearchClient from './FuzzySearchClient';
import MentorList from './MentorList';
import { fetchMentorsBySkill } from './actions';
import Link from 'next/link';

/**
 * Server Component: SearchPage
 * 
 * This page serves as the main hub for students to find mentors based on specific skills.
 * It fetches the global list of skills and, if a skill is selected via URL search params,
 * it dynamically queries the database for all active mentors who possess that skill.
 * 
 * @param searchParams - The URL parameters (e.g. ?skillId=123) automatically provided by Next.js.
 */
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { skillId } = await searchParams;
  
  // ---------------------------------------------------------------------------
  // DATA FETCHING
  // ---------------------------------------------------------------------------
  // 1. Fetch all available skills to pass to the client-side fuzzy search component
  const skills = await prisma.skill.findMany({
    orderBy: { name: 'asc' },
  });

  // 2. Determine if a specific skill has been selected in the URL
  const selectedSkillId = typeof skillId === 'string' ? skillId : null;
  const selectedSkill = skills.find(s => s.id === selectedSkillId);

  // 3. If a skill is selected, query the database for eligible mentors
  // We look for users who:
  // - are accepting mentees (isAcceptingMentees = true)
  // - have a UserSkill record matching the selected skill
  let mentors: any[] = [];
  if (selectedSkillId) {
    mentors = await fetchMentorsBySkill(selectedSkillId, 0, 10);
  }

  // ---------------------------------------------------------------------------
  // RENDER UI
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-8">
      {/* PAGE HEADER */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Find a Mentor</h1>
        <p className="text-slate-500 mt-2">Search for a skill below to find community members who can help you learn.</p>
      </div>

      {/* FUZZY SEARCH CLIENT COMPONENT */}
      {/* We pass the statically fetched skills array into the highly interactive client component */}
      <FuzzySearchClient skills={skills} />

      {/* MENTORS DISPLAY SECTION */}
      {/* This section only populates if a skill is actively selected in the URL */}
      {selectedSkillId && (
        <div id="mentors-section" className="mt-12 pt-8 border-t border-slate-200 scroll-mt-24">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">
            Mentors for <span className="text-blue-600">{selectedSkill?.name}</span>
          </h2>
          
          <MentorList key={selectedSkillId} initialMentors={mentors} skillId={selectedSkillId} />
        </div>
      )}
    </div>
  );
}
