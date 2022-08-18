import { PrismaService } from '@app/common';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import UserEntity from 'apps/auth/src/users/entity/user.entity';
import { UsersService } from 'apps/auth/src/users/users.service';
import { useTryAsync } from 'no-try';
import { REIMBURSEMENT_QUEUE_SERVICE } from '../constant';
import { SignRequestDTO } from '../dto/sign-request.dto';
import { UpdateApproverDTO } from '../dto/update-approver.dto';
import { ReimbursementsService } from './reimbursements.service';

@Injectable()
export class ApproversService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reimbursementsService: ReimbursementsService,
    private readonly usersService: UsersService,
    @Inject(REIMBURSEMENT_QUEUE_SERVICE)
    private readonly reimbursementQueueClient: ClientProxy,
  ) {}

  async updateApprovers(user_id: string, data: UpdateApproverDTO) {
    return await this.prisma.user.update({
      where: { id: user_id },
      data: {
        approvers: data.list,
      },
      select: {
        id: true,
        approvers: true,
      },
    });
  }

  private async defaultApproverConfig() {
    return await this.prisma.approverConfig.findUnique({
      where: { id: '2a68cb2c-c81d-42ba-8b05-8842748010d3' },
    });
  }

  private async aboveGrossSalaryApproverConfig() {
    return await this.prisma.approverConfig.findUnique({
      where: { id: '6e1c55ea-6b93-47b6-b987-f2b92080275b' },
    });
  }

  async sendForApproval(id: string, approver_email: string, user: UserEntity) {
    const request = await this.reimbursementsService.getOne(id);

    if (request.is_for_approval) {
      throw new BadRequestException('Request is already sent for approval!');
    }

    if (!request.particulars.length) {
      throw new BadRequestException('Request particular is empty!');
    }

    const requestor = await this.usersService.get(user.id);

    if (!requestor?.comp_and_ben?.basic_salary) {
      throw new BadRequestException('Basic salary is set to 0!');
    }

    const approver_details = await this.usersService.byEmail(approver_email);

    const [error] = await useTryAsync(() =>
      this.prisma.user.findFirstOrThrow({
        where: { id: user.id, approvers: { hasEvery: approver_email } },
      }),
    );

    if (error) {
      throw new BadRequestException('Email specified is not your approver!');
    }

    if (!approver_details) {
      throw new BadRequestException('Approver user not found!');
    }

    const fullName = `${approver_details?.profile?.first_name ?? ''} ${
      approver_details?.profile?.last_name ?? ''
    }`;

    const department = approver_details?.profile?.department ?? '';

    this.reimbursementQueueClient.emit('send_email', {
      email: 'christian.sulit@kmc.solutions',
      body: 'Test',
    });

    if (request.total_expense < requestor.comp_and_ben.basic_salary) {
      const approver_config = (await this.defaultApproverConfig()).order;

      approver_config[0]['approver_email'] = approver_email;
      approver_config[0]['display_name'] = fullName;
      approver_config[0]['approver_department'] = department;

      const new_record = await this.prisma.reimbursement.update({
        where: { id },
        data: {
          status: 'For Approval',
          is_for_approval: true,
          approvers: approver_config,
          next_approver: 1,
          next_approver_id: approver_details.id,
          next_approver_department: department,
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
            orderBy: {
              created_at: 'desc',
            },
          },
        },
      });

      return new_record;
    }

    const approver_config = (await this.aboveGrossSalaryApproverConfig()).order;

    approver_config[0]['approver_email'] = approver_email;
    approver_config[0]['display_name'] = fullName;
    approver_config[0]['approver_department'] = department;

    approver_config[1]['approver_email'] = approver_email;
    approver_config[1]['display_name'] = fullName;
    approver_config[1]['approver_department'] = department;

    const new_record = await this.prisma.reimbursement.update({
      where: { id },
      data: {
        status: 'For Approval',
        is_for_approval: true,
        approvers: approver_config,
        next_approver: 1,
        next_approver_id: approver_details.id,
        next_approver_department: department,
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
          orderBy: {
            created_at: 'desc',
          },
        },
      },
    });

    return new_record;
  }

  async signRequest(data: SignRequestDTO, user: UserEntity) {
    const { id, order, signer_index, is_approved, skipped } = data;

    if (is_approved && skipped) {
      throw new BadRequestException('You approved and you skipped. Amazing...');
    }

    const request = await this.reimbursementsService.getOne(id);

    if (request.amount_to_be_reimbursed <= 0) {
      throw new BadRequestException('Request total amount is 0!');
    }

    const approvers = request.approvers;

    const [error] = await useTryAsync(() =>
      this.prisma.reimbursement.findFirstOrThrow({
        where: { next_approver_id: { equals: user.id } },
      }),
    );

    if (error) {
      throw new BadRequestException('You are not the next approver!');
    }

    approvers[signer_index]['is_approved'] = is_approved;
    approvers[signer_index]['time_stamp'] = new Date(Date.now());

    const next_approver = approvers[order];

    if (skipped) {
      if (!data?.new_approver_email) {
        throw new BadRequestException('New approver email field is empty!');
      }

      // Send email to requestor and to the new approver.
    }

    if (next_approver && is_approved) {
      const next_approver_email = approvers[order]['approver_email'];

      const [error, approver_details] = await useTryAsync(() =>
        this.usersService.byEmail(next_approver_email),
      );

      if (error) {
        throw new BadRequestException('Next approver email is not found!');
      }

      await this.prisma.reimbursement.update({
        where: { id },
        data: {
          approvers,
          next_approver: order + 1,
          next_approver_id: approver_details.id,
          next_approver_department: approver_details?.profile?.department,
        },
      });

      // Send email here to the next approver.
    }

    if (!is_approved) {
      // Send email here to the requestor.
    }

    return {
      message: 'Success',
      sent_to_next_approver: next_approver && is_approved ? true : false,
    };
  }
}
