import { IsArray, IsString } from 'class-validator';

export class UpdateApproverDTO {
  @IsArray()
  @IsString({ each: true })
  list: string[];
}
