import UserEntity from 'apps/auth/src/users/entity/user.entity';

declare global {
  namespace Express {
    class User extends UserEntity {}
  }
}
