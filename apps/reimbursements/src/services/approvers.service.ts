import { PrismaService } from '@app/common';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import UserEntity from 'apps/auth/src/users/entity/user.entity';
import { UsersService } from 'apps/auth/src/users/users.service';
import { useTryAsync } from 'no-try';
import { RMQ_REIMBURSEMENT_QUEUE_SERVICE } from '../constant';
import { CancelRequestDTO } from '../dto/cancel-request.dto';
import { SignRequestDTO } from '../dto/sign-request.dto';
import { UpdateApproverDTO } from '../dto/update-approver.dto';
import { ReimbursementsService } from './reimbursements.service';

@Injectable()
export class ApproversService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reimbursementsService: ReimbursementsService,
    private readonly usersService: UsersService,
    @Inject(RMQ_REIMBURSEMENT_QUEUE_SERVICE)
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
      email: approver_details.work_email,
      subject: '[NEW] Reimbursement request',
      body: `<div>
        <p>Request ID: ${request.rid}</p>
        <p>Requestor: ${user.work_email}</p>
        <p>Total: PHP ${request.amount_to_be_reimbursed}</p>
        <p>Check out <a href="https://reimbursement.kmc.solutions/finance/approvals">Reimbursement App</a> for more information.</p>
      </div>`,
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
          approver_stages: 3,
          logs: {
            push: {
              message: 'Sent for approval',
              performed_by: user.name,
              datetimme: Date.now(),
            },
          },
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
        approver_stages: 4,
        logs: {
          push: {
            message: 'Sent for approval',
            performed_by: user.name,
            datetimme: Date.now(),
          },
        },
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
    const { id, next_approver, is_approved, skipped } = data;

    const request = await this.reimbursementsService.getOne(id, {
      show_requestor: true,
    });

    if (!request.particulars.length) {
      throw new BadRequestException('Request particular is empty!');
    }

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

    if (skipped) {
      if (!data?.new_approver_email) {
        throw new BadRequestException('New approver email field is empty!');
      }

      if (
        data.new_approver_email === user.work_email ||
        data.new_approver_email === user.personal_email
      ) {
        throw new BadRequestException(
          "You can't assign new approver using your own email!",
        );
      }

      const [new_approver_error, new_approver_details] = await useTryAsync(() =>
        this.usersService.byEmail(data.new_approver_email),
      );

      if (new_approver_error) {
        throw new BadRequestException('New approver email is not found!');
      }

      approvers[next_approver - 1]['display_name'] = new_approver_details.name;
      approvers[next_approver - 1]['approver_email'] =
        new_approver_details.work_email;
      approvers[next_approver - 1]['approver_department'] =
        new_approver_details?.profile?.department;

      this.reimbursementQueueClient.emit('send_email', {
        email: data.new_approver_email,
        subject: 'Reimbursement request re-route for approval',
        body: `<div>
          <p>Request ID: ${request.rid}</p>
          <p>Requestor: ${request.user.work_email}</p>
          <p>Total: PHP ${request.amount_to_be_reimbursed}</p>
          <p>Check out <a href="https://reimbursement.kmc.solutions/finance/approvals">Reimbursement App</a> for more information.</p>
        </div>`,
      });

      await this.prisma.reimbursement.update({
        where: { id },
        data: {
          approvers,
          next_approver_id: new_approver_details.id,
          next_approver_department: new_approver_details?.profile?.department,
          logs: {
            push: {
              message: data?.note ?? 'Skipped',
              performed_by: user.name,
              datetimme: Date.now(),
            },
          },
        },
      });

      return {
        message: 'Success',
        sent_to_next_approver: true,
      };
    }

    const has_signed = approvers.filter(
      (data) => data['time_stamp'] !== null,
    ).length;

    if (has_signed === request.approver_stages) {
      return {
        message: 'Approver cycle is already completed!',
        sent_to_next_approver: false,
      };
    }

    approvers[next_approver - 1]['is_approved'] = is_approved;
    approvers[next_approver - 1]['time_stamp'] = new Date(Date.now());

    const next_signatory = approvers[next_approver];

    if (!next_signatory) {
      await this.prisma.reimbursement.update({
        where: { id },
        data: {
          approvers,
          status: is_approved ? 'Completed' : 'Declined',
          is_for_approval: false,
          is_fully_approved: is_approved,
          next_approver: 0,
          next_approver_id: null,
          next_approver_department: null,
          logs: {
            push: {
              message: is_approved
                ? 'Approved'
                : data?.note
                ? data.note
                : 'Declined',
              performed_by: user.name,
              datetimme: Date.now(),
            },
          },
        },
      });
    }

    if (next_approver) {
      const next_signatory_email = next_signatory['approver_email'];

      const [next_signatory_error, next_signatory_details] = await useTryAsync(
        () => this.usersService.byEmail(next_signatory_email),
      );

      if (next_signatory_error) {
        throw new BadRequestException('Next approver email is not found!');
      }

      await this.prisma.reimbursement.update({
        where: { id },
        data: {
          approvers,
          status: is_approved ? 'For Approval' : 'Declined',
          is_for_approval: is_approved,
          next_approver: next_approver + 1,
          next_approver_id: next_signatory_details.id,
          next_approver_department: next_signatory_details?.profile?.department,
          logs: {
            push: {
              message: is_approved
                ? 'Approved'
                : data?.note
                ? data.note
                : 'Declined',
              performed_by: user.name,
              datetimme: Date.now(),
            },
          },
        },
      });
    }

    if (is_approved && next_approver) {
      this.reimbursementQueueClient.emit('send_email', {
        email: data.new_approver_email,
        subject: 'Reimbursement request needs your approval',
        body: `<div>
          <p>Request ID: ${request.rid}</p>
          <p>Requestor: ${request.user.work_email}</p>
          <p>Total: PHP ${request.amount_to_be_reimbursed}</p>
          <p>Check out <a href="https://reimbursement.kmc.solutions/finance/approvals">Reimbursement App</a> for more information.</p>
        </div>`,
      });
    }

    if (!is_approved) {
      this.reimbursementQueueClient.emit('send_email', {
        email: request.user.work_email,
        subject: 'Reimbursement request has been declined',
        body: `${
          approvers[next_approver - 1]['display_name']
        } declined your request amounting to <strong>PHP ${
          request.amount_to_be_reimbursed
        }</strong> with a note: <strong>${data.note}</strong>`,
      });
    }

    return {
      message: 'Success',
      sent_to_next_approver:
        next_approver && is_approved && next_signatory ? true : false,
    };
  }

  async multiSignRequest(data: SignRequestDTO[], user: UserEntity) {
    if (!Array.isArray(data)) {
      throw new BadRequestException('Payload should be a list of request.');
    }

    data.forEach((request, i) => {
      setTimeout(() => {
        this.signRequest(request, user);
      }, i * 500);
    });

    return {
      message: 'Success',
      multi_sign: true,
    };
  }

  async cancelRequest(data: CancelRequestDTO, user: UserEntity) {
    const {
      id,
      status,
      is_cancelled,
      is_for_approval,
      next_approver,
      next_approver_id,
      next_approver_department,
      amount_to_be_reimbursed,
      user: request_user,
      logs,
    } = await this.prisma.reimbursement.update({
      where: { id: data.id },
      data: {
        status: 'Cancelled',
        is_for_approval: false,
        is_cancelled: true,
        next_approver: 0,
        next_approver_id: null,
        next_approver_department: null,
        approver_stages: 0,
        approvers: [],
        logs: {
          push: {
            message: data.note,
            performed_by: user.name,
            datetimme: Date.now(),
          },
        },
      },
      select: {
        id: true,
        status: true,
        is_cancelled: true,
        is_for_approval: true,
        next_approver: true,
        next_approver_id: true,
        next_approver_department: true,
        amount_to_be_reimbursed: true,
        user: {
          select: {
            work_email: true,
          },
        },
        logs: true,
      },
    });

    this.reimbursementQueueClient.emit('send_email', {
      email: request_user.work_email,
      subject: 'Reimbursement request cancelled',
      body: `${user.name} cancelled your request amounting to <strong>PHP ${amount_to_be_reimbursed}</strong> with a note: <strong>${data.note}</strong>`,
    });

    return {
      id,
      message: 'Success',
      status,
      is_cancelled,
      is_for_approval,
      next_approver,
      next_approver_id,
      next_approver_department,
      sent_to_next_approver: false,
      logs,
    };
  }
}
