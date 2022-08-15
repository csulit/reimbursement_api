export default class UserEntity {
  id: string;
  name: string;
  personal_email: string;
  work_email: string | null;
  provider: string | null;
  provider_id: string | null;
  roles: string[];
  permissions: string[];
}
