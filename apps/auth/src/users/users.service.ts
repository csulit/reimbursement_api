import { PrismaService } from '@app/common';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { REIMBURSEMENT_QUEUE_SERVICE } from 'apps/reimbursements/src/constant';
import * as bcrypt from 'bcrypt';
import { CreateUserDTO } from '../dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(REIMBURSEMENT_QUEUE_SERVICE)
    private readonly reimbursementQueueClient: ClientProxy,
  ) {}

  async create(data: CreateUserDTO) {
    const { email, password } = data;

    await this.validateCreateUser(email);

    const encryptedPassword = await bcrypt.hash(password, 10);

    const newUser = await this.prisma.user.create({
      data: {
        name: email,
        personal_email: email,
        password: encryptedPassword,
        approvers: {
          order: 1,
          list: [],
        },
      },
    });

    // Call update user information queue here.
    this.reimbursementQueueClient.emit('update_user_information', {
      user_id: newUser.id,
      email,
    });

    return newUser;
  }

  async get(user_id: string) {
    return await this.prisma.user.findUnique({
      where: { id: user_id },
      select: {
        id: true,
        name: true,
        personal_email: true,
        work_email: true,
        provider: true,
        provider_id: true,
        roles: true,
        profile: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            is_approver: true,
            department: true,
            account_code: true,
            is_internal: true,
            organization: true,
          },
        },
        comp_and_ben: {
          select: {
            id: true,
            basic_salary: true,
            phone_allowance: true,
          },
        },
      },
    });
  }

  async byEmail(email: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          {
            work_email: email,
          },
          {
            personal_email: email,
          },
        ],
      },
      select: {
        id: true,
        name: true,
        personal_email: true,
        work_email: true,
        provider: true,
        provider_id: true,
        roles: true,
        profile: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            is_approver: true,
            department: true,
            account_code: true,
            is_internal: true,
            organization: true,
          },
        },
        comp_and_ben: {
          select: {
            id: true,
            basic_salary: true,
            phone_allowance: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`No user found with email: ${email}`);
    }

    return user;
  }

  async validate(email: string, password: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          {
            work_email: email,
          },
          {
            personal_email: email,
          },
        ],
      },
      select: {
        id: true,
        name: true,
        personal_email: true,
        work_email: true,
        provider: true,
        provider_id: true,
        roles: true,
        password: true,
      },
    });

    const passwordIsValid = await bcrypt.compare(password, user.password);

    if (!passwordIsValid) {
      throw new UnauthorizedException('Credentials are not valid.');
    }

    return user;
  }

  private async validateCreateUser(email: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          {
            work_email: email,
          },
          {
            personal_email: email,
          },
        ],
      },
    });

    if (user) {
      throw new BadRequestException('User already exists.');
    }
  }
}
