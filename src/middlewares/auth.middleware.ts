import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { Response, NextFunction } from 'express';
import { checksumAddress } from 'src/utils/address';
import { UnauthorizedError } from 'src/utils/errors';
import { UserService } from './../user/user.service';
import type { Request } from 'src/types';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  private readonly logger = new Logger('AuthMiddleware');

  constructor(private readonly userService: UserService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const token: string = req.headers.authorization?.replace('Bearer ', '');

    // If token is not provided, or is invalid, return 401
    if (!token) {
      return next(UnauthorizedError('No access token provided'));
    }

    try {
      const decoded = this.userService.jwtDecodeUser(token);
      req.user = checksumAddress(decoded['address']);
      req.gameKeyId = Number(decoded['gameKeyId']);
    } catch (error) {
      this.logger.error(error);
      return next(UnauthorizedError('Invalid access token'));
    }

    return next();
  }
}
