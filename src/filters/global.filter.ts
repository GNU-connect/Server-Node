import { Catch, ExceptionFilter } from '@nestjs/common';
import { WithSentry } from '@sentry/nestjs';

@Catch()
export class YourCatchAllExceptionFilter implements ExceptionFilter {
  @WithSentry()
  catch(exception, host): void {
    // your implementation here
  }
}
