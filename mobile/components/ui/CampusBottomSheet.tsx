import React, { useEffect, useRef } from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  Animated,
  StyleSheet,
  Dimensions,
  Platform,
} from "react-native";
import Colors from "@/foundations/colors";
import Typography from "@/foundations/typography";
import Spacing from "@/foundations/spacing";
import type { Campus } from "@/services/cafeteriaApi";

const SCREEN_HEIGHT = Dimensions.get("window").height;
const SHEET_HEIGHT = 320;

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
  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
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
          toValue: SHEET_HEIGHT,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
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
          style={[styles.sheet, { transform: [{ translateY }] }]}
        >
          {/* 드래그 핸들 */}
          <View style={styles.handle} />

          {/* 제목 */}
          <Text style={styles.title}>캠퍼스 선택</Text>

          {/* 구분선 */}
          <View style={styles.divider} />

          {/* 캠퍼스 목록 */}
          {campuses.map((campus) => {
            const isSelected = campus.id === selectedCampus?.id;
            return (
              <Pressable
                key={campus.id}
                style={({ pressed }) => [
                  styles.item,
                  pressed && styles.itemPressed,
                ]}
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
          {Platform.OS === "ios" && <View style={styles.safeBottom} />}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
  },
  sheet: {
    backgroundColor: Colors.backgroundPrimary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: Spacing.sm,
    paddingHorizontal: Spacing.md,
    minHeight: SHEET_HEIGHT,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 16,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: "center",
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.heading3,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginBottom: Spacing.xs,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: Spacing.md,
  },
  itemPressed: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 8,
    marginHorizontal: -Spacing.xs,
    paddingHorizontal: Spacing.xs,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  radioSelected: {
    borderColor: Colors.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  itemText: {
    ...Typography.body2,
    color: Colors.textSecondary,
  },
  itemTextSelected: {
    ...Typography.body1,
    color: Colors.textPrimary,
  },
  safeBottom: {
    height: 20,
  },
});
