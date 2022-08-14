import { PartialType } from '@nestjs/mapped-types';
import { PaginateDTO } from 'apps/shared/dto/paginate.dto';
import { Sort } from 'apps/shared/enum/sort.enum';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { OrderBy } from '../enum/order-by.enum';

export class GetAllReimbursementsFilterDTO extends PartialType(PaginateDTO) {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  readonly ap_no?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  readonly status?: string;

  @IsDateString()
  @IsOptional()
  readonly filing_date?: string;

  @IsDateString()
  @IsOptional()
  readonly crediting_date?: string;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  readonly amount_to_be_reimbursed?: number;

  @IsEnum(OrderBy, {
    message: 'Options: id, ap_no, status, filing_date, crediting_date',
  })
  @IsOptional()
  readonly order_by?: OrderBy;

  @IsEnum(Sort, { message: 'Options: asc, desc' })
  @IsOptional()
  readonly sort?: Sort;
}
