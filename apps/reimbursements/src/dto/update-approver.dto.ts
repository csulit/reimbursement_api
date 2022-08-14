import { ArrayMinSize, IsArray, IsUUID } from 'class-validator';

export class UpdateApproverDTO {
  @IsArray()
  @IsUUID(null, { each: true })
  @ArrayMinSize(1)
  list: string[];
}
