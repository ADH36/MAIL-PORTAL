/**
 * Database Seeding Script
 * Creates initial admin user and sample data
 */
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Create admin user
  const adminEmail = 'admin@emailportal.com'
  const adminPassword = 'admin123'
  
  // Check if admin user already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail }
  })

  if (existingAdmin) {
    console.log('✅ Admin user already exists')
  } else {
    // Hash the password
    const passwordHash = await bcrypt.hash(adminPassword, 12)

    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        name: 'System Administrator',
        role: 'ADMIN',
        status: 'ACTIVE'
      }
    })

    console.log('✅ Admin user created successfully')
    console.log(`   Email: ${adminUser.email}`)
    console.log(`   Password: ${adminPassword}`)
    console.log(`   Role: ${adminUser.role}`)
  }

  // Create a sample regular user
  const userEmail = 'user@emailportal.com'
  const userPassword = 'user123'
  
  const existingUser = await prisma.user.findUnique({
    where: { email: userEmail }
  })

  if (existingUser) {
    console.log('✅ Sample user already exists')
  } else {
    const userPasswordHash = await bcrypt.hash(userPassword, 12)

    const sampleUser = await prisma.user.create({
      data: {
        email: userEmail,
        passwordHash: userPasswordHash,
        name: 'Sample User',
        role: 'USER',
        status: 'ACTIVE'
      }
    })

    console.log('✅ Sample user created successfully')
    console.log(`   Email: ${sampleUser.email}`)
    console.log(`   Password: ${userPassword}`)
    console.log(`   Role: ${sampleUser.role}`)
  }

  console.log('🎉 Database seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })