import { PrismaClient } from '@prisma/client';
import departments from './data/departments';
import locations from './data/locations';
import typeOfExpense from './data/type-of-expenses';

const prismaClient = new PrismaClient();

export async function seed() {
  await prismaClient.$transaction(async (prisma) => {
    const typeOfExpenseCount = await prisma.typeOfExpense.count();
    const departmentCount = await prisma.department.count();
    const locationCount = await prisma.location.count();

    if (!typeOfExpenseCount) {
      await prisma.typeOfExpense.createMany({ data: typeOfExpense });
    }

    if (!departmentCount) {
      await prisma.department.createMany({ data: departments });
    }

    if (!locationCount) {
      await prisma.location.createMany({ data: locations });
    }
  });

  return 'Done! ';
}

seed()
  .then((result) => console.log(result))
  .catch((error) => {
    console.log(error);
    process.exit(1);
  })
  .finally(async () => await prismaClient.$disconnect());
