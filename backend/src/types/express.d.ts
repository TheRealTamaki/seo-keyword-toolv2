import { User } from '../models/user.model';

declare global {
  namespace Express {
    interface Request {
      user?: User | null;
      userId?: string;
      apiKey?: string;
    }
  }
}

export {};
