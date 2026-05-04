import { Controller, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { NativeResponseDto } from 'src/api/common/dtos/native-response.dto';
import { JwtAuthGuard } from 'src/api/public/users/guards/jwt-auth.guard';
import { ChannelType } from '../../domain/enum/channel-type.enum';
import { GetMealScheduleQueryDto } from './dto/get-meal-schedule-query.dto';
import { GetRestaurantsQueryDto } from './dto/get-restaurants-query.dto';
import { MealScheduleResponseDto } from '../../dto/meal-schedule-response.dto';
import { RestaurantResponseDto } from '../../dto/restaurant-response.dto';
import { MealsService } from '../../service/meals.service';

@ApiTags('v2 meals')
@Controller('v2/restaurants')
@UseGuards(JwtAuthGuard)
export class MealsNativeController {
  constructor(private readonly mealsService: MealsService) {}

  @Get()
  @ApiOkResponse({ type: NativeResponseDto<RestaurantResponseDto[]> })
  async getRestaurants(
    @Query() query: GetRestaurantsQueryDto,
  ): Promise<NativeResponseDto<RestaurantResponseDto[]>> {
    const restaurants = await this.mealsService.getRestaurants(query.campusId);
    const data = restaurants.map(restaurant => RestaurantResponseDto.from(restaurant));
    return new NativeResponseDto(data);
  }

  @Get(':restaurantId/meal-schedule')
  @ApiOkResponse({ type: NativeResponseDto<MealScheduleResponseDto> })
  async getMealSchedule(
    @Param('restaurantId', ParseIntPipe) restaurantId: number,
    @Query() query: GetMealScheduleQueryDto,
  ): Promise<NativeResponseDto<MealScheduleResponseDto>> {
    const condition = this.mealsService.createMealQueryCondition({
      restaurantId,
      date: query.date,
      mealType: query.mealType,
      channel: ChannelType.MOBILE,
    });
    const schedule = await this.mealsService.getMealSchedule(condition);
    return new NativeResponseDto(MealScheduleResponseDto.from(schedule));
  }
}
