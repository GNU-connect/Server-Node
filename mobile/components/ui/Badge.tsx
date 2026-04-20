import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '@/foundations/colors';
import Typography from '@/foundations/typography';

interface BadgeProps {
  label: string;
}

export default function Badge({ label }: BadgeProps) {
  return (
    <View style={styles.badge}>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primaryLight,
    borderRadius: 100,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  label: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.primary,
  },
});
