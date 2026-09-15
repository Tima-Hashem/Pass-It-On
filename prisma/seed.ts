import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import dotenv from 'dotenv'
import bcrypt from 'bcryptjs'

dotenv.config()

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const SKILLS_DATA = [
  { name: 'React', description: 'Frontend UI library' },
  { name: 'Python', description: 'Backend and Data Science' },
  { name: 'Figma', description: 'UI/UX Design Tool' },
  { name: 'Node.js', description: 'Backend JavaScript runtime' },
  { name: 'TypeScript', description: 'Typed JavaScript' },
  { name: 'PostgreSQL', description: 'Relational Database' },
  { name: 'Docker', description: 'Containerization' },
  { name: 'AWS', description: 'Cloud computing platform' },
  { name: 'GraphQL', description: 'API Query Language' },
  { name: 'Next.js', description: 'React framework' },
]

const FIRST_NAMES = ['Liam', 'Olivia', 'Noah', 'Emma', 'Oliver', 'Ava', 'Elijah', 'Charlotte', 'William', 'Sophia', 'James', 'Amelia', 'Benjamin', 'Isabella', 'Lucas', 'Mia', 'Henry', 'Evelyn', 'Alexander', 'Harper']
const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin']

async function main() {
  console.log('Start fully connected seeding...')

  // Clear existing database to start fresh
  console.log('Clearing existing data...')
  await prisma.certification.deleteMany()
  await prisma.projectSubmission.deleteMany()
  await prisma.mentorship.deleteMany()
  await prisma.userSkill.deleteMany()
  await prisma.skill.deleteMany()
  await prisma.user.deleteMany()
  await prisma.admin.deleteMany()

  // 1. Create Admins
  const hashedYousefAdminPass = await bcrypt.hash('pass123', 10)
  const yousefAdmin = await prisma.admin.create({
    data: {
      email: 'yousef@gmail.com',
      name: 'Yousef Admin',
      passwordHash: hashedYousefAdminPass,
    },
  })
  
  const superAdmin = await prisma.admin.create({
    data: {
      email: 'superadmin1@passiton.com',
      name: 'System Admin',
      passwordHash: await bcrypt.hash('admin123', 10),
    },
  })
  console.log('Admins created')

  // 2. Create Skills
  const createdSkills = []
  for (const skillData of SKILLS_DATA) {
    const skill = await prisma.skill.create({ data: skillData })
    createdSkills.push(skill)
  }
  console.log(`Created ${createdSkills.length} skills`)

  // 3. Generate Users
  const users = []
  
  // Create the requested Yousef student account first
  const hashedYousefStudentPass = await bcrypt.hash('pass123', 10)
  const yousefStudent = await prisma.user.create({
    data: {
      email: 'yousef-student@gmail.com',
      name: 'Yousef Student',
      passwordHash: hashedYousefStudentPass,
      bio: 'I am Yousef the student, ready to learn and mentor!',
      isAcceptingMentees: true,
    }
  })
  users.push(yousefStudent)

  // Create 49 random users
  for (let i = 0; i < 49; i++) {
    const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)]
    const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)]
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`
    const password = `${firstName.toLowerCase()}123`
    const passwordHash = await bcrypt.hash(password, 10)
    
    // ~50% chance to be a mentor
    const isMentor = Math.random() > 0.5 

    const user = await prisma.user.create({
      data: {
        email,
        name: `${firstName} ${lastName}`,
        passwordHash,
        bio: `Hi, I am ${firstName}! I love tech and building cool things.`,
        isAcceptingMentees: isMentor,
      },
    })
    users.push(user)
  }
  console.log('Created 50 interconnected users')

  // 4. Assign Skills and create Mentorship Connections
  const mentors = users.filter(u => u.isAcceptingMentees)
  
  for (const user of users) {
    // Assign 2 to 4 random skills per user
    const numSkills = Math.floor(Math.random() * 3) + 2
    const shuffledSkills = [...createdSkills].sort(() => 0.5 - Math.random())
    const selectedSkills = shuffledSkills.slice(0, numSkills)

    for (const skill of selectedSkills) {
      await prisma.userSkill.create({
        data: { userId: user.id, skillId: skill.id }
      })
    }
    
    // Update the new string array column to keep everything in sync
    await prisma.user.update({
      where: { id: user.id },
      data: { skills: selectedSkills.map(s => s.name) }
    })

    // 5. Connect users via Mentorships
    // Give each user 1-2 random mentorships where they are the MENTEE
    const numMentorships = Math.floor(Math.random() * 2) + 1
    
    for (let m = 0; m < numMentorships; m++) {
      // Pick a random mentor that is NOT the current user
      const potentialMentors = mentors.filter(m => m.id !== user.id)
      if (potentialMentors.length === 0) continue
      
      const mentor = potentialMentors[Math.floor(Math.random() * potentialMentors.length)]
      const skill = selectedSkills[m % selectedSkills.length]
      
      // Randomize the status
      const statuses = ['PENDING', 'ACCEPTED', 'COMPLETED', 'REJECTED']
      const status = statuses[Math.floor(Math.random() * statuses.length)]

      // Always create a request first
      const requestStatus = (status === 'COMPLETED') ? 'ACCEPTED' : status;
      await prisma.mentorshipRequest.create({
        data: {
          menteeId: user.id,
          mentorId: mentor.id,
          skillId: skill.id,
          status: requestStatus as any,
        }
      })

      // If ACCEPTED or COMPLETED, create the active Mentorship
      if (status === 'ACCEPTED' || status === 'COMPLETED') {
        const mentorship = await prisma.mentorship.create({
          data: {
            menteeId: user.id,
            mentorId: mentor.id,
            skillId: skill.id,
          }
        })

        const projectStatus = status === 'COMPLETED' ? 'ADMIN_APPROVED' : 'SUBMITTED'
        await prisma.projectSubmission.create({
          data: {
            mentorshipId: mentorship.id,
            title: `${user.name.split(' ')[0]}'s ${skill.name} Project`,
            description: `This is a comprehensive project demonstrating my mastery of ${skill.name}.`,
            githubUrl: 'https://github.com/example/project',
            status: projectStatus as any,
            mentorFeedback: status === 'COMPLETED' ? 'Excellent work, you really understand this.' : null,
            adminFeedback: status === 'COMPLETED' ? 'Approved.' : null,
          }
        })

        // If COMPLETED, issue a Certification
        if (status === 'COMPLETED') {
          await prisma.certification.create({
            data: {
              userId: user.id,
              skillId: skill.id,
              mentorshipId: mentorship.id,
            }
          })
        }
      }
    }
  }

  console.log('Seeding finished successfully. Database is now fully interconnected with real hashes!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
