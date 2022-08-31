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
    const requestCounter = await prisma.requestCounter.findUnique({
      where: { id: 'f5be7166-185f-481f-b3fc-747e9862b40d' },
    });

    if (!typeOfExpenseCount) {
      await prisma.typeOfExpense.createMany({ data: typeOfExpense });
    }

    if (!departmentCount) {
      await prisma.department.createMany({ data: departments });
    }

    if (!locationCount) {
      await prisma.location.createMany({ data: locations });
    }

    if (!requestCounter) {
      await prisma.requestCounter.create({
        data: {
          id: 'f5be7166-185f-481f-b3fc-747e9862b40d',
          count: 1,
        },
      });

      await prisma.approverConfig.createMany({
        data: [
          {
            id: '2a68cb2c-c81d-42ba-8b05-8842748010d3',
            name: 'default',
            flow: 'Department Manager -> Finance Payables -> Finance Treasury',
            condition: 'default',
            order: [
              {
                order: 1,
                time_stamp: null,
                is_approved: false,
                display_name: null,
                approver_email: null,
                executive_level: false,
                approver_department: null,
              },
              {
                order: 2,
                time_stamp: null,
                is_approved: false,
                display_name: 'Marie Josephine Montiflor',
                approver_email: 'marie.torres@kmc.solutions',
                executive_level: false,
                approver_department: 'FINANCE',
              },
              {
                order: 3,
                time_stamp: null,
                is_approved: false,
                display_name: 'Lovelyn Samadan',
                approver_email: 'lovelyn.samadan@kmc.solutions',
                executive_level: false,
                approver_department: 'FINANCE',
              },
            ],
            scope: 'Internal',
          },
          {
            id: '6e1c55ea-6b93-47b6-b987-f2b92080275b',
            name: 'above-gross-salary',
            flow: 'Department Manager -> Department Execom -> Finance Payables -> Finance Treasury',
            condition: 'total_request > *.basic_salary',
            order: [
              {
                order: 1,
                time_stamp: null,
                is_approved: false,
                display_name: null,
                approver_email: null,
                executive_level: false,
                approver_department: null,
              },
              {
                order: 2,
                time_stamp: null,
                is_approved: false,
                display_name: null,
                approver_email: null,
                executive_level: true,
                approver_department: null,
              },
              {
                order: 3,
                time_stamp: null,
                is_approved: false,
                display_name: 'Marie Josephine Montiflor',
                approver_email: 'marie.montiflor@kmc.solutions',
                executive_level: false,
                approver_department: 'FINANCE',
              },
              {
                order: 4,
                time_stamp: null,
                is_approved: false,
                display_name: 'Lovelyn Samadan',
                approver_email: 'lovelyn.samadan@kmc.solutions',
                executive_level: false,
                approver_department: 'FINANCE',
              },
            ],
            scope: 'Internal',
          },
        ],
      });
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
