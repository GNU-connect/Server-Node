import { Controller, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { NativeResponseDto } from 'src/api/common/dtos/native-response.dto';
import { JwtAuthGuard } from 'src/api/public/users/guards/jwt-auth.guard';
import { GetCafeteriaDietQueryDto } from './dtos/requests/get-cafeteria-diet-query.dto';
import { GetCafeteriasQueryDto } from './dtos/requests/get-cafeterias-query.dto';
import { CafeteriaDietResponseDto } from './dtos/responses/cafeteria-diet-response.dto';
import { CafeteriaResponseDto } from './dtos/responses/cafeteria-response.dto';
import { CafeteriasService } from './cafeterias.service';
import { CafeteriaDietQuery } from './dtos/cafeteria-diet.query';

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
    const data = await this.cafeteriasService.getCafeterias(query.campusId);
    return new NativeResponseDto(data);
  }

  @Get(':cafeteriaId/diet')
  @ApiOkResponse({ type: NativeResponseDto<CafeteriaDietResponseDto> })
  async getDiet(
    @Param('cafeteriaId', ParseIntPipe) cafeteriaId: number,
    @Query() query: GetCafeteriaDietQueryDto,
  ): Promise<NativeResponseDto<CafeteriaDietResponseDto>> {
    const dietQuery = new CafeteriaDietQuery(cafeteriaId, new Date(query.date), query.time);
    const data = await this.cafeteriasService.getCafeteriaDiet(dietQuery);
    return new NativeResponseDto(data);
  }
}
