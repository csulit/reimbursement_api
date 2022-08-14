export const FIXED_APPROVERS = {
  internal_default: {
    approvers: [
      {
        order: 2,
        department: 'Payables',
        list: [],
      },
      {
        order: 3,
        department: 'Treasury',
        list: [],
      },
    ],
  },
  internal_above_one_month_of_salary: {
    approvers: [
      {
        order: 2,
        department: 'Must be the EXECOM of the department',
        list: [],
      },
      {
        order: 3,
        department: 'Payables',
        list: [],
      },
      {
        order: 4,
        department: 'Treasury',
        list: [],
      },
    ],
  },
};
