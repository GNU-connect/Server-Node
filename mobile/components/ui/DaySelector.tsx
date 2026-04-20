import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import Colors from '@/foundations/colors';
import Typography from '@/foundations/typography';

const DAYS = ['월', '화', '수', '목', '금', '토', '일'] as const;
export type Day = (typeof DAYS)[number];

interface DaySelectorProps {
  selected: Day;
  onSelect: (day: Day) => void;
}

export default function DaySelector({ selected, onSelect }: DaySelectorProps) {
  return (
    <View style={styles.row}>
      {DAYS.map((day) => {
        const isSelected = day === selected;
        return (
          <Pressable
            key={day}
            style={[styles.dayBtn, isSelected && styles.dayBtnSelected]}
            onPress={() => onSelect(day)}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
          >
            <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>{day}</Text>
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
  dayBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.backgroundTertiary,
  },
  dayBtnSelected: {
    backgroundColor: Colors.primary,
  },
  dayText: {
    ...Typography.body3,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  dayTextSelected: {
    color: Colors.textOnPrimary,
  },
});
