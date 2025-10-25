import { applyDecorators, Type } from '@nestjs/common';
import { ApiBody, ApiExtraModels, getSchemaPath } from '@nestjs/swagger';

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
