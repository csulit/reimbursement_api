import { PrismaService } from '@app/common';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import UserEntity from 'apps/auth/src/users/entity/user.entity';
import { useTryAsync } from 'no-try';
import { RMQ_REIMBURSEMENT_QUEUE_SERVICE } from '../constant';
import { CreateParticularDTO } from '../dto/create-particular.dto';
import { UpdateParticularDTO } from '../dto/update-particular.dto';
import { ReimbursementsService } from './reimbursements.service';

@Injectable()
export class ParticularsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(RMQ_REIMBURSEMENT_QUEUE_SERVICE)
    private readonly reimbursementQueueClient: ClientProxy,
    private readonly reimbursementsService: ReimbursementsService,
  ) {}

  async getOne(particular_id: string) {
    const particular = await this.prisma.particular.findUnique({
      where: { id: particular_id },
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
    });

    if (!particular) {
      throw new NotFoundException('No record found.');
    }

    return particular;
  }

  async create(data: CreateParticularDTO, authentication: string) {
    const {
      reimbursement_id,
      name,
      justification_and_purpose,
      OR_date,
      type_of_expense,
      file_url,
      total,
    } = data;

    const request = await this.reimbursementsService.getOne(reimbursement_id);

    if (request.is_for_approval) {
      throw new BadRequestException('Request is already sent for approval!');
    }

    const [error, newRecord] = await useTryAsync(() =>
      this.prisma.particular.create({
        data: {
          reimbursement: { connect: { id: reimbursement_id } },
          name,
          justification_and_purpose,
          OR_date: new Date(OR_date),
          ORN: data?.ORN,
          department: data?.department,
          location: data?.location,
          type_of_expense,
          file_url,
          total,
        },
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
      }),
    );

    if (error) {
      throw new BadRequestException(
        error?.message || 'Something went wrong creating a particular.',
      );
    }

    this.reimbursementQueueClient.emit('calculate_total', {
      reimbursement_id,
      Authentication: authentication,
    });

    return newRecord;
  }

  async update(
    particular_id: string,
    data: UpdateParticularDTO,
    authentication: string,
  ) {
    if (data?.OR_date) data.OR_date = new Date(data.OR_date);

    const [error, updatedRecord] = await useTryAsync(() =>
      this.prisma.particular.update({
        where: { id: particular_id },
        data,
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
      }),
    );

    if (error) {
      throw new BadRequestException(
        error?.message || 'Something went wrong updating a particular.',
      );
    }

    if (updatedRecord && data?.total) {
      this.reimbursementQueueClient.emit('calculate_total', {
        reimbursement_id: updatedRecord.reimbursement_id,
        Authentication: authentication,
      });
    }

    return updatedRecord;
  }

  async delete(
    particular_id: string,
    auth: { authentication: string; user: UserEntity },
  ) {
    const { authentication, user } = auth;

    const particular = await this.prisma.particular.findUnique({
      where: { id: particular_id },
      select: { reimbursement_id: true },
    });

    if (!particular) {
      throw new NotFoundException('No particular found.');
    }

    const [error, deletedRecord] = await useTryAsync(() =>
      this.prisma.particular.delete({
        where: { id: particular_id },
        select: { id: true, reimbursement_id: true },
      }),
    );

    if (error) {
      throw new BadRequestException(
        error?.message || 'Something went wrong deleting a particular.',
      );
    }

    const request = await this.reimbursementsService.getOne(
      deletedRecord.reimbursement_id,
      { show_requestor: true },
    );

    if (request.is_for_approval) {
      // Particular total has become 0 kaka delete mo wew!
      if (!request.particulars.length) {
        await this.prisma.reimbursement.update({
          where: { id: deletedRecord.reimbursement_id },
          data: {
            status: 'Re-created',
            is_for_approval: false,
            is_cancelled: false,
            next_approver: 0,
            next_approver_id: null,
            next_approver_department: null,
            approver_stages: 0,
            approvers: [],
            logs: {
              push: {
                message: 'Deleted all particulars',
                performed_by: user.name,
                datetimme: Date.now(),
              },
            },
          },
        });

        this.reimbursementQueueClient.emit('send_email', {
          email: request.user.work_email,
          subject: '[RE-CREATED] Reimbursement request',
          body: `<div>
            <p>Request ID ${request.rid} has been re-created.</p>
            <p>Reason: All particulars attached has been deleted by ${user.name}.</p>
          </div>`,
        });
      }
    }

    this.reimbursementQueueClient.emit('calculate_total', {
      reimbursement_id: particular.reimbursement_id,
      Authentication: authentication,
    });

    return {
      particular_id: deletedRecord.id,
      success: true,
    };
  }
}
