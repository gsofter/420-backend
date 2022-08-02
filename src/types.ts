import { BudColor, BudGender, BudShine } from '@prisma/client';
import { Request as BaseRequest } from 'express';

export type Request = BaseRequest & { user: string, gameKeyId: number };

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

export const GameItem = {
  ROLLING_PAPER: 1,
  HOODIE: 2,
  SUPERWEED_SERUM: 3,
  FARMER_PASS: 4
} as const;

export type GameItem = (typeof GameItem)[keyof typeof GameItem]