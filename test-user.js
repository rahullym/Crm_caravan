const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();
async function main() {
  let user = await prisma.user.findFirst();
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: 'admin@example.com',
        password: await bcrypt.hash('password123', 10),
        role: 'ADMIN'
      }
    });
    console.log('Created admin@example.com / password123');
  } else {
    // If we have a user update their pass to password123 to be safe
    await prisma.user.update({
      where: { email: user.email },
      data: { password: await bcrypt.hash('password123', 10) }
    });
    console.log('Updated user ' + user.email + ' password to password123');
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
