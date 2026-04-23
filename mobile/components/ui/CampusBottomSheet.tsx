import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  Animated,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from 'react-native';
import Colors from '@/foundations/colors';
import Typography from '@/foundations/typography';
import Spacing from '@/foundations/spacing';
import type { Campus } from '@/services/cafeteriaApi';

/** 기기(세로) 화면 높이의 비율(40%)에 맞추고, 너무 작·큰 경우만 clamp (회전 대응 없음) */
function getSheetHeight(windowHeight: number) {
  return Math.round(Math.min(520, Math.max(240, windowHeight * 0.4)));
}

interface CampusBottomSheetProps {
  visible: boolean;
  campuses: Campus[];
  selectedCampus: Campus | null;
  onSelect: (campus: Campus) => void;
  onClose: () => void;
}

export default function CampusBottomSheet({
  visible,
  campuses,
  selectedCampus,
  onSelect,
  onClose,
}: CampusBottomSheetProps) {
  const { height: windowHeight } = useWindowDimensions();
  const sheetHeight = getSheetHeight(windowHeight);
  const translateY = useRef(new Animated.Value(sheetHeight)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const [rendered, setRendered] = useState(visible);

  useEffect(() => {
    if (visible) {
      setRendered(true);
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          damping: 20,
          stiffness: 200,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: sheetHeight,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) setRendered(false);
      });
    }
  }, [visible]);

  return (
    <Modal
      visible={rendered}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        {/* 배경 딤 */}
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        {/* 시트 패널 */}
        <Animated.View
          style={[styles.sheet, { minHeight: sheetHeight, transform: [{ translateY }] }]}
        >
          {/* 드래그 핸들 */}
          <View style={styles.handle} />

          {/* 제목 */}
          <Text style={styles.title}>캠퍼스 선택</Text>

          {/* 구분선 */}
          <View style={styles.divider} />

          {/* 캠퍼스 목록 */}
          {campuses.map(campus => {
            const isSelected = campus.id === selectedCampus?.id;
            return (
              <Pressable
                key={campus.id}
                style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
                onPress={() => {
                  onSelect(campus);
                  onClose();
                }}
                accessibilityRole="radio"
                accessibilityState={{ checked: isSelected }}
              >
                {/* 라디오 원 */}
                <View style={[styles.radio, isSelected && styles.radioSelected]}>
                  {isSelected && <View style={styles.radioDot} />}
                </View>

                <Text style={[styles.itemText, isSelected && styles.itemTextSelected]}>
                  {campus.name}
                </Text>
              </Pressable>
            );
          })}

          {/* iOS 홈 인디케이터 여백 */}
          {Platform.OS === 'ios' && <View style={styles.safeBottom} />}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.overlay,
  },
  divider: {
    backgroundColor: Colors.divider,
    height: 1,
    marginBottom: Spacing.xs,
  },
  handle: {
    alignSelf: 'center',
    backgroundColor: Colors.border,
    borderRadius: 2,
    height: 4,
    marginBottom: Spacing.md,
    width: 36,
  },
  item: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.md,
    paddingVertical: 14,
  },
  itemPressed: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 8,
    marginHorizontal: -Spacing.xs,
    paddingHorizontal: Spacing.xs,
  },
  itemText: {
    ...Typography.body2,
    color: Colors.textSecondary,
  },
  itemTextSelected: {
    ...Typography.body1,
    color: Colors.textPrimary,
  },
  radio: {
    alignItems: 'center',
    borderColor: Colors.border,
    borderRadius: 11,
    borderWidth: 2,
    height: 22,
    justifyContent: 'center',
    width: 22,
  },
  radioDot: {
    backgroundColor: Colors.primary,
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  radioSelected: {
    borderColor: Colors.primary,
  },
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  safeBottom: {
    height: 20,
  },
  sheet: {
    backgroundColor: Colors.backgroundPrimary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 16,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  title: {
    ...Typography.heading3,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
});
