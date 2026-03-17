import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { SkillPayloadDto } from '../dtos/requests/skill-payload.dto';

export const ClientExtra = createParamDecorator(
  (data: any, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const body = request.body as SkillPayloadDto;
    return plainToInstance(data, body.action.clientExtra);
  },
);

export const DetailParams = createParamDecorator(
  (data: any, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const body = request.body as SkillPayloadDto;
    return plainToInstance(data, body.action.detailParams);
  },
);
