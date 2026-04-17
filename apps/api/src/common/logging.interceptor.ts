import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly pinoLogger: PinoLogger) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const { method, url, query, body } = request;
    const startTime = Date.now();

    this.pinoLogger.info(
      `➜ Request: ${method} ${url} ${JSON.stringify(query)}`,
    );
    if (body && Object.keys(body).length > 0) {
      this.pinoLogger.info(`   Body: ${JSON.stringify(body)}`);
    }

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          const statusCode = response.statusCode;
          this.pinoLogger.info(
            `⬅ Response: ${method} ${url} ${statusCode} (${duration}ms)`,
          );
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          this.pinoLogger.error(
            `✗ Error: ${method} ${url} ${error.status || 500} - ${error.message}`,
          );
        },
      }),
      catchError((error) => {
        return throwError(() => error);
      }),
    );
  }
}
