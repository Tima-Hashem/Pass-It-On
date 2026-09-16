import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import dotenv from 'dotenv'
import bcrypt from 'bcryptjs'

dotenv.config()

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const SKILLS_LIST = [
  'Web Development', 'Artificial Intelligence', 'Data Science', 'Game Development', 'Machine Learning',
  'Deep Learning', 'React', 'Next.js', 'Node.js', 'Python', 'Java', 'C++', 'C#', 'Rust', 'Go', 'Ruby',
  'PHP', 'Swift', 'Kotlin', 'TypeScript', 'JavaScript', 'HTML/CSS', 'Tailwind CSS', 'Bootstrap',
  'Vue.js', 'Angular', 'Svelte', 'Django', 'Flask', 'FastAPI', 'Spring Boot', 'Express.js',
  'NestJS', 'Laravel', 'Ruby on Rails', 'ASP.NET', 'GraphQL', 'REST APIs', 'SQL', 'PostgreSQL',
  'MySQL', 'MongoDB', 'Redis', 'Firebase', 'Supabase', 'AWS', 'Google Cloud', 'Microsoft Azure',
  'Docker', 'Kubernetes', 'Terraform', 'CI/CD', 'Git', 'Linux Administration', 'Cybersecurity',
  'Penetration Testing', 'Blockchain', 'Web3', 'Ethereum/Solidity', 'IoT', 'Robotics',
  'AR/VR Development', 'Unity', 'Unreal Engine', 'Godot', 'Mobile App Development', 'Flutter',
  'React Native', 'Data Engineering', 'Big Data', 'Apache Spark', 'Hadoop', 'Kafka',
  'Microservices', 'System Design', 'UI/UX Design', 'Figma', 'Adobe XD', 'Data Visualization',
  'Tableau', 'Power BI', 'Agile Methodologies', 'Scrum', 'Product Management', 'Digital Marketing',
  'SEO', 'Content Strategy', 'Technical Writing', 'DevOps', 'Site Reliability Engineering',
  'Computer Vision', 'Natural Language Processing', 'Generative AI', 'LLMs', 'Prompt Engineering',
  'Cloud Architecture', 'Serverless', 'Edge Computing', 'Quantum Computing', 'Bioinformatics'
]

const FIRST_NAMES = ['Liam', 'Olivia', 'Noah', 'Emma', 'Oliver', 'Ava', 'Elijah', 'Charlotte', 'William', 'Sophia', 'James', 'Amelia', 'Benjamin', 'Isabella', 'Lucas', 'Mia', 'Henry', 'Evelyn', 'Alexander', 'Harper', 'Fatima', 'Zahraa', 'Yousef', 'Omar', 'Ali', 'Sara', 'Lina', 'Hassan', 'Hussein', 'Aya']
const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Ali', 'Hussein', 'Hassan', 'Abbas', 'Mohammed']

async function main() {
  console.log('Start fully connected seeding...')

  // Clear existing database to start fresh
  console.log('Clearing existing data...')
  await prisma.certification.deleteMany()
  await prisma.projectSubmission.deleteMany()
  await prisma.mentorship.deleteMany()
  await prisma.userSkill.deleteMany()
  await prisma.skill.deleteMany()
  await prisma.mentorshipRequest.deleteMany()
  await prisma.user.deleteMany()
  await prisma.admin.deleteMany()

  // 1. Create Admins
  console.log('Creating Admins...')
  const adminEmails = ['fatima@gmail.com', 'zahraa@gmail.com', 'yousef@gmail.com']
  const hashedAdminPass = await bcrypt.hash('pass123', 10)
  
  for (const email of adminEmails) {
    const name = email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1)
    await prisma.admin.create({
      data: {
        email,
        name: `${name} Admin`,
        passwordHash: hashedAdminPass,
      },
    })
  }
  console.log('Admins created!')

  // 2. Create 100 Skills
  console.log('Creating Skills...')
  const createdSkills = []
  for (const skillName of SKILLS_LIST) {
    const skill = await prisma.skill.create({ 
      data: { 
        name: skillName, 
        description: `Learn everything about ${skillName} from expert mentors.` 
      } 
    })
    createdSkills.push(skill)
  }
  console.log(`Created ${createdSkills.length} skills!`)

  // 3. Generate 100 Users
  console.log('Creating Users...')
  const users = []
  const hashedUserPass = await bcrypt.hash('pass123', 10)

  for (let i = 0; i < 100; i++) {
    const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)]
    const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)]
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`
    
    const user = await prisma.user.create({
      data: {
        email,
        name: `${firstName} ${lastName}`,
        passwordHash: hashedUserPass,
        bio: `Hi, I am ${firstName}! Passionate about tech and continuous learning.`,
        mentorshipsOwed: Math.floor(Math.random() * 3) // Random 0-2 owed mentorships
      },
    })
    users.push(user)
  }
  console.log(`Created ${users.length} users!`)

  // 4. Assign Skills and create Mentorship Connections
  console.log('Assigning skills and creating mentorships...')
  
  for (const user of users) {
    // Assign 2 to 5 random skills per user
    const numSkills = Math.floor(Math.random() * 4) + 2
    const shuffledSkills = [...createdSkills].sort(() => 0.5 - Math.random())
    const selectedSkills = shuffledSkills.slice(0, numSkills)

    for (const skill of selectedSkills) {
      await prisma.userSkill.create({
        data: { userId: user.id, skillId: skill.id }
      })
    }
    
    await prisma.user.update({
      where: { id: user.id },
      data: { skills: selectedSkills.map(s => s.name) }
    })
  }

  // 5. Connect users via Mentorships (Max 1 learning, Max 1 teaching)
  // Track counts to strictly enforce limits
  const learningCount = new Map<string, number>()
  const teachingCount = new Map<string, number>()
  
  users.forEach(u => {
    learningCount.set(u.id, 0)
    teachingCount.set(u.id, 0)
  })

  // Try to create mentorships
  for (const mentee of users) {
    if (learningCount.get(mentee.id)! >= 1) continue;

    // Find a mentor who hasn't taught more than 1 and has a matching skill
    // Wait, let's just pick any random mentor who hasn't taught > 0
    const potentialMentors = users.filter(m => m.id !== mentee.id && teachingCount.get(m.id)! < 1)
    
    if (potentialMentors.length === 0) continue;
    
    const mentor = potentialMentors[Math.floor(Math.random() * potentialMentors.length)]
    
    // Pick a random skill from createdSkills for the mentorship
    const skill = createdSkills[Math.floor(Math.random() * createdSkills.length)]

    // Record the counts
    learningCount.set(mentee.id, 1)
    teachingCount.set(mentor.id, 1)

    // 50% chance active, 50% chance completed
    const isCompleted = Math.random() > 0.5;
    
    // Create Request (Accepted)
    await prisma.mentorshipRequest.create({
      data: {
        menteeId: mentee.id,
        mentorId: mentor.id,
        skillId: skill.id,
        status: 'ACCEPTED'
      }
    })

    // Create Mentorship
    const mentorship = await prisma.mentorship.create({
      data: {
        menteeId: mentee.id,
        mentorId: mentor.id,
        skillId: skill.id,
        status: isCompleted ? 'COMPLETED' : 'ACTIVE'
      }
    })

    // If completed, add approved project and certification, and add +2 to mentorshipsOwed for the Mentee
    if (isCompleted) {
      await prisma.projectSubmission.create({
        data: {
          mentorshipId: mentorship.id,
          title: `Mastering ${skill.name}`,
          description: `Built a fully functional project using ${skill.name}.`,
          githubUrl: 'https://github.com/example/project',
          status: 'ADMIN_APPROVED',
          mentorFeedback: 'Outstanding work!',
          adminFeedback: 'Approved. Great job.',
        }
      })

      await prisma.certification.create({
        data: {
          userId: mentee.id,
          skillId: skill.id,
          mentorshipId: mentorship.id,
        }
      })

      // Increase required mentorships by 2 for the mentee
      await prisma.user.update({
        where: { id: mentee.id },
        data: { mentorshipsOwed: { increment: 2 } }
      })
    }
  }

  console.log('Seeding finished successfully. Database is fully populated with mock data!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
