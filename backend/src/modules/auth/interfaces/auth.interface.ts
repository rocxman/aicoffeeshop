export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

export interface RefreshTokenPayload {
  sub: string;
  jti: string;
}

export interface AuthUser {
  id: string;
  email: string | null;
  phone: string | null;
  name: string | null;
  role: string;
}
