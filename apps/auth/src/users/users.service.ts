import { PrismaService } from '@app/common';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { CreateUserDTO } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateUserDTO) {
    const { email, password } = data;

    await this.validateCreateUser(email);

    const encryptedPassword = await bcrypt.hash(password, 10);

    const newUser = await this.prisma.user.create({
      data: { name: email, personal_email: email, password: encryptedPassword },
    });

    // Call update user information queue here.

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
