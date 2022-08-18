import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsNumber,
  IsOptional,
  IsUUID,
} from 'class-validator';

export class SignRequestDTO {
  @IsUUID()
  readonly id: string;

  @IsNumber()
  @Type(() => Number)
  readonly signer_index: number;

  @IsNumber()
  @Type(() => Number)
  readonly order: number;

  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  readonly skipped: boolean;

  @IsEmail()
  @IsOptional()
  readonly new_approver_email?: string;

  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  readonly is_approved: boolean;
}
