import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { NativeResponseDto } from 'src/api/common/dtos/native-response.dto';
import { formatLocalDateDotSeparated } from 'src/api/common/utils/date-format';
import { JwtAuthGuard } from 'src/api/public/users/guards/jwt-auth.guard';
import { ShuttleRouteResponseDto } from './dtos/responses/shuttle-route-response.dto';
import { ShuttleTimetableResponseDto } from './dtos/responses/shuttle-timetable-response.dto';
import { ShuttleTimetableCalculator } from './shuttle-timetable.calculator';
import { ShuttlesService } from './shuttles.service';

@ApiTags('shuttles')
@Controller('shuttles')
@UseGuards(JwtAuthGuard)
export class ShuttlesNativeController {
  constructor(
    private readonly shuttlesService: ShuttlesService,
    private readonly shuttleTimetableCalculator: ShuttleTimetableCalculator,
  ) {}

  @Get('routes')
  @ApiOkResponse({ type: NativeResponseDto<ShuttleRouteResponseDto[]> })
  async getRoutes(): Promise<NativeResponseDto<ShuttleRouteResponseDto[]>> {
    const result = await this.shuttlesService.getRoutes();
    const data: ShuttleRouteResponseDto[] = result.routes.map(r => ({
      routeName: r.routeName,
      updatedAt: r.updatedAt.toISOString(),
    }));
    return new NativeResponseDto(data);
  }

  @Get(':routeName/timetable')
  @ApiOkResponse({ type: NativeResponseDto<ShuttleTimetableResponseDto> })
  async getTimetable(
    @Param('routeName') routeName: string,
  ): Promise<NativeResponseDto<ShuttleTimetableResponseDto>> {
    const result = await this.shuttlesService.getTimetable(routeName);
    const timetableView = this.shuttleTimetableCalculator.calculate(result.timetable);

    const data: ShuttleTimetableResponseDto = {
      routeName: result.routeName,
      nextBus: timetableView.nextBus,
      sections: timetableView.sections,
      updatedAt: formatLocalDateDotSeparated(result.updatedAt),
    };

    return new NativeResponseDto(data);
  }
}
