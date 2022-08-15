import { DoSpacesService, JwtAuthGuard } from '@app/common';
import { UploadedMulterFileI } from '@app/common/do-spaces/lib/aws-s3';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'apps/auth/src/decorator/current-user.decorator';
import { CreateBankDetailsDTO } from 'apps/auth/src/dto/create-bank-details.dto';
import { UpdateBankDetailsDTO } from 'apps/auth/src/dto/update-bank-details.dto';
import UserEntity from 'apps/auth/src/users/entity/user.entity';
import { UsersService } from 'apps/auth/src/users/users.service';
import { Request } from 'express';
import { CreateParticularDTO } from './dto/create-particular.dto';
import { CreateReimbursementDTO } from './dto/create-reimbursement.dto';
import { GetAllReimbursementsFilterDTO } from './dto/get-all-reimbursements.dto';
import { SendToApproverDTO } from './dto/send-to-approver.dto';
import { SignRequestDTO } from './dto/sign-request.dto';
import { UpdateApproverDTO } from './dto/update-approver.dto';
import { UpdateParticularDTO } from './dto/update-particular.dto';
import { ApproversService } from './services/approvers.service';
import { ParticularsService } from './services/particulars.service';
import { ReimbursementsService } from './services/reimbursements.service';

@ApiTags('Reimbursement')
@Controller('reimbursements')
@UseGuards(JwtAuthGuard)
export class ReimbursementsController {
  constructor(
    private readonly reimbursementsService: ReimbursementsService,
    private readonly particularsService: ParticularsService,
    private readonly approversService: ApproversService,

    // This should have it's own app or queue
    private readonly usersService: UsersService,

    private readonly doSpacesService: DoSpacesService,
  ) {}

  @Get()
  getAllReimbursement(
    @CurrentUser() user: UserEntity,
    @Query() query: GetAllReimbursementsFilterDTO,
  ) {
    return this.reimbursementsService.getAll(user, query);
  }

  @Post()
  createReimbursement(
    @CurrentUser() user: UserEntity,
    @Body() data: CreateReimbursementDTO,
  ) {
    return this.reimbursementsService.create(user.id, data);
  }

  @Patch('approvers')
  updateApprovers(
    @CurrentUser() user: UserEntity,
    @Body() data: UpdateApproverDTO,
  ) {
    return this.approversService.updateApprovers(user.id, data);
  }

  @Post('send-to-approvers')
  sendForApproval(
    @Body() data: SendToApproverDTO,
    @CurrentUser() user: UserEntity,
  ) {
    const { id, approver_email } = data;

    return this.approversService.sendForApproval(id, approver_email, user);
  }

  @Patch('sign-request')
  signRequest(@Body() data: SignRequestDTO, @CurrentUser() user: UserEntity) {
    return this.approversService.signRequest(data, user);
  }

  @Post('particular')
  createParticular(@Req() req: Request, @Body() data: CreateParticularDTO) {
    return this.particularsService.create(data, req.cookies?.Authentication);
  }

  @UseInterceptors(FileInterceptor('file'))
  @Post('file-upload')
  async uploadFile(@UploadedFile() file: UploadedMulterFileI) {
    const result = await this.doSpacesService.uploadFile(file, 'reimbursement');

    return result;
  }

  // Start - remove soon
  @Get('users/bank-details')
  getBankDetails(@CurrentUser() user: UserEntity) {
    return this.usersService.getBankDetails(user.id);
  }

  @Post('users/bank-details')
  createBankDetails(
    @CurrentUser() user: UserEntity,
    @Body() data: CreateBankDetailsDTO,
  ) {
    return this.usersService.createBankDetails(user.id, data);
  }

  @Patch('users/bank-details/:bank_id')
  updateBankDetails(
    @Param('bank_id', new ParseUUIDPipe()) bank_id: string,
    @Body() data: UpdateBankDetailsDTO,
  ) {
    return this.usersService.updateBankDetails(bank_id, data);
  }

  @Delete('users/bank-details/:bank_id')
  deleteBankDetails(@Param('bank_id', new ParseUUIDPipe()) bank_id: string) {
    return this.usersService.deleteBankDetails(bank_id);
  }
  // End

  @Get('departments')
  getDepartments() {
    return this.reimbursementsService.getDepartments();
  }

  @Get('locations')
  getLocations() {
    return this.reimbursementsService.getLocations();
  }

  @Get('type-of-expenses')
  getTypeOfExpenses() {
    return this.reimbursementsService.getTypeOfExpenses();
  }

  @Get('particular/:particular_id')
  getOneParticular(
    @Param('particular_id', new ParseUUIDPipe()) particular_id: string,
  ) {
    return this.particularsService.getOne(particular_id);
  }

  @Patch('particular/:particular_id')
  updateParticular(
    @Req() req: Request,
    @Param('particular_id', new ParseUUIDPipe()) particular_id: string,
    @Body() data: UpdateParticularDTO,
  ) {
    return this.particularsService.update(
      particular_id,
      data,
      req.cookies?.Authentication,
    );
  }

  @Delete('particular/:particular_id')
  deleteParticular(
    @Req() req: Request,
    @Param('particular_id', new ParseUUIDPipe()) particular_id: string,
  ) {
    return this.particularsService.delete(
      particular_id,
      req.cookies?.Authentication,
    );
  }

  @Delete('particular/receipt/:key')
  deleteReceipt(@Param('key') key: string) {
    const result = this.doSpacesService.deleteFile('reimbursement', key);

    return result;
  }

  @Get(':reimbursement_id')
  getOneReimbursement(
    @Param('reimbursement_id', new ParseUUIDPipe()) reimbursement_id: string,
  ) {
    return this.reimbursementsService.getOne(reimbursement_id);
  }
}
