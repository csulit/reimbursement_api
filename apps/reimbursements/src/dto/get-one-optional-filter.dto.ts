import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

export class GetOneOptionalFilterDTO {
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  @IsOptional()
  readonly show_requestor?: boolean;
}
