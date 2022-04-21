import { Request as BaseRequest } from 'express';

export type Request = BaseRequest & { user: string };

export type Network = 'rinkeby' | 'mainnet';
