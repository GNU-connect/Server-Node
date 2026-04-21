import React, { useEffect, useState } from "react";
import { ScrollView, View, Text, StyleSheet, StatusBar, ActivityIndicator, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import Colors from "@/foundations/colors";
import Typography from "@/foundations/typography";
import Spacing from "@/foundations/spacing";
import { Chip, DaySelector, MealTypeSelector, Badge, MenuSection, CampusBottomSheet } from "@/components/ui";
import type { Day } from "@/components/ui/DaySelector";
import type { MealType } from "@/components/ui/MealTypeSelector";
import { getCampuses, getCafeterias, getCafeteriaDiet, dayToIsoDate, type Campus, type Cafeteria, type DietItem } from "@/services/cafeteriaApi";

const TODAY_DAY: Day = (() => {
  const days: Day[] = ["일", "월", "화", "수", "목", "금", "토"];
  return days[new Date().getDay()];
})();

function getWeekRangeLabel(): string {
  const today = new Date();
  const dow = today.getDay(); // 0=일, 1=월, ..., 6=토
  const diffToMonday = dow === 0 ? -6 : 1 - dow;

  const monday = new Date(today);
  monday.setDate(today.getDate() + diffToMonday);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const fmt = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${y}.${m}.${dd}`;
  };

  return `${fmt(monday)} ~ ${fmt(sunday)}`;
}

interface MenuCategory {
  category: string;
  items: string[];
}

function groupDietItems(items: DietItem[]): MenuCategory[] {
  const grouped: Record<string, string[]> = {};
  for (const item of items) {
    const key = item.category ?? item.type ?? "";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(item.name);
  }
  return Object.entries(grouped).map(([category, names]) => ({ category, items: names }));
}

export default function MealScreen() {
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [cafeterias, setCafeterias] = useState<Cafeteria[]>([]);
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>([]);

  const [selectedCampus, setSelectedCampus] = useState<Campus | null>(null);
  const [selectedCafeteria, setSelectedCafeteria] = useState<Cafeteria | null>(null);
  const [day, setDay] = useState<Day>(TODAY_DAY);
  const [mealType, setMealType] = useState<MealType>("점심");

  const [campusSheetOpen, setCampusSheetOpen] = useState(false);

  const [loadingCampuses, setLoadingCampuses] = useState(true);
  const [loadingCafeterias, setLoadingCafeterias] = useState(false);
  const [loadingDiet, setLoadingDiet] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 마운트 시 캠퍼스 목록 불러오기
  useEffect(() => {
    setLoadingCampuses(true);
    setError(null);
    getCampuses()
      .then((data) => {
        setCampuses(data);
        if (data.length > 0) setSelectedCampus(data[0]);
      })
      .catch(() => setError("캠퍼스 정보를 불러오지 못했습니다."))
      .finally(() => setLoadingCampuses(false));
  }, []);

  // 캠퍼스 변경 시 식당 목록 불러오기
  useEffect(() => {
    if (!selectedCampus) return;
    setLoadingCafeterias(true);
    setError(null);
    setSelectedCafeteria(null);
    setMenuCategories([]);
    getCafeterias(selectedCampus.id)
      .then((data) => {
        setCafeterias(data);
        if (data.length > 0) setSelectedCafeteria(data[0]);
      })
      .catch(() => setError("식당 정보를 불러오지 못했습니다."))
      .finally(() => setLoadingCafeterias(false));
  }, [selectedCampus]);

  // 식당/요일/끼니 변경 시 식단 불러오기
  useEffect(() => {
    if (!selectedCafeteria) return;
    setLoadingDiet(true);
    setError(null);
    getCafeteriaDiet(selectedCafeteria.id, dayToIsoDate(day), mealType)
      .then((data) => setMenuCategories(groupDietItems(data.items)))
      .catch(() => {
        setMenuCategories([]);
        setError("메뉴 정보를 불러오지 못했습니다.");
      })
      .finally(() => setLoadingDiet(false));
  }, [selectedCafeteria, day, mealType]);

  const badgeLabel = selectedCampus && selectedCafeteria ? `${selectedCampus.name} · ${selectedCafeteria.name} · ${day}요일 ${mealType}` : "";

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
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* 헤더 */}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Pressable style={styles.campusPill} onPress={() => setCampusSheetOpen(true)} accessibilityRole="button">
              <Text style={styles.title}>{selectedCampus?.name ?? ""}</Text>
              <FontAwesome name="chevron-down" size={13} color={Colors.primary} style={styles.campusChevron} />
            </Pressable>
            <Text style={styles.title}> 학식</Text>
          </View>

          <Text style={styles.subtitle}>{getWeekRangeLabel()}</Text>
        </View>

        {/* 식당 선택 */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {cafeterias.map((c) => (
            <Chip key={c.id} label={c.name} selected={selectedCafeteria?.id === c.id} onPress={() => setSelectedCafeteria(c)} />
          ))}
        </ScrollView>

        {/* 요일 선택 */}
        <View style={styles.section}>
          <DaySelector selected={day} onSelect={setDay} />
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
              menuCategories.map((cat, i) => <MenuSection key={i} category={cat.category} items={cat.items} />)
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
        onSelect={setSelectedCampus}
        onClose={() => setCampusSheetOpen(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.backgroundPrimary,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingBottom: Spacing.xl,
  },
  header: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.md,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  campusPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primaryLight,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 0,
  },
  campusChevron: {
    marginLeft: 6,
  },
  title: {
    ...Typography.heading1,
    color: Colors.textPrimary,
  },
  subtitle: {
    ...Typography.body3,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
  chipRow: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  section: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  menuContainer: {
    marginTop: Spacing.sm,
    marginHorizontal: Spacing.md,
    backgroundColor: Colors.backgroundPrimary,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
  },
  menuList: {
    marginTop: Spacing.md,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    ...Typography.body1,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  emptySubText: {
    ...Typography.body3,
    color: Colors.textTertiary,
  },
});
