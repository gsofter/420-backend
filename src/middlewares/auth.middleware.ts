import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { Span, TraceService } from 'nestjs-ddtrace';
import { Response, NextFunction } from 'express';
import { checksumAddress } from 'src/utils/address';
import { UnauthorizedError } from 'src/utils/errors';
import { UserService } from './../user/user.service';
import type { Request } from 'src/types';

@Injectable()
@Span()
export class AuthMiddleware implements NestMiddleware {
  private readonly logger = new Logger('AuthMiddleware');

  constructor(
    private readonly userService: UserService,
    private readonly traceService: TraceService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const token: string = req.headers.authorization?.replace('Bearer ', '');
    const currentSpan = this.traceService.getActiveSpan();

    // If token is not provided, or is invalid, return 401
    if (!token) {
      return next(UnauthorizedError('No access token provided'));
    }

    try {
      const decoded = this.userService.jwtDecodeUser(token);
      req.user = checksumAddress(decoded['address']);
      req.gameKeyId = Number(decoded['gameKeyId']);

      currentSpan.addTags({
        'req.user': req.user,
        'req.gameKeyId': req.gameKeyId
      });

    } catch (error) {
      this.logger.error('JWT decode error: ' + error.message, error);
      return next(UnauthorizedError('Invalid access token'));
    }

    return next();
  }
}
