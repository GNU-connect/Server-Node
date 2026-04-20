import React, { useState } from "react";
import { ScrollView, View, Text, StyleSheet, SafeAreaView, StatusBar } from "react-native";
import Colors from "@/foundations/colors";
import Typography from "@/foundations/typography";
import Spacing from "@/foundations/spacing";
import { Chip, DaySelector, MealTypeSelector, Badge, MenuSection } from "@/components/ui";
import type { Day } from "@/components/ui/DaySelector";
import type { MealType } from "@/components/ui/MealTypeSelector";
import { CAMPUSES, getCafeterias, getMenu, getDayLabel, type Campus, type Cafeteria } from "@/data/menuData";

const TODAY_DAY: Day = (() => {
  const days: Day[] = ["일", "월", "화", "수", "목", "금", "토"];
  return days[new Date().getDay()];
})();

export default function MealScreen() {
  const [campus, setCampus] = useState<Campus>("서울캠퍼스");
  const [cafeteria, setCafeteria] = useState<Cafeteria>("학생식당");
  const [day, setDay] = useState<Day>(TODAY_DAY);
  const [mealType, setMealType] = useState<MealType>("중식");

  const cafeterias = getCafeterias(campus);
  const menuCategories = getMenu(campus, cafeteria, day, mealType);

  const badgeLabel = `${campus} · ${cafeteria} · ${getDayLabel(day)} ${mealType}`;

  function handleCampusChange(newCampus: Campus) {
    setCampus(newCampus);
    const newCafeterias = getCafeterias(newCampus);
    if (!newCafeterias.includes(cafeteria)) {
      setCafeteria(newCafeterias[0]);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.backgroundPrimary} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={styles.title}>이번 주 학식</Text>
          <Text style={styles.subtitle}>맛있는 한 끼를 선택하세요</Text>
        </View>

        {/* 캠퍼스 선택 */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {CAMPUSES.map((c) => (
            <Chip key={c} label={c} selected={campus === c} onPress={() => handleCampusChange(c)} />
          ))}
        </ScrollView>

        {/* 식당 선택 */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {cafeterias.map((c) => (
            <Chip key={c} label={c} selected={cafeteria === c} onPress={() => setCafeteria(c as Cafeteria)} />
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
          <Badge label={badgeLabel} />
          <View style={styles.menuList}>
            {menuCategories.length > 0 ? (
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.backgroundPrimary,
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
  title: {
    ...Typography.heading1,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    ...Typography.body3,
    color: Colors.textSecondary,
  },
  chipRow: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  section: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  sectionLabel: {
    ...Typography.label,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
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
