import { PrismaService } from '@app/common';
import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Prisma } from '@prisma/client';
import UserEntity from 'apps/auth/src/users/entity/user.entity';
import { Sort } from 'apps/shared/enum/sort.enum';
import paginate from 'apps/shared/utils/paginate.utils';
import { parseAsync } from 'json2csv';
import { RMQ_REIMBURSEMENT_QUEUE_SERVICE } from '../constant';
import { CreateReimbursementDTO } from '../dto/create-reimbursement.dto';
import { GetAllReimbursementsFilterDTO } from '../dto/get-all-reimbursements.dto';
import { GetOneOptionalFilterDTO } from '../dto/get-one-optional-filter.dto';
import { OrderBy } from '../enum/order-by.enum';

@Injectable()
export class ReimbursementsService {
  private readonly logger = new Logger(ReimbursementsService.name);
  constructor(
    private readonly prisma: PrismaService,
    @Inject(RMQ_REIMBURSEMENT_QUEUE_SERVICE)
    private readonly reimbursementQueueClient: ClientProxy,
  ) {}

  async getAll(user: UserEntity, filter?: GetAllReimbursementsFilterDTO) {
    const { page, limit, skip } = paginate(filter?.page, filter?.limit);

    const reimbursementWhereInput: Prisma.ReimbursementWhereInput = {
      user: { id: user?.profile?.is_approver ? undefined : user.id },
      rid: filter?.rid,
      ap_no: filter?.ap_no,
      status: filter?.status,
      filing_date: filter?.filing_date
        ? {
            gte: new Date(filter.filing_date),
            lte: new Date(filter.filing_date),
          }
        : undefined,
      crediting_date: filter?.crediting_date
        ? {
            gte: new Date(filter.crediting_date),
            lte: new Date(filter.crediting_date),
          }
        : undefined,
      amount_to_be_reimbursed: {
        gte: filter?.amount_to_be_reimbursed,
        lte: filter?.amount_to_be_reimbursed,
      },
      is_for_approval: filter?.is_for_approval,
      next_approver_id: filter?.next_approver_id,
      next_approver_department: filter?.next_approver_department,
    };

    const reimbursements = await this.prisma.$transaction([
      this.prisma.reimbursement.findMany({
        skip,
        take: limit,
        where: reimbursementWhereInput,
        select: {
          id: true,
          rid: true,
          ap_no: true,
          batch_no: true,
          status: true,
          filing_date: true,
          crediting_date: true,
          total_expense: true,
          amount_to_be_reimbursed: true,
          is_cancelled: true,
          is_for_approval: true,
          is_fully_approved: true,
          default_first_approver: true,
          approvers: true,
          next_approver: true,
          next_approver_id: true,
          next_approver_department: true,
          approver_stages: true,
          user: filter?.show_requestor
            ? {
                select: {
                  id: true,
                  name: true,
                  personal_email: true,
                  work_email: true,
                  profile: {
                    select: {
                      emp_id: true,
                      first_name: true,
                      last_name: true,
                      department: true,
                      organization: true,
                      is_internal: true,
                    },
                  },
                  bank_accounts: {
                    select: {
                      id: true,
                      bank_name: true,
                      account_number: true,
                    },
                  },
                },
              }
            : false,
          particulars: {
            select: {
              id: true,
              reimbursement_id: true,
              name: true,
              justification_and_purpose: true,
              type_of_expense: true,
              OR_date: true,
              ORN: true,
              department: true,
              location: true,
              file_url: true,
              file_name: true,
              vat: true,
              total: true,
            },
            orderBy: {
              created_at: 'desc',
            },
          },
          logs: true,
        },
        orderBy: {
          [filter?.order_by ? filter.order_by : OrderBy.created_at]:
            filter?.sort ? filter.sort : Sort.desc,
        },
      }),
      this.prisma.reimbursement.count({ where: reimbursementWhereInput }),
    ]);

    return {
      data: reimbursements[0],
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(reimbursements[1] / limit),
        count: reimbursements[1],
      },
    };
  }

  async getOne(reimbursement_id: string, filter?: GetOneOptionalFilterDTO) {
    const reimbursement = await this.prisma.reimbursement.findUnique({
      where: { id: reimbursement_id },
      select: {
        id: true,
        rid: true,
        ap_no: true,
        batch_no: true,
        status: true,
        filing_date: true,
        crediting_date: true,
        total_expense: true,
        amount_to_be_reimbursed: true,
        is_cancelled: true,
        is_for_approval: true,
        is_fully_approved: true,
        default_first_approver: true,
        approvers: true,
        next_approver: true,
        next_approver_id: true,
        next_approver_department: true,
        approver_stages: true,
        user: filter?.show_requestor
          ? {
              select: {
                id: true,
                name: true,
                personal_email: true,
                work_email: true,
                profile: {
                  select: {
                    emp_id: true,
                    first_name: true,
                    last_name: true,
                    department: true,
                    organization: true,
                    is_internal: true,
                  },
                },
                bank_accounts: {
                  select: {
                    id: true,
                    bank_name: true,
                    account_number: true,
                  },
                },
              },
            }
          : false,
        particulars: {
          select: {
            id: true,
            reimbursement_id: true,
            name: true,
            justification_and_purpose: true,
            type_of_expense: true,
            OR_date: true,
            ORN: true,
            department: true,
            location: true,
            file_url: true,
            file_name: true,
            vat: true,
            total: true,
          },
          orderBy: {
            created_at: 'desc',
          },
        },
        logs: true,
      },
    });

    if (!reimbursement) {
      throw new NotFoundException('No record found.');
    }

    return reimbursement;
  }

  async create(user_id: string, data: CreateReimbursementDTO) {
    const { filing_date, default_first_approver } = data;

    const counter = await this.prisma.requestCounter.findUnique({
      where: { id: 'f5be7166-185f-481f-b3fc-747e9862b40d' },
    });

    if (!counter) {
      throw new BadRequestException('Request counter is not set!');
    }

    const batch_no = new Date(Date.now()).getDate() <= 15 ? 1 : 2;

    const newRecord = await this.prisma.reimbursement.create({
      data: {
        rid: `RB-${new Date().getFullYear()}-${counter.count}`,
        batch_no,
        filing_date: new Date(filing_date),
        default_first_approver,
        user_id,
      },
      select: {
        id: true,
        rid: true,
        ap_no: true,
        batch_no: true,
        status: true,
        filing_date: true,
        crediting_date: true,
        total_expense: true,
        amount_to_be_reimbursed: true,
        is_cancelled: true,
        is_for_approval: true,
        is_fully_approved: true,
        default_first_approver: true,
        approvers: true,
        next_approver: true,
        next_approver_id: true,
        next_approver_department: true,
        approver_stages: true,
        user: {
          select: {
            id: true,
            name: true,
            personal_email: true,
            work_email: true,
            profile: {
              select: {
                emp_id: true,
                first_name: true,
                last_name: true,
                department: true,
                organization: true,
                is_internal: true,
              },
            },
            bank_accounts: {
              select: {
                id: true,
                bank_name: true,
                account_number: true,
              },
            },
          },
        },
        particulars: {
          select: {
            id: true,
            reimbursement_id: true,
            name: true,
            justification_and_purpose: true,
            type_of_expense: true,
            OR_date: true,
            ORN: true,
            department: true,
            location: true,
            file_url: true,
            file_name: true,
            vat: true,
            total: true,
          },
          orderBy: {
            created_at: 'desc',
          },
        },
        logs: true,
      },
    });

    if (newRecord) {
      await this.prisma.requestCounter.update({
        where: { id: 'f5be7166-185f-481f-b3fc-747e9862b40d' },
        data: { count: { increment: 1 } },
      });
    }

    return newRecord;
  }

  async generateRequestReport(id: string) {
    const request = await this.getOne(id, { show_requestor: true });

    const internalFields = [
      'Posting Date',
      'Document No.',
      'Account Type',
      'Account No.',
      'Description',
      'Comment',
      'Location Code',
      'Department Code',
      'Customer Code',
      'Amount',
      'VAT Amount',
      'Gen. Posting Type',
      'Vendor No.',
      'VAT Bus. Posting Group',
      'VAT Prod. Posting Group',
      'WHT Bus. Posting Group',
      'WHT Prod. Posting Group',
      'Currency Code',
      'Bal. VAT Difference',
      'Employee Name',
      'Employee Number',
    ];

    const internalData = request.particulars.map((data) => ({
      [internalFields[0]]: 'Posting Date',
      [internalFields[1]]: 'Document No.',
      [internalFields[2]]: 'Account Type',
      [internalFields[3]]: 'Account No.',
      [internalFields[4]]: 'Description',
      [internalFields[5]]: 'Comment',
      [internalFields[6]]: 'Location Code',
      [internalFields[7]]: 'Department Code',
      [internalFields[8]]: 'Customer Code',
      [internalFields[9]]: 'Amount',
      [internalFields[10]]: 'VAT Amount',
      [internalFields[11]]: 'Gen. Posting Type',
      [internalFields[12]]: 'Vendor No.',
      [internalFields[13]]: 'VAT Amount',
      [internalFields[14]]: 'VAT Bus. Posting Group',
      [internalFields[15]]: 'VAT Prod. Posting Group',
      [internalFields[16]]: 'WHT Bus. Posting Group',
      [internalFields[17]]: 'WHT Prod. Posting Group',
      [internalFields[18]]: 'Bal. VAT Difference',
      [internalFields[19]]: 'Employee Name',
      [internalFields[20]]: 'Employee Number',
    }));

    // const externalFields = [
    //   'Client',
    //   'ID #',
    //   'Employee Name',
    //   'Type of Expense',
    //   'Description',
    //   'Client Code',
    //   'Amount',
    //   'Bank Name',
    //   'Bank Account #',
    // ];

    const csv = await parseAsync(internalData, {
      fields: internalFields,
    }).catch(() => {
      throw new BadRequestException('Error on generating CSV');
    });

    return csv;
  }

  async getDepartments() {
    return await this.prisma.department.findMany();
  }

  async getLocations() {
    return await this.prisma.location.findMany();
  }

  async getTypeOfExpenses() {
    return await this.prisma.typeOfExpense.findMany();
  }
}
