export interface AuthenticatedRequest extends Express.Request {
  user: {
    id: number;
    username: string;
  };
}
