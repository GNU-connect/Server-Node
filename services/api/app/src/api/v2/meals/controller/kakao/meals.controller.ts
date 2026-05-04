import { Controller, Post, UseFilters, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiSkillBody } from 'src/api/common/decorators/api-skill-body.decorator';
import { ClientExtra } from 'src/api/common/decorators/skill-extra.decorator';
import { ResponseDTO } from 'src/api/common/dtos/response.dto';
import { OpenBuilderExceptionFilter } from 'src/api/common/filters/open-builder-exception.filter';
import { BlockId } from 'src/api/common/utils/constants';
import { CampusMessageFactory } from 'src/api/public/campuses/campus-message.factory';
import { CampusesService } from 'src/api/public/campuses/campuses.service';
import { CurrentUser } from 'src/api/public/users/decorators/current-user.decorator';
import { FetchCurrentUser } from 'src/api/public/users/decorators/fetch-current-user.decorator';
import { KakaoAuthGuard } from 'src/api/public/users/guards/kakao-auth.guard';
import { User } from 'src/type-orm/entities/users/users.entity';
import { ChannelType } from '../../domain/enum/channel-type.enum';
import { ListMealScheduleRequestDto } from './dto/list-meal-schedule-request.dto';
import { ListRestaurantsRequestDto } from './dto/list-restaurants-request.dto';
import { MealScheduleResponseDto } from '../../dto/meal-schedule-response.dto';
import { RestaurantResponseDto } from '../../dto/restaurant-response.dto';
import { MealsMessageFactory } from './meals-message.factory';
import { MealsService } from '../../service/meals.service';

@ApiTags('v2 meals')
@Controller('v2')
@UseGuards(KakaoAuthGuard)
@UseFilters(OpenBuilderExceptionFilter)
export class MealsKakaoController {
  constructor(
    private readonly mealsService: MealsService,
    private readonly mealsMessageFactory: MealsMessageFactory,
    private readonly campusesService: CampusesService,
    private readonly campusMessageFactory: CampusMessageFactory,
  ) {}

  @Post('restaurants')
  @FetchCurrentUser()
  @ApiSkillBody(ListRestaurantsRequestDto)
  async listRestaurants(
    @CurrentUser() user: User,
    @ClientExtra(ListRestaurantsRequestDto) extra: ListRestaurantsRequestDto,
  ): Promise<ResponseDTO> {
    const requestedCampusId = extra.campusId;
    const userCampusId = user?.campus?.id;

    if (requestedCampusId === -1 || (!requestedCampusId && !userCampusId)) {
      const result = await this.campusesService.findAll();
      const template = this.campusMessageFactory.createCampusListCard(
        result,
        BlockId.CAFETERIA_LIST,
      );
      return new ResponseDTO(template);
    }

    const campusId = requestedCampusId ?? userCampusId;
    const restaurants = await this.mealsService.getRestaurants(campusId);
    const data = restaurants.map(restaurant => RestaurantResponseDto.from(restaurant));
    const template = this.mealsMessageFactory.createRestaurantListCard(data);
    return new ResponseDTO(template);
  }

  @Post('meal-schedules')
  @ApiSkillBody(ListMealScheduleRequestDto)
  async listMealSchedules(
    @ClientExtra(ListMealScheduleRequestDto)
    extra: ListMealScheduleRequestDto,
  ): Promise<ResponseDTO> {
    const condition = this.mealsService.createMealQueryCondition({
      restaurantId: extra.restaurantId,
      date: extra.date,
      mealType: extra.mealType,
      channel: ChannelType.CHATBOT,
    });
    const schedule = await this.mealsService.getMealSchedule(condition);
    const data = MealScheduleResponseDto.from(schedule);
    const template = this.mealsMessageFactory.createMealScheduleCard(data);
    return new ResponseDTO(template);
  }
}
