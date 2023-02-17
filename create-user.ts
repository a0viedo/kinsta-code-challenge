import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'

const prisma = new PrismaClient()

async function main() {
  const hash = crypto.createHash('sha512')
  
  const user = await prisma.user.create({
    data: {
      name: 'Test user',
    },
  })
  const token = (hash.update(`${user.id}${Date.now()}`, 'utf-8')).digest('hex')
  console.log('token', token)
  // console.log(user)
  await prisma.user.update({
    where: {
      id: user.id
    },
    data: {
      token
    }
  })
  const result = await prisma.user.findMany()
  console.log(result)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })