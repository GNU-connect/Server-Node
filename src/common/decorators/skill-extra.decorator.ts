import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { SkillPayloadDto } from 'src/common/dtos/requests/skill-payload.dto';

export const SkillExtra = createParamDecorator(
  (data: any, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const body = request.body as SkillPayloadDto;
    return plainToInstance(data, body.action.clientExtra);
  },
);
