import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '@/foundations/colors';
import Typography from '@/foundations/typography';
import Spacing from '@/foundations/spacing';

interface MenuSectionProps {
  category: string;
  items: string[];
}

export default function MenuSection({ category, items }: MenuSectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.category}>{category}</Text>
      {items.map((item, index) => (
        <View key={index} style={styles.itemRow}>
          <View style={styles.bullet} />
          <Text style={styles.item}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: Spacing.md,
  },
  category: {
    ...Typography.label,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  bullet: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.primary,
    marginRight: 8,
  },
  item: {
    ...Typography.body2,
    color: Colors.textPrimary,
  },
});
