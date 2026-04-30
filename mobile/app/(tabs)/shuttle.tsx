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
import {
  getShuttleRoutePreference,
  saveShuttleRoutePreference,
  selectByStoredRouteName,
} from '@/services/preferenceStorage';

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
    let canceled = false;

    setLoadingRoutes(true);
    setError(null);

    Promise.all([getShuttleRoutes(), getShuttleRoutePreference()])
      .then(([data, storedRouteName]) => {
        if (canceled) return;

        setRoutes(data);

        const nextRoute = selectByStoredRouteName(data, storedRouteName);
        setSelectedRoute(nextRoute?.routeName ?? null);

        if (nextRoute && nextRoute.routeName !== storedRouteName) {
          void saveShuttleRoutePreference(nextRoute.routeName);
        }
      })
      .catch(() => {
        if (!canceled) setError('노선 정보를 불러오지 못했습니다.');
      })
      .finally(() => {
        if (!canceled) setLoadingRoutes(false);
      });

    return () => {
      canceled = true;
    };
  }, []);

  const fetchTimetable = useCallback((routeName: string) => {
    setLoadingTimetable(true);
    setError(null);
    getShuttleTimetable(routeName)
      .then(data => {
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

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const refreshLabel = lastFetchedAt
    ? secondsAgo < 60
      ? `${secondsAgo}초 전 갱신`
      : `${Math.floor(secondsAgo / 60)}분 전 갱신`
    : '갱신 중...';

  const handleRouteSelect = useCallback((routeName: string) => {
    setSelectedRoute(routeName);
    void saveShuttleRoutePreference(routeName);
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
          {routes.map(route => {
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
              <FontAwesome
                name="bus"
                size={15}
                color={Colors.textOnPrimary}
                style={styles.busIcon}
              />
              <Text style={styles.nextBusLabel}>다음 버스</Text>
            </View>
            {loadingTimetable ? (
              <ActivityIndicator
                size="small"
                color={Colors.textOnPrimary}
                style={styles.nextBusLoading}
              />
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
            {timetableData.sections.map(section => (
              <View key={section.label} style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionDot} />
                  <Text style={styles.sectionTitle}>{section.label}</Text>
                </View>
                {section.times.map(entry => (
                  <View
                    key={entry.time + (entry.memo ?? '')}
                    style={[styles.timeRow, entry.status === 'next' && styles.timeRowNext]}
                  >
                    <Text
                      style={[
                        styles.timeText,
                        entry.status === 'past' && styles.timeTextPast,
                        entry.status === 'next' && styles.timeTextNext,
                        entry.status === 'future' && styles.timeTextFuture,
                      ]}
                    >
                      {entry.time}
                    </Text>
                    {entry.memo && (
                      <Text
                        style={[styles.memoText, entry.status === 'past' && styles.memoTextPast]}
                      >
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
  busIcon: {
    marginRight: 6,
  },
  center: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  content: {
    paddingBottom: Spacing.xl,
  },
  errorContainer: {
    alignItems: 'center',
    backgroundColor: Colors.errorBackground,
    borderRadius: 12,
    marginHorizontal: Spacing.md,
    padding: Spacing.md,
  },
  errorText: {
    ...Typography.body3,
    color: Colors.error,
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xxl,
  },
  memoText: {
    ...Typography.caption,
    color: Colors.error,
    flex: 1,
    marginRight: 6,
  },
  memoTextPast: {
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
  nextBusCard: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    justifyContent: 'center',
    marginBottom: Spacing.md,
    marginHorizontal: Spacing.md,
    minHeight: 96,
    padding: Spacing.md,
  },
  nextBusLabel: {
    ...Typography.body3,
    color: Colors.textOnPrimary,
    opacity: 0.85,
  },
  nextBusLabelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 6,
  },
  nextBusLoading: {
    marginTop: Spacing.sm,
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
  nextBusTime: {
    color: Colors.textOnPrimary,
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: -1,
  },
  nextBusTimeRow: {
    alignItems: 'baseline',
    flexDirection: 'row',
    gap: 10,
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
  refreshBadge: {
    alignItems: 'center',
    backgroundColor: Colors.backgroundTertiary,
    borderRadius: 20,
    flexDirection: 'row',
    gap: 5,
    marginTop: 6,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  refreshLabel: {
    color: Colors.textTertiary,
    fontSize: 11,
    fontWeight: '500',
  },
  routeBtn: {
    alignItems: 'center',
    backgroundColor: Colors.backgroundTertiary,
    borderRadius: 12,
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  routeBtnSelected: {
    backgroundColor: Colors.primary,
  },
  routeBtnText: {
    ...Typography.body3,
    color: Colors.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
  },
  routeBtnTextSelected: {
    color: Colors.textOnPrimary,
  },
  routeSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  safeArea: {
    backgroundColor: Colors.backgroundPrimary,
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  section: {
    paddingBottom: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
  },
  sectionDot: {
    backgroundColor: Colors.primary,
    borderRadius: 4,
    height: 8,
    marginRight: 8,
    width: 8,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.body1,
    color: Colors.textPrimary,
  },
  timeRow: {
    alignItems: 'center',
    borderTopColor: Colors.divider,
    borderTopWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 4,
    paddingVertical: 13,
  },
  timeRowNext: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
    borderRadius: 10,
    borderTopWidth: 0,
    borderWidth: 1.5,
    marginHorizontal: -4,
    paddingHorizontal: 8,
  },
  timeText: {
    flex: 1,
    fontSize: 17,
    fontWeight: '400',
  },
  timeTextFuture: {
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  timeTextNext: {
    color: Colors.primary,
    fontWeight: '700',
  },
  timeTextPast: {
    color: Colors.textTertiary,
  },
  timetableContainer: {
    backgroundColor: Colors.backgroundPrimary,
    borderColor: Colors.border,
    borderRadius: 16,
    borderWidth: 1,
    marginHorizontal: Spacing.md,
    overflow: 'hidden',
  },
  title: {
    ...Typography.heading1,
    color: Colors.textPrimary,
  },
  updatedDot: {
    backgroundColor: Colors.textTertiary,
    borderRadius: 2.5,
    height: 5,
    width: 5,
  },
  updatedRow: {
    alignItems: 'center',
    borderTopColor: Colors.divider,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    paddingVertical: Spacing.md,
  },
  updatedText: {
    ...Typography.caption,
    color: Colors.textTertiary,
  },
});
