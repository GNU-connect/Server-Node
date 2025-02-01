import { SkillPayload } from "src/common/interfaces/request/skillPayload";
import { Bot } from "../interfaces/request/fields/bot";
import { Intent } from "../interfaces/request/fields/intent";
import { UserRequest } from "../interfaces/request/fields/userRequest";
import { ApiProperty } from "@nestjs/swagger";
import { Action } from "../interfaces/request/fields/action";

export class RequestDTO implements SkillPayload {
  @ApiProperty({
    description: "봇 정보",
    required: false,
  })
  bot: Bot;

  @ApiProperty({
    description: "인텐트 정보",
    required: false,
  })
  intent: Intent;

  @ApiProperty({
    description: "액션 정보",
    required: false,
  })
  action: Action;

  @ApiProperty({
    description: "유저 요청 정보",
    example: {
      user: {
        id: "74f7e7ab2bf19e63bb1ec845b760631259d7615440a2d3db7b344ac48ed1bbcde5"
      }
    }
  })
  userRequest: UserRequest;

  @ApiProperty({
    description: "문맥 정보",
    required: false,
  })
  contexts?: any[];
}