const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'asc' },
    select: { id: true, email: true, username: true, role: true, bio: true, createdAt: true },
  })
  console.log(`\n总计 ${users.length} 个用户:\n`)
  users.forEach((u, i) => {
    console.log(`${i + 1}. ${u.username} (${u.email})`)
    console.log(`   角色: ${u.role}`)
    console.log(`   签名: ${u.bio || '(空)'}`)
    console.log(`   注册: ${u.createdAt}\n`)
  })
  await prisma.$disconnect()
}

main().catch(console.error)
