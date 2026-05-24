const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const users = await prisma.user.findMany({ take: 10 })
  console.log('Users:', JSON.stringify(users.map(u => ({ id: u.id, email: u.email, username: u.username, role: u.role })), null, 2))
  
  if (users.length > 0) {
    await prisma.user.update({ where: { id: users[0].id }, data: { role: 'ADMIN' } })
    console.log('Made admin:', users[0].email)
  }
  await prisma.$disconnect()
}
main()
