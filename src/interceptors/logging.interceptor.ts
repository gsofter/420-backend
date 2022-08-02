import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private logger = new Logger('LoggingInterceptor');
  private ignorelist = ['/health'];

  private shouldIgnore(url: string): boolean {
    return this.ignorelist.indexOf(url) >= 0;
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    const message = `[${request.method.toUpperCase()}] ${request.url}`;

    if (!this.shouldIgnore(request.url)) {
      this.logger.log(message, {
        http: {
          ip: request.ips.length ? request.ips[0] : request.ip,
          'user-agent': request.headers['user-agent'],
          authorization: request.headers['authorization'],
          method: request.method.toUpperCase(),
          url: request.url,
          params: request.params,
          'request-id': request.headers['x-request-id'],
        },
      });
    }

    const now = Date.now();
    return next.handle().pipe(
      tap(() => {
        if (!this.shouldIgnore(request.url)) {
          this.logger.log(`Finish(${Date.now() - now} ms): ${message} `);
        }
      }),
    );
  }
}
