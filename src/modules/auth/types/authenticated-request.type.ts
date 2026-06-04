export interface AuthenticatedRequest extends Express.Request {
  user: {
    id: number;
    username: string;
  };
}

export interface JwtPayload {
  sub: number;
  username: string;
}
