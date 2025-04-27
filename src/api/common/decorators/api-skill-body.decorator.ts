import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiExtraModels, getSchemaPath } from '@nestjs/swagger';
import { Type } from '@nestjs/common';

export function ApiSkillBody(dto: Type<any>) {
  return applyDecorators(
    ApiExtraModels(dto),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          action: {
            type: 'object',
            properties: {
              clientExtra: { $ref: getSchemaPath(dto) },
            },
          },
        },
      },
    }),
  );
}