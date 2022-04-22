import express from 'express';
import { v4 as uuidv4 } from 'uuid';

const app = express();

app.use(express.json());

interface IAccount {
  nri: string;
  name: string;
  id: string;
  statement: [];
}

const customers: IAccount[] = [];

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

app.get('/statement', (request, response) => {
  const { nri } = request.headers as Pick<IAccount, 'nri'>;

  const customer = customers.find((customer) => customer.nri === nri);

  if (!customer) {
    return response.status(400).json({ error: 'Customer not found!' });
  }

  return response.json({ statements: customer.statement });
});

app.listen(3333);
