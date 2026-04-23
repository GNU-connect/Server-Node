import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import Colors from '@/foundations/colors';
import Typography from '@/foundations/typography';

const MEAL_TYPES = ['아침', '점심', '저녁'] as const;
export type MealType = (typeof MEAL_TYPES)[number];

interface MealTypeSelectorProps {
  selected: MealType;
  onSelect: (type: MealType) => void;
}

export default function MealTypeSelector({ selected, onSelect }: MealTypeSelectorProps) {
  return (
    <View style={styles.container}>
      {MEAL_TYPES.map((type, index) => {
        const isSelected = type === selected;
        const isFirst = index === 0;
        const isLast = index === MEAL_TYPES.length - 1;

        return (
          <Pressable
            key={type}
            style={[
              styles.btn,
              isSelected && styles.btnSelected,
              isFirst && styles.btnFirst,
              isLast && styles.btnLast,
            ]}
            onPress={() => onSelect(type)}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
          >
            <Text style={[styles.label, isSelected && styles.labelSelected]}>{type}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  btn: {
    alignItems: 'center',
    borderRadius: 9,
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 10,
  },
  btnFirst: {
    borderBottomLeftRadius: 9,
    borderTopLeftRadius: 9,
  },
  btnLast: {
    borderBottomRightRadius: 9,
    borderTopRightRadius: 9,
  },
  btnSelected: {
    backgroundColor: Colors.primary,
  },
  container: {
    backgroundColor: Colors.backgroundTertiary,
    borderRadius: 12,
    flexDirection: 'row',
    gap: 2,
    padding: 4,
  },
  label: {
    ...Typography.body3,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  labelSelected: {
    color: Colors.textOnPrimary,
  },
});
