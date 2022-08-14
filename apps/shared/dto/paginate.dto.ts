import { Type } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';

export class PaginateDTO {
  @IsInt()
  @Type(() => Number)
  @IsOptional()
  page?: number;

  @IsInt()
  @Type(() => Number)
  @IsOptional()
  limit?: number;
}
