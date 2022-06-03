import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import Strategy from 'passport-headerapikey';

@Injectable()
export class AdminGuardStrategy extends PassportStrategy(
  Strategy,
  'admin',
) {
  constructor(private readonly configService: ConfigService) {
    super({ header: 'X-ADMIN-KEY', prefix: '' }, true, async (adminKey, done) => {
      return this.validate(adminKey, done);
    });
  }

  public validate = (adminKey: string, done: (error: Error, data) => {}) => {
    if (this.configService.get<string>('admin.key') === adminKey) {
      done(null, true);
    }
    done(new UnauthorizedException(), null);
  };
}
