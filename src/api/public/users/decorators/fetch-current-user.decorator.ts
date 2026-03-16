import { SetMetadata } from '@nestjs/common';

export const FETCH_CURRENT_USER_KEY = 'fetchCurrentUser';
export const FetchCurrentUser = () => SetMetadata(FETCH_CURRENT_USER_KEY, true);
