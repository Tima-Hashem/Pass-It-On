import prisma from './lib/prisma';

async function main() {
  const completedProjects = await prisma.projectSubmission.findMany({
    where: { status: 'ADMIN_APPROVED' }
  });

  console.log(`Found ${completedProjects.length} ADMIN_APPROVED projects.`);

  let updated = 0;
  for (const proj of completedProjects) {
    const res = await prisma.mentorship.update({
      where: { id: proj.mentorshipId },
      data: { status: 'COMPLETED' }
    });
    if (res) updated++;
  }

  console.log(`Updated ${updated} mentorships to COMPLETED.`);
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
