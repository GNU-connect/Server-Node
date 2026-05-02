import { Controller, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { NativeResponseDto } from 'src/api/common/dtos/native-response.dto';
import { JwtAuthGuard } from 'src/api/public/users/guards/jwt-auth.guard';
import { getDietTime } from 'src/api/public/cafeterias/utils/time';
import { GetCafeteriaDietQueryDto } from './dtos/requests/get-cafeteria-diet-query.dto';
import { GetCafeteriasQueryDto } from './dtos/requests/get-cafeterias-query.dto';
import { CafeteriaDietResponseDto } from './dtos/responses/cafeteria-diet-response.dto';
import { CafeteriaResponseDto } from './dtos/responses/cafeteria-response.dto';
import { CafeteriasService } from './cafeterias.service';

@ApiTags('cafeterias')
@Controller('cafeterias')
@UseGuards(JwtAuthGuard)
export class CafeteriasNativeController {
  constructor(private readonly cafeteriasService: CafeteriasService) {}

  @Get()
  @ApiOkResponse({ type: NativeResponseDto<CafeteriaResponseDto[]> })
  async getCafeterias(
    @Query() query: GetCafeteriasQueryDto,
  ): Promise<NativeResponseDto<CafeteriaResponseDto[]>> {
    const result = await this.cafeteriasService.getCafeterias(query.campusId ?? 1);
    const data = result.cafeterias.map(cafeteria => ({
      id: cafeteria.id,
      name: cafeteria.name,
      thumbnailUrl: cafeteria.thumbnailUrl,
      campus: {
        id: cafeteria.campus.id,
        name: cafeteria.campus.name,
        thumbnailUrl: cafeteria.campus.thumbnailUrl,
      },
    }));
    return new NativeResponseDto(data);
  }

  @Get(':cafeteriaId/diet')
  @ApiOkResponse({ type: NativeResponseDto<CafeteriaDietResponseDto> })
  async getDiet(
    @Param('cafeteriaId', ParseIntPipe) cafeteriaId: number,
    @Query() query: GetCafeteriaDietQueryDto,
  ): Promise<NativeResponseDto<CafeteriaDietResponseDto>> {
    const date = query.date ? new Date(query.date) : new Date();
    const time = query.time ?? getDietTime(date);
    const result = await this.cafeteriasService.getCafeteriaDiet(cafeteriaId, date, time);

    const data: CafeteriaDietResponseDto = {
      cafeteria: {
        id: result.cafeteria.id,
        name: result.cafeteria.name,
        thumbnailUrl: result.cafeteria.thumbnailUrl,
        campus: {
          id: result.cafeteria.campus.id,
          name: result.cafeteria.campus.name,
          thumbnailUrl: result.cafeteria.campus.thumbnailUrl,
        },
      },
      date: result.date.toISOString().slice(0, 10),
      time: result.time,
      menus: result.menuGroups,
    };

    return new NativeResponseDto(data);
  }
}
