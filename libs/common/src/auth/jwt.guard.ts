import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import UserEntity from 'apps/auth/src/users/entity/user.entity';
import { catchError, Observable, tap } from 'rxjs';
import { RMQ_REIMBURSEMENT_AUTH_SERVICE } from './constant';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    @Inject(RMQ_REIMBURSEMENT_AUTH_SERVICE) private authClient: ClientProxy,
  ) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const authentication = this.getAuthentication(context);

    return this.authClient
      .send('validate_user', {
        Authentication: authentication,
      })
      .pipe(
        tap((res) => {
          this.addUser(res, context);
        }),
        catchError(() => {
          throw new UnauthorizedException('Invalid access token');
        }),
      );
  }

  private getAuthentication(context: ExecutionContext) {
    let authentication: string;
    const execType = context.getType();

    if (execType === 'rpc') {
      authentication = context.switchToRpc().getData().Authentication;
    } else if (execType === 'http') {
      authentication = context.switchToHttp().getRequest()
        .cookies?.Authentication;
    }

    if (!authentication) {
      throw new UnauthorizedException(
        'No value was provided for Authentication',
      );
    }

    return authentication;
  }

  private addUser(user: UserEntity, context: ExecutionContext) {
    if (context.getType() === 'rpc') {
      context.switchToRpc().getData().user = user;
    } else if (context.getType() === 'http') {
      context.switchToHttp().getRequest().user = user;
    }
  }
}
