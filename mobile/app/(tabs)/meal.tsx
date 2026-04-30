import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/foundations/colors';
import Typography from '@/foundations/typography';
import Spacing from '@/foundations/spacing';
import {
  Chip,
  DaySelector,
  MealTypeSelector,
  Badge,
  MenuSection,
  CampusBottomSheet,
} from '@/components/ui';
import {
  getCampuses,
  getCafeterias,
  getCafeteriaDiet,
  type Campus,
  type Cafeteria,
  type MenuCategory,
} from '@/services/cafeteriaApi';
import {
  getDietPreference,
  saveDietCafeteriaId,
  saveDietCampusId,
  selectByStoredId,
  type DietPreference,
} from '@/services/preferenceStorage';
import { toIsoDate } from '@/utils/date';
import { getDietTime, type DietTimeLabel } from '@/utils/dietTime';

const WEEK_DATES: Date[] = Array.from({ length: 7 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() + i);
  return d;
});

export default function MealScreen() {
  const dietPreferenceRef = useRef<DietPreference>({ campusId: null, cafeteriaId: null });

  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [cafeterias, setCafeterias] = useState<Cafeteria[]>([]);
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>([]);

  const [selectedCampus, setSelectedCampus] = useState<Campus | null>(null);
  const [selectedCafeteria, setSelectedCafeteria] = useState<Cafeteria | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(toIsoDate(WEEK_DATES[0]));
  const [mealType, setMealType] = useState<DietTimeLabel>(() => getDietTime(new Date()));

  const [campusSheetOpen, setCampusSheetOpen] = useState(false);

  const [loadingCampuses, setLoadingCampuses] = useState(true);
  const [loadingCafeterias, setLoadingCafeterias] = useState(false);
  const [loadingDiet, setLoadingDiet] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 마운트 시 캠퍼스 목록 불러오기
  useEffect(() => {
    let canceled = false;

    setLoadingCampuses(true);
    setError(null);

    Promise.all([getCampuses(), getDietPreference()])
      .then(([data, preference]) => {
        if (canceled) return;

        dietPreferenceRef.current = preference;
        setCampuses(data);

        const nextCampus = selectByStoredId(data, preference.campusId);
        setSelectedCampus(nextCampus);

        if (nextCampus && nextCampus.id !== preference.campusId) {
          dietPreferenceRef.current = {
            ...dietPreferenceRef.current,
            campusId: nextCampus.id,
          };
          void saveDietCampusId(nextCampus.id);
        }
      })
      .catch(() => {
        if (!canceled) setError('캠퍼스 정보를 불러오지 못했습니다.');
      })
      .finally(() => {
        if (!canceled) setLoadingCampuses(false);
      });

    return () => {
      canceled = true;
    };
  }, []);

  // 캠퍼스 변경 시 식당 목록 불러오기
  useEffect(() => {
    if (!selectedCampus) return;

    let canceled = false;

    setLoadingCafeterias(true);
    setError(null);
    setSelectedCafeteria(null);
    setCafeterias([]);
    setMenuCategories([]);
    getCafeterias(selectedCampus.id)
      .then(data => {
        if (canceled) return;

        setCafeterias(data);

        const nextCafeteria = selectByStoredId(data, dietPreferenceRef.current.cafeteriaId);
        setSelectedCafeteria(nextCafeteria);

        if (nextCafeteria && nextCafeteria.id !== dietPreferenceRef.current.cafeteriaId) {
          dietPreferenceRef.current = {
            ...dietPreferenceRef.current,
            cafeteriaId: nextCafeteria.id,
          };
          void saveDietCafeteriaId(nextCafeteria.id);
        }
      })
      .catch(() => {
        if (!canceled) setError('식당 정보를 불러오지 못했습니다.');
      })
      .finally(() => {
        if (!canceled) setLoadingCafeterias(false);
      });

    return () => {
      canceled = true;
    };
  }, [selectedCampus]);

  // 식당/요일/끼니 변경 시 식단 불러오기
  useEffect(() => {
    if (!selectedCafeteria) return;
    setLoadingDiet(true);
    setError(null);
    getCafeteriaDiet(selectedCafeteria.id, selectedDate, mealType)
      .then(data => setMenuCategories(data.menus))
      .catch(() => {
        setMenuCategories([]);
        setError('메뉴 정보를 불러오지 못했습니다.');
      })
      .finally(() => setLoadingDiet(false));
  }, [selectedCafeteria, selectedDate, mealType]);

  const handleCampusSelect = useCallback((campus: Campus) => {
    dietPreferenceRef.current = {
      ...dietPreferenceRef.current,
      campusId: campus.id,
    };
    setSelectedCampus(campus);
    void saveDietCampusId(campus.id);
  }, []);

  const handleCafeteriaSelect = useCallback((cafeteria: Cafeteria) => {
    dietPreferenceRef.current = {
      ...dietPreferenceRef.current,
      cafeteriaId: cafeteria.id,
    };
    setSelectedCafeteria(cafeteria);
    void saveDietCafeteriaId(cafeteria.id);
  }, []);

  const badgeLabel =
    selectedCampus && selectedCafeteria
      ? `${selectedCampus.name} · ${selectedCafeteria.name} · ${selectedDate} ${mealType}`
      : '';

  const isLoading = loadingCampuses || loadingCafeterias;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.backgroundPrimary} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* 헤더 */}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Pressable
              style={styles.campusPill}
              onPress={() => setCampusSheetOpen(true)}
              accessibilityRole="button"
            >
              <Text style={styles.title}>{selectedCampus?.name ?? ''}</Text>
              <FontAwesome
                name="chevron-down"
                size={13}
                color={Colors.primary}
                style={styles.campusChevron}
              />
            </Pressable>
            <Text style={styles.title}> 학식</Text>
          </View>
        </View>

        {/* 식당 선택 */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {cafeterias.map(c => (
            <Chip
              key={c.id}
              label={c.name}
              selected={selectedCafeteria?.id === c.id}
              onPress={() => handleCafeteriaSelect(c)}
            />
          ))}
        </ScrollView>

        {/* 요일 선택 */}
        <View style={styles.section}>
          <DaySelector dates={WEEK_DATES} selectedDate={selectedDate} onSelect={setSelectedDate} />
        </View>

        {/* 식사 유형 선택 */}
        <View style={styles.section}>
          <MealTypeSelector selected={mealType} onSelect={setMealType} />
        </View>

        {/* 메뉴 */}
        <View style={styles.menuContainer}>
          {badgeLabel ? <Badge label={badgeLabel} /> : null}
          <View style={styles.menuList}>
            {loadingDiet ? (
              <View style={styles.emptyContainer}>
                <ActivityIndicator size="small" color={Colors.primary} />
              </View>
            ) : error ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>⚠️</Text>
                <Text style={styles.emptyText}>{error}</Text>
              </View>
            ) : menuCategories.length > 0 ? (
              menuCategories.map((cat, i) => (
                <MenuSection key={i} category={cat.category} items={cat.items} />
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>🍽️</Text>
                <Text style={styles.emptyText}>등록된 메뉴가 없어요</Text>
                <Text style={styles.emptySubText}>다른 날짜나 식사 유형을 선택해보세요</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      <CampusBottomSheet
        visible={campusSheetOpen}
        campuses={campuses}
        selectedCampus={selectedCampus}
        onSelect={handleCampusSelect}
        onClose={() => setCampusSheetOpen(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  campusChevron: {
    marginLeft: 6,
  },
  campusPill: {
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    borderRadius: 8,
    flexDirection: 'row',
    marginRight: 0,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  center: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  chipRow: {
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  content: {
    paddingBottom: Spacing.xl,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: Spacing.sm,
  },
  emptySubText: {
    ...Typography.body3,
    color: Colors.textTertiary,
  },
  emptyText: {
    ...Typography.body1,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  header: {
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xxl,
  },
  menuContainer: {
    backgroundColor: Colors.backgroundPrimary,
    borderColor: Colors.border,
    borderRadius: 16,
    borderWidth: 1,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    padding: Spacing.md,
  },
  menuList: {
    marginTop: Spacing.md,
  },
  safeArea: {
    backgroundColor: Colors.backgroundPrimary,
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  section: {
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  title: {
    ...Typography.heading1,
    color: Colors.textPrimary,
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 4,
  },
});
