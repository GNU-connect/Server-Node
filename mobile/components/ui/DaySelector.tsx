import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import Colors from '@/foundations/colors';
import Typography from '@/foundations/typography';

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'] as const;

function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const todayIso = toIsoDate(new Date());
const tomorrowIso = (() => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return toIsoDate(d);
})();

interface DaySelectorProps {
  dates: Date[];
  selectedDate: string;
  onSelect: (isoDate: string) => void;
}

export default function DaySelector({ dates, selectedDate, onSelect }: DaySelectorProps) {
  return (
    <View style={styles.row}>
      {dates.map(date => {
        const iso = toIsoDate(date);
        const isSelected = iso === selectedDate;
        const isToday = iso === todayIso;
        const isTomorrow = iso === tomorrowIso;
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
        const label = isToday ? '오늘' : isTomorrow ? '내일' : DAY_NAMES[date.getDay()];
        const dateNum = date.getDate();

        const dayTextColor = isSelected
          ? Colors.textOnPrimary
          : isToday || isTomorrow
            ? Colors.primary
            : isWeekend
              ? '#F04452CC'
              : Colors.textSecondary;

        return (
          <Pressable
            key={iso}
            style={[styles.dayBtn, isSelected && styles.dayBtnSelected]}
            onPress={() => onSelect(iso)}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
          >
            <Text
              style={[
                styles.dayText,
                { color: dayTextColor },
                isToday && !isSelected && styles.dayTextToday,
              ]}
            >
              {label}
            </Text>
            <Text style={[styles.dateText, isSelected && styles.dateTextSelected]}>{dateNum}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  dateText: {
    ...Typography.caption,
    color: Colors.textTertiary,
    fontWeight: '500',
    marginTop: 2,
  },
  dateTextSelected: {
    color: Colors.textOnPrimary,
    fontSize: 14,
    fontWeight: '800',
  },
  dayBtn: {
    alignItems: 'center',
    backgroundColor: Colors.backgroundTertiary,
    borderRadius: 12,
    flex: 1,
    height: 52,
    justifyContent: 'center',
    marginHorizontal: 2,
  },
  dayBtnSelected: {
    backgroundColor: Colors.primary,
    elevation: 6,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    transform: [{ scale: 1.05 }],
  },
  dayText: {
    ...Typography.body3,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  dayTextToday: {
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
