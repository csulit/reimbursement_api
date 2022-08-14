import { Type } from 'class-transformer';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateParticularDTO {
  @IsUUID()
  readonly reimbursement_id: string;

  @IsString()
  @IsNotEmpty()
  readonly name: string;

  @IsString()
  @IsNotEmpty()
  readonly justification_and_purpose: string;

  @IsDateString()
  OR_date: Date;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  readonly ORN?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  readonly department?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  readonly location?: string;

  @IsString()
  @IsNotEmpty()
  readonly type_of_expense: string;

  @IsString()
  @IsNotEmpty()
  readonly file_url: string;

  @IsNumber()
  @Type(() => Number)
  readonly total: number;
}
