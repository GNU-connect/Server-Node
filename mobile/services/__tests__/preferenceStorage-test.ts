import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getDietPreference,
  getShuttleRoutePreference,
  saveDietCafeteriaId,
  saveDietCampusId,
  saveShuttleRoutePreference,
  selectByStoredId,
  selectByStoredRouteName,
} from '@/services/preferenceStorage';

jest.mock('@react-native-async-storage/async-storage', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('@react-native-async-storage/async-storage/jest/async-storage-mock');
});

describe('preferenceStorage 서비스', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  it('학식 조회 조건 ID를 저장하고 복원한다', async () => {
    await saveDietCampusId(3);
    await saveDietCafeteriaId(12);

    await expect(getDietPreference()).resolves.toEqual({
      campusId: 3,
      cafeteriaId: 12,
    });
  });

  it('셔틀 노선명을 저장하고 복원한다', async () => {
    await saveShuttleRoutePreference('인문캠퍼스 순환');

    await expect(getShuttleRoutePreference()).resolves.toBe('인문캠퍼스 순환');
  });

  it('AsyncStorage 읽기에 실패하면 null로 대체한다', async () => {
    jest.spyOn(AsyncStorage, 'getItem').mockRejectedValue(new Error('storage unavailable'));

    await expect(getDietPreference()).resolves.toEqual({
      campusId: null,
      cafeteriaId: null,
    });
    await expect(getShuttleRoutePreference()).resolves.toBeNull();
  });

  it('잘못 저장된 ID는 빈 조회 조건으로 처리한다', async () => {
    await AsyncStorage.setItem('diet.campusId', 'campus');
    await AsyncStorage.setItem('diet.cafeteriaId', '0');

    await expect(getDietPreference()).resolves.toEqual({
      campusId: null,
      cafeteriaId: null,
    });
  });

  it('저장된 ID를 선택하고 없으면 첫 항목으로 대체한다', () => {
    const items = [{ id: 1 }, { id: 2 }];

    expect(selectByStoredId(items, 2)).toEqual({ id: 2 });
    expect(selectByStoredId(items, 99)).toEqual({ id: 1 });
    expect(selectByStoredId([], 1)).toBeNull();
  });

  it('저장된 노선명을 선택하고 없으면 첫 노선으로 대체한다', () => {
    const routes = [{ routeName: 'A' }, { routeName: 'B' }];

    expect(selectByStoredRouteName(routes, 'B')).toEqual({ routeName: 'B' });
    expect(selectByStoredRouteName(routes, 'C')).toEqual({ routeName: 'A' });
    expect(selectByStoredRouteName([], 'A')).toBeNull();
  });
});
