import { BudColor, BudGender, BudShine } from '@prisma/client';
import { Request as BaseRequest } from 'express';

export type Request = BaseRequest & { user: string };

export type Network = 'rinkeby' | 'mainnet';

export type Bud = {
  name: string
  image: string
  thc: number
  budSize: number
  gender: BudGender
  shine: BudShine
  color: BudColor
};

export type BudWithId = Bud & {
  id: number
  revealed: boolean
}
