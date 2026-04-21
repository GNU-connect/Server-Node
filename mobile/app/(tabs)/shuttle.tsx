import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/foundations/colors';
import Typography from '@/foundations/typography';
import Spacing from '@/foundations/spacing';
import {
  getShuttleRoutes,
  getShuttleTimetable,
  type ShuttleRoute,
  type ShuttleTimetable,
} from '@/services/shuttleApi';

export default function ShuttleScreen() {
  const [routes, setRoutes] = useState<ShuttleRoute[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [timetableData, setTimetableData] = useState<ShuttleTimetable | null>(null);

  const [loadingRoutes, setLoadingRoutes] = useState(true);
  const [loadingTimetable, setLoadingTimetable] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchedAt, setLastFetchedAt] = useState<Date | null>(null);
  const [secondsAgo, setSecondsAgo] = useState(0);

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const spinValue = useRef(new Animated.Value(0)).current;
  const spinAnimRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    setLoadingRoutes(true);
    setError(null);
    getShuttleRoutes()
      .then((data) => {
        setRoutes(data);
        if (data.length > 0) setSelectedRoute(data[0].routeName);
      })
      .catch(() => setError('노선 정보를 불러오지 못했습니다.'))
      .finally(() => setLoadingRoutes(false));
  }, []);

  const fetchTimetable = useCallback((routeName: string) => {
    setLoadingTimetable(true);
    setError(null);
    getShuttleTimetable(routeName)
      .then((data) => {
        setTimetableData(data);
        setLastFetchedAt(new Date());
        setSecondsAgo(0);
      })
      .catch(() => setError('시간표를 불러오지 못했습니다.'))
      .finally(() => setLoadingTimetable(false));
  }, []);

  useEffect(() => {
    if (!selectedRoute) return;
    setTimetableData(null);
    fetchTimetable(selectedRoute);

    // 1분마다 백엔드에서 최신 상태 재조회
    pollingRef.current = setInterval(() => fetchTimetable(selectedRoute), 60_000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [selectedRoute, fetchTimetable]);

  // 갱신된 지 몇 초 됐는지 1초마다 카운트
  useEffect(() => {
    if (!lastFetchedAt) return;
    const timer = setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - lastFetchedAt.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [lastFetchedAt]);

  // 데이터 로드 중 톱니바퀴 회전
  useEffect(() => {
    if (loadingTimetable) {
      spinValue.setValue(0);
      spinAnimRef.current = Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 900,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      );
      spinAnimRef.current.start();
    } else {
      spinAnimRef.current?.stop();
      spinValue.setValue(0);
    }
  }, [loadingTimetable, spinValue]);

  const spin = spinValue.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  const refreshLabel = lastFetchedAt
    ? secondsAgo < 60
      ? `${secondsAgo}초 전 갱신`
      : `${Math.floor(secondsAgo / 60)}분 전 갱신`
    : '갱신 중...';

  const handleRouteSelect = useCallback((routeName: string) => {
    setSelectedRoute(routeName);
  }, []);

  if (loadingRoutes) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.backgroundPrimary} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* 헤더 */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>셔틀버스</Text>
            <Text style={styles.subtitle}>캠퍼스 간 이동 시간표</Text>
          </View>
          {(lastFetchedAt || loadingTimetable) && (
            <Pressable
              style={styles.refreshBadge}
              onPress={() => selectedRoute && fetchTimetable(selectedRoute)}
              disabled={loadingTimetable}
              accessibilityRole="button"
              accessibilityLabel="지금 갱신"
            >
              <Animated.View style={{ transform: [{ rotate: spin }] }}>
                <FontAwesome name="cog" size={13} color={Colors.textTertiary} />
              </Animated.View>
              <Text style={styles.refreshLabel}>{refreshLabel}</Text>
            </Pressable>
          )}
        </View>

        {/* 노선 선택 */}
        <View style={styles.routeSelector}>
          {routes.map((route) => {
            const isSelected = route.routeName === selectedRoute;
            return (
              <Pressable
                key={route.routeName}
                style={[styles.routeBtn, isSelected && styles.routeBtnSelected]}
                onPress={() => handleRouteSelect(route.routeName)}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
              >
                <Text style={[styles.routeBtnText, isSelected && styles.routeBtnTextSelected]}>
                  {route.routeName}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* 오류 */}
        {error && !loadingTimetable && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* 다음 버스 카드 */}
        {!error && (
          <View style={styles.nextBusCard}>
            <View style={styles.nextBusLabelRow}>
              <FontAwesome name="bus" size={15} color={Colors.textOnPrimary} style={styles.busIcon} />
              <Text style={styles.nextBusLabel}>다음 버스</Text>
            </View>
            {loadingTimetable ? (
              <ActivityIndicator size="small" color={Colors.textOnPrimary} style={{ marginTop: 8 }} />
            ) : timetableData?.nextBus ? (
              <View style={styles.nextBusTimeRow}>
                <Text style={styles.nextBusTime}>{timetableData.nextBus.time}</Text>
                <Text style={styles.nextBusMinutes}>{timetableData.nextBus.minutesUntil}분 후</Text>
              </View>
            ) : (
              <Text style={styles.nextBusNone}>오늘 운행이 종료되었습니다</Text>
            )}
          </View>
        )}

        {/* 시간표 목록 */}
        {!error && !loadingTimetable && timetableData && (
          <View style={styles.timetableContainer}>
            {timetableData.sections.map((section) => (
              <View key={section.label} style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionDot} />
                  <Text style={styles.sectionTitle}>{section.label}</Text>
                </View>
                {section.times.map((entry) => (
                  <View
                    key={entry.time + (entry.memo ?? '')}
                    style={[styles.timeRow, entry.status === 'next' && styles.timeRowNext]}
                  >
                    <Text style={[
                      styles.timeText,
                      entry.status === 'past' && styles.timeTextPast,
                      entry.status === 'next' && styles.timeTextNext,
                      entry.status === 'future' && styles.timeTextFuture,
                    ]}>
                      {entry.time}
                    </Text>
                    {entry.memo && (
                      <Text style={[styles.memoText, entry.status === 'past' && styles.memoTextPast]}>
                        {entry.memo}
                      </Text>
                    )}
                    {entry.status === 'past' && (
                      <View style={styles.pastBadge}>
                        <Text style={styles.pastBadgeText}>지남</Text>
                      </View>
                    )}
                    {entry.status === 'next' && (
                      <View style={styles.nextBadge}>
                        <Text style={styles.nextBadgeText}>다음</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            ))}

            {/* 업데이트 날짜 */}
            <View style={styles.updatedRow}>
              <View style={styles.updatedDot} />
              <Text style={styles.updatedText}>최종 업데이트 {timetableData.updatedAt}</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.backgroundPrimary,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingBottom: Spacing.xl,
  },

  // 헤더
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.md,
  },
  refreshBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
    paddingHorizontal: 9,
    paddingVertical: 5,
    backgroundColor: Colors.backgroundTertiary,
    borderRadius: 20,
  },
  refreshLabel: {
    fontSize: 11,
    color: Colors.textTertiary,
    fontWeight: '500',
  },
  title: {
    ...Typography.heading1,
    color: Colors.textPrimary,
  },
  subtitle: {
    ...Typography.body3,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  // 노선 선택
  routeSelector: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    gap: 8,
  },
  routeBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: Colors.backgroundTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeBtnSelected: {
    backgroundColor: Colors.primary,
  },
  routeBtnText: {
    ...Typography.body3,
    fontWeight: '600',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  routeBtnTextSelected: {
    color: Colors.textOnPrimary,
  },

  // 오류
  errorContainer: {
    marginHorizontal: Spacing.md,
    padding: Spacing.md,
    backgroundColor: '#FFF5F5',
    borderRadius: 12,
    alignItems: 'center',
  },
  errorText: {
    ...Typography.body3,
    color: Colors.error,
  },

  // 다음 버스 카드
  nextBusCard: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: Spacing.md,
    minHeight: 96,
    justifyContent: 'center',
  },
  nextBusLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  busIcon: {
    marginRight: 6,
  },
  nextBusLabel: {
    ...Typography.body3,
    color: Colors.textOnPrimary,
    opacity: 0.85,
  },
  nextBusTimeRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
  },
  nextBusTime: {
    fontSize: 36,
    fontWeight: '700',
    color: Colors.textOnPrimary,
    letterSpacing: -1,
  },
  nextBusMinutes: {
    ...Typography.body1,
    color: Colors.textOnPrimary,
    opacity: 0.9,
  },
  nextBusNone: {
    ...Typography.body2,
    color: Colors.textOnPrimary,
    opacity: 0.8,
  },

  // 시간표
  timetableContainer: {
    marginHorizontal: Spacing.md,
    backgroundColor: Colors.backgroundPrimary,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  section: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginRight: 8,
  },
  sectionTitle: {
    ...Typography.body1,
    color: Colors.textPrimary,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 4,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  timeRowNext: {
    backgroundColor: '#EBF3FF',
    borderRadius: 10,
    borderTopWidth: 0,
    marginHorizontal: -4,
    paddingHorizontal: 8,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  timeText: {
    fontSize: 17,
    fontWeight: '400',
    flex: 1,
  },
  timeTextPast: {
    color: Colors.textTertiary,
  },
  timeTextNext: {
    color: Colors.primary,
    fontWeight: '700',
  },
  timeTextFuture: {
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  memoText: {
    ...Typography.caption,
    color: Colors.error,
    marginRight: 6,
    flex: 1,
  },
  memoTextPast: {
    color: Colors.textTertiary,
  },
  pastBadge: {
    backgroundColor: Colors.backgroundTertiary,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  pastBadgeText: {
    ...Typography.caption,
    color: Colors.textTertiary,
  },
  nextBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  nextBadgeText: {
    ...Typography.caption,
    color: Colors.textOnPrimary,
    fontWeight: '600',
  },

  // 업데이트 날짜
  updatedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    gap: 6,
  },
  updatedDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.textTertiary,
  },
  updatedText: {
    ...Typography.caption,
    color: Colors.textTertiary,
  },
});
