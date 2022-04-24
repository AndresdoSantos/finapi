import express, { NextFunction, Request, Response } from 'express';
import { ppid } from 'process';
import { v4 as uuidv4 } from 'uuid';

const app = express();

app.use(express.json());

interface IDeposit {
  description: string;
  amount: number;
  type: 'credit' | 'debit';
  createdAt: Date;
}
interface IAccount {
  nri: string;
  name: string;
  id: string;
  statement: IDeposit[];
}

const customers: IAccount[] = [];

function verifyIfExistsAccountNRI(
  request: Request,
  response: Response,
  next: NextFunction
) {
  const { nri } = request.headers as Pick<IAccount, 'nri'>;

  const customer = customers.find((customer) => customer.nri === nri);

  if (!customer) {
    return response.status(400).json({ error: 'Cannot find customer!' });
  }

  request.customer = customer;

  return next();
}

function getBalance(statement: IDeposit[]) {
  const balance = statement.reduce(
    (acc: number, { amount, type }: Pick<IDeposit, 'amount' | 'type'>) => {
      if (type === 'credit') {
        return acc + amount;
      } else {
        return acc - amount;
      }
    },
    0
  );

  return balance;
}

app.post('/account', (request, response) => {
  const { nri, name } = request.body as Pick<IAccount, 'nri' | 'name'>;

  const customerAlreadyExists = customers.some(
    (customer) => customer.nri === nri
  );

  if (customerAlreadyExists) {
    return response.status(400).json({ error: 'Customer already exists!' });
  }

  const newCustomer: IAccount = {
    id: uuidv4(),
    name,
    nri,
    statement: [],
  };

  customers.push(newCustomer);

  return response.status(201).send();
});

app.get('/statement', verifyIfExistsAccountNRI, (request, response) => {
  const { customer } = request;

  return response.json({ statements: customer.statement });
});

app.post('/deposit', verifyIfExistsAccountNRI, (request, response) => {
  const { amount, description } = request.body as IDeposit;

  const { customer } = request;

  const statementOperation: IDeposit = {
    amount,
    description,
    type: 'credit',
    createdAt: new Date(),
  };

  customer.statement.push(statementOperation);

  return response.status(201).send();
});

app.post('/withdraw', verifyIfExistsAccountNRI, (request, response) => {
  const { customer } = request;
  const { amount } = request.body as IDeposit;

  const balance = getBalance(customer.statement);

  if (balance < amount) {
    return response.status(400).json({ error: 'Insufficient funds!' });
  }

  const statementOperation: Omit<IDeposit, 'description'> = {
    amount,
    type: 'debit',
    createdAt: new Date(),
  };

  customer.statement.push(statementOperation);

  return response.status(201).send();
});

app.get('/statement/:date', verifyIfExistsAccountNRI, (request, response) => {
  const { customer } = request as { customer: IAccount };
  const { date } = request.query;

  // Busca o dia independete da hora em que a transação foi feita.
  const dateFormat = new Date(date + '00:00');

  const statement = customer.statement.filter(
    (statement) =>
      statement.createdAt.toDateString() === new Date(dateFormat).toDateString()
  );

  return response.json(statement);
});

app.put('/account', verifyIfExistsAccountNRI, (request, response) => {
  const { name } = request.body as IAccount;

  const { customer } = request;

  customer.name = name;

  return response.status(201).send();
});

app.get('/account', verifyIfExistsAccountNRI, (request, response) => {
  const { customer } = request;

  return response.json(customer);
});

app.delete('/account', verifyIfExistsAccountNRI, (request, response) => {
  const { customer } = request;

  customers.splice(customers.indexOf(customer), 1);

  return response.status(200).json(customers);
});

app.get('/balance', verifyIfExistsAccountNRI, (request, response) => {
  const { customer } = request;

  const balance = getBalance(customer.statement);

  return response.json(balance);
});

app.listen(3333);
