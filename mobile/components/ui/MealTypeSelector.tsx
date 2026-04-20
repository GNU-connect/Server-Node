import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import Colors from '@/foundations/colors';
import Typography from '@/foundations/typography';

const MEAL_TYPES = ['조식', '중식', '석식'] as const;
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
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.backgroundTertiary,
    borderRadius: 12,
    padding: 4,
    gap: 2,
  },
  btn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
  },
  btnSelected: {
    backgroundColor: Colors.primary,
  },
  btnFirst: {
    borderTopLeftRadius: 9,
    borderBottomLeftRadius: 9,
  },
  btnLast: {
    borderTopRightRadius: 9,
    borderBottomRightRadius: 9,
  },
  label: {
    ...Typography.body3,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  labelSelected: {
    color: Colors.textOnPrimary,
  },
});
