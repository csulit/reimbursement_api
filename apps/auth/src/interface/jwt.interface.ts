export default interface Jwt {
  user_id: string;
  iat: number;
  exp: number;
  iss: string;
}
