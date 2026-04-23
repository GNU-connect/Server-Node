import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { NativeResponseDto } from 'src/api/common/dtos/native-response.dto';
import { JwtAuthGuard } from 'src/api/public/users/guards/jwt-auth.guard';
import { CampusResponseDto } from './dtos/campus-response.dto';
import { CampusesService } from './campuses.service';

@ApiTags('campuses')
@Controller('campuses')
@UseGuards(JwtAuthGuard)
export class CampusesNativeController {
  constructor(private readonly campusesService: CampusesService) {}

  @Get()
  @ApiOkResponse({ type: NativeResponseDto<CampusResponseDto[]> })
  async getCampuses(): Promise<NativeResponseDto<CampusResponseDto[]>> {
    const campuses = await this.campusesService.findAll();
    const data = campuses.map((campus) => ({
      id: campus.id,
      name: campus.name,
      thumbnailUrl: campus.thumbnailUrl,
    }));
    return new NativeResponseDto(data);
  }
}
