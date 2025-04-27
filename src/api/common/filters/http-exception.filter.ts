import { ExceptionFilter, Catch, ArgumentsHost, HttpException, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);
  
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const errorResponse = exception.getResponse();

      this.logger.error(
        JSON.stringify(
          {
            type: 'HTTP_VALIDATION_ERROR',
            status,
            url: request.url,
            method: request.method,
            errors: Array.isArray(errorResponse['message'])
              ? errorResponse['message']
              : [errorResponse['message']], // 단일 메시지도 배열로 변환
          },
          null,
          2 // JSON 포맷 적용 (2칸 들여쓰기)
        )
      );

    response
      .status(status)
      .json({
        statusCode: status,
        message: errorResponse['message'] || exception.message,
        path: request.url,
        timestamp: new Date().toISOString(),
      });
  }
}