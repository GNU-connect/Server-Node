import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { Request, Response } from 'express';
import { ResponseDTO } from 'src/api/common/dtos/response.dto';
import { createSimpleText } from 'src/api/common/utils/component';

const OPEN_BUILDER_ERROR_MESSAGE = '예상치 못한 오류가 발생했어!';

@Catch()
export class OpenBuilderExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(OpenBuilderExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    if (response.headersSent) {
      return;
    }

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    this.logger.error(
      JSON.stringify({
        type: 'OPEN_BUILDER_EXCEPTION',
        status,
        method: request.method,
        url: request.url,
        message:
          exception instanceof Error ? exception.message : String(exception),
      }),
    );

    Sentry.captureException(exception);

    response.status(HttpStatus.OK).json(
      new ResponseDTO({
        outputs: [createSimpleText(OPEN_BUILDER_ERROR_MESSAGE)],
      }),
    );
  }
}
