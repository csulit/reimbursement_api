import { PrismaService } from '@app/common';
import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Prisma } from '@prisma/client';
import UserEntity from 'apps/auth/src/users/entity/user.entity';
import { Sort } from 'apps/shared/enum/sort.enum';
import paginate from 'apps/shared/utils/paginate.utils';
import { REIMBURSEMENT_QUEUE_SERVICE } from '../constant';
import { CreateReimbursementDTO } from '../dto/create-reimbursement.dto';
import { GetAllReimbursementsFilterDTO } from '../dto/get-all-reimbursements.dto';
import { OrderBy } from '../enum/order-by.enum';

@Injectable()
export class ReimbursementsService {
  private readonly logger = new Logger(ReimbursementsService.name);
  constructor(
    private readonly prisma: PrismaService,
    @Inject(REIMBURSEMENT_QUEUE_SERVICE)
    private readonly reimbursementQueueClient: ClientProxy,
  ) {}

  async getAll(user: UserEntity, filter?: GetAllReimbursementsFilterDTO) {
    const { page, limit, skip } = paginate(filter?.page, filter?.limit);

    const reimbursementWhereInput: Prisma.ReimbursementWhereInput = {
      user: { id: user?.profile.is_approver ? undefined : user.id },
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
      amount_to_be_reimbursed: filter?.amount_to_be_reimbursed,
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
          ap_no: true,
          batch_no: true,
          status: true,
          filing_date: true,
          crediting_date: true,
          total_expense: true,
          amount_to_be_reimbursed: true,
          is_for_approval: true,
          default_first_approver: true,
          approvers: true,
          next_approver: true,
          next_approver_id: true,
          next_approver_department: true,
          user: {
            select: {
              id: true,
              name: true,
              personal_email: true,
              work_email: true,
              profile: {
                select: {
                  first_name: true,
                  last_name: true,
                  department: true,
                  organization: true,
                  is_internal: true,
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
              id: 'desc',
            },
          },
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

  async getOne(reimbursement_id: string) {
    const reimbursement = await this.prisma.reimbursement.findUnique({
      where: { id: reimbursement_id },
      select: {
        id: true,
        ap_no: true,
        batch_no: true,
        status: true,
        filing_date: true,
        crediting_date: true,
        total_expense: true,
        amount_to_be_reimbursed: true,
        is_for_approval: true,
        default_first_approver: true,
        approvers: true,
        next_approver: true,
        next_approver_id: true,
        next_approver_department: true,
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
        },
      },
    });

    if (!reimbursement) {
      throw new NotFoundException('No record found.');
    }

    return reimbursement;
  }

  async create(user_id: string, data: CreateReimbursementDTO) {
    const { filing_date, default_first_approver } = data;

    const batch_no = new Date(Date.now()).getDate() <= 15 ? 1 : 2;

    const newRecord = await this.prisma.reimbursement.create({
      data: {
        batch_no,
        filing_date: new Date(filing_date),
        default_first_approver,
        user_id,
      },
      select: {
        id: true,
        ap_no: true,
        batch_no: true,
        status: true,
        filing_date: true,
        crediting_date: true,
        total_expense: true,
        amount_to_be_reimbursed: true,
        is_for_approval: true,
        default_first_approver: true,
        approvers: true,
        next_approver: true,
        next_approver_id: true,
        next_approver_department: true,
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
        },
      },
    });

    return newRecord;
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
