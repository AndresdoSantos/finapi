export {};

interface IAccount {
  nri: string;
  name: string;
  id: string;
  statement: IDeposit[];
}

declare global {
  namespace Express {
    interface Request {
      customer: IAccount;
    }
  }
}
