import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CancelRequestDTO {
  @IsUUID()
  readonly id: string;

  @IsString()
  @IsNotEmpty()
  readonly note: string;
}
