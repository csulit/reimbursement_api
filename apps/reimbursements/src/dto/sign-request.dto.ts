import { ToBoolean } from 'apps/shared/decorator/to-boolean.decorator';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class SignRequestDTO {
  @IsUUID()
  readonly id: string;

  @IsNumber()
  @Type(() => Number)
  readonly next_approver: number;

  @IsBoolean()
  @ToBoolean()
  readonly skipped: boolean;

  @IsBoolean()
  @ToBoolean()
  readonly is_approved: boolean;

  @IsString()
  @IsOptional()
  readonly note?: string;

  @IsEmail()
  @IsOptional()
  readonly new_approver_email?: string;
}
