import { ToBoolean } from 'apps/shared/decorator/to-boolean.decorator';
import { IsBoolean, IsOptional } from 'class-validator';

export class GetOneOptionalFilterDTO {
  @IsBoolean()
  @ToBoolean()
  @IsOptional()
  readonly show_requestor?: boolean;
}
