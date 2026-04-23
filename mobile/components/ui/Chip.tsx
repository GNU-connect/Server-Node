import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import Colors from '@/foundations/colors';
import Typography from '@/foundations/typography';

interface ChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

export default function Chip({ label, selected, onPress }: ChipProps) {
  return (
    <Pressable
      style={[styles.chip, selected ? styles.chipSelected : styles.chipUnselected]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <Text style={[styles.label, selected ? styles.labelSelected : styles.labelUnselected]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: 100,
    marginRight: 8,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  chipSelected: {
    backgroundColor: Colors.chipSelectedBg,
  },
  chipUnselected: {
    backgroundColor: Colors.chipUnselectedBg,
  },
  label: {
    ...Typography.body3,
    fontWeight: '600',
  },
  labelSelected: {
    color: Colors.chipSelectedText,
  },
  labelUnselected: {
    color: Colors.chipUnselectedText,
  },
});
