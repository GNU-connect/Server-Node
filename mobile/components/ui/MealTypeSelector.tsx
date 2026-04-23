import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import Colors from '@/foundations/colors';
import Typography from '@/foundations/typography';
import { DIET_TIME_LABELS, type DietTimeLabel } from '@/utils/dietTime';

interface MealTypeSelectorProps {
  selected: DietTimeLabel;
  onSelect: (type: DietTimeLabel) => void;
}

export default function MealTypeSelector({ selected, onSelect }: MealTypeSelectorProps) {
  return (
    <View style={styles.container}>
      {DIET_TIME_LABELS.map((type, index) => {
        const isSelected = type === selected;
        const isFirst = index === 0;
        const isLast = index === DIET_TIME_LABELS.length - 1;

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
