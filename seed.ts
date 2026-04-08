import 'dotenv/config'
import { prisma } from "./lib/prisma"
import bcrypt from "bcryptjs"

async function main() {
  const adminEmail = "admin@example.com"
  const adminPassword = "password123"
  const hashedPassword = await bcrypt.hash(adminPassword, 10)

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { password: hashedPassword, role: "ADMIN" },
    create: {
      email: adminEmail,
      password: hashedPassword,
      role: "ADMIN"
    },
  })

  console.log(`✅ Seeded admin user: ${admin.email} (Password: ${adminPassword})`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
