import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import Colors from '@/foundations/colors';
import Typography from '@/foundations/typography';
import { KOREAN_WEEKDAY_SHORT, toIsoDate } from '@/utils/date';

export interface DaySelectorProps {
  dates: Date[];
  selectedDate: string;
  onSelect: (isoDate: string) => void;
}

export default function DaySelector({ dates, selectedDate, onSelect }: DaySelectorProps) {
  const todayIso = toIsoDate(new Date());
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowIso = toIsoDate(tomorrowDate);

  return (
    <View style={styles.row}>
      {dates.map(date => {
        const iso = toIsoDate(date);
        const isSelected = iso === selectedDate;
        const isToday = iso === todayIso;
        const isTomorrow = iso === tomorrowIso;
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
        const label = isToday ? '오늘' : isTomorrow ? '내일' : KOREAN_WEEKDAY_SHORT[date.getDay()];
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
            style={[styles.dayBtnDate, isSelected && styles.dayBtnSelected]}
            onPress={() => onSelect(iso)}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
          >
            <Text
              style={[
                styles.labelText,
                { color: dayTextColor },
                isSelected && styles.textOnSelected,
              ]}
            >
              {label}
            </Text>
            <Text
              style={[
                styles.dateNumText,
                { color: dayTextColor },
                isSelected && styles.textOnSelected,
              ]}
            >
              {dateNum}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayBtnDate: {
    minWidth: 42,
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.backgroundTertiary,
  },
  dayBtnSelected: {
    backgroundColor: Colors.primary,
  },
  labelText: {
    ...Typography.body3,
    fontWeight: '600',
  },
  dateNumText: {
    ...Typography.body2,
    fontWeight: '700',
    marginTop: 2,
  },
  textOnSelected: {
    color: Colors.textOnPrimary,
  },
});
