import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  Image,
  Modal,
  Animated,
  Easing,
  StyleSheet,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  ArrowCounterClockwise,
  Banknote,
  ClockCounterClockwise,
  Gear,
  Image as ImageIcon,
  Plus,
  Sparkle,
  X,
} from '@/components/Icon';
import { PressableScale } from '@/components/PressableScale';
import { ScreenHeader } from '@/components/ScreenHeader';
import {
  acceptDeposit as acceptDepositState,
  balanceFor,
  canSpendAmount,
  completeDay as completeDayState,
  daysWithSpending,
  depositForDay,
  formatMoney,
  itemsForDay,
  isMilestoneDay,
  lookBack,
  spentForDay,
  STORAGE_KEY,
  totalSpentForItems,
  type SpendItem,
} from '@/lib/prosperity';
import { theme } from '@/lib/constants';
import { useReducedMotion } from '@/lib/useReducedMotion';

/* ──────────────────────────────────────────────────────────── */
/* Types                                                         */
/* ──────────────────────────────────────────────────────────── */

const SAVE_DEBOUNCE_MS = 300;

type ResetSnapshot = {
  day: number;
  totalReceived: number;
  items: SpendItem[];
  accepted: boolean;
};

/* ──────────────────────────────────────────────────────────── */
/* Game helpers                                                  */
/* ──────────────────────────────────────────────────────────── */

const uid = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

/* ──────────────────────────────────────────────────────────── */
/* Screen                                                        */
/* ──────────────────────────────────────────────────────────── */

export default function MoneyGameScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const reduceMotion = useReducedMotion();

  const goHome = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  // game state
  const [day, setDay] = useState(1);
  const [totalReceived, setTotalReceived] = useState(0);
  const [items, setItems] = useState<SpendItem[]>([]);
  const [accepted, setAccepted] = useState(false);

  // persistence
  const [loaded, setLoaded] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ui / form state
  const [showSettings, setShowSettings] = useState(false);
  const [draftDesc, setDraftDesc] = useState('');
  const [draftAmount, setDraftAmount] = useState('');
  const [draftImage, setDraftImage] = useState<string | null>(null);
  const [spendError, setSpendError] = useState('');
  const [focused, setFocused] = useState(false);
  const [resetSnapshot, setResetSnapshot] = useState<ResetSnapshot | null>(null);

  // which day's spending the list is showing (defaults to the live day)
  const [viewDay, setViewDay] = useState(1);

  const scrollRef = useRef<ScrollView>(null);

  // derived
  const todaysDeposit = depositForDay(day);
  const totalSpent = useMemo(() => totalSpentForItems(items), [items]);
  const balance = balanceFor(totalReceived, totalSpent);
  const spentToday = useMemo(() => spentForDay(items, day), [items, day]);

  // history browsing
  const isViewingToday = viewDay === day;
  const viewItems = useMemo(() => itemsForDay(items, viewDay), [items, viewDay]);
  const spentOnViewDay = useMemo(() => spentForDay(items, viewDay), [items, viewDay]);
  const summary = useMemo(() => lookBack(items, day), [items, day]);
  const dayChips = useMemo(() => {
    const past = daysWithSpending(items).filter((d) => d < day);
    return [day, ...past].map((d) => ({
      day: d,
      label: d === day ? 'Today' : `Day ${d}`,
      total: spentForDay(items, d),
    }));
  }, [items, day]);
  const parsedAmount = parseInt((draftAmount || '').replace(/[^0-9]/g, ''), 10) || 0;
  const amountExceedsBalance = parsedAmount > balance;
  const canAdd = draftDesc.trim().length > 0 && canSpendAmount(balance, parsedAmount);
  // Quick-fill always uses the full bank balance — never the day's leftover, and
  // never more than you actually have. Hidden once the input already equals it.
  const canQuickFill = balance > 0 && parsedAmount !== balance;
  const spendErrorText = amountExceedsBalance
    ? `You only have ${formatMoney(balance)} in the bank.`
    : spendError;
  const meterPct = todaysDeposit ? Math.min(1, Math.max(0, spentToday / todaysDeposit)) : 0;

  // Live, balance-aware prompt for the spend input (falls back when empty).
  const spendPlaceholder =
    balance > 0
      ? `You have ${formatMoney(balance)} to spend. On what?`
      : 'Accept a deposit before spending.';

  // balance "pop" whenever it changes (skipped under Reduce Motion)
  const balanceScale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (reduceMotion) {
      balanceScale.setValue(1);
      return;
    }
    Animated.sequence([
      Animated.timing(balanceScale, {
        toValue: 1.06,
        duration: 150,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(balanceScale, {
        toValue: 1,
        duration: 250,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [balance, balanceScale, reduceMotion]);

  /* ── persistence (load once, then debounced save) ──────────── */

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (cancelled || !raw) return;
        try {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            if (typeof parsed.day === 'number') {
              setDay(parsed.day);
              setViewDay(parsed.day);
            }
            if (typeof parsed.totalReceived === 'number')
              setTotalReceived(parsed.totalReceived);
            if (Array.isArray(parsed.items)) setItems(parsed.items);
            if (typeof parsed.accepted === 'boolean') setAccepted(parsed.accepted);
          }
        } catch {
          // start fresh on parse error
        }
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!loaded) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ day, totalReceived, items, accepted }),
      ).catch(() => {});
    }, SAVE_DEBOUNCE_MS);
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [day, totalReceived, items, accepted, loaded]);

  /* ── actions ───────────────────────────────────────────────── */

  const handleAddItem = () => {
    if (amountExceedsBalance) {
      setSpendError(`You only have ${formatMoney(balance)} in the bank.`);
      return;
    }
    if (!canAdd) return;
    setItems((prev) => [
      ...prev,
      {
        id: uid(),
        description: draftDesc.trim(),
        amount: parsedAmount,
        image: draftImage,
        day,
      },
    ]);
    setDraftDesc('');
    setDraftAmount('');
    setDraftImage(null);
    setSpendError('');
    requestAnimationFrame(() => scrollRef.current?.scrollTo({ y: 0, animated: true }));
  };

  const handlePickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!res.canceled && res.assets && res.assets[0]) {
      setDraftImage(res.assets[0].uri);
    }
  };

  const handleRemoveItem = (id: string) =>
    setItems((prev) => prev.filter((it) => it.id !== id));

  const handleUseBalance = () => {
    if (balance > 0) {
      setDraftAmount(String(balance));
      setSpendError('');
    }
  };

  const acceptDeposit = () => {
    const next = acceptDepositState({ day, totalReceived, items, accepted });
    setAccepted(next.accepted);
    setTotalReceived(next.totalReceived);
  };

  const handleAdvanceDay = () => {
    if (!accepted) return;
    const next = completeDayState({ day, totalReceived, items, accepted });
    setDay(next.day);
    setViewDay(next.day);
    setAccepted(next.accepted);
    setDraftDesc('');
    setDraftAmount('');
    setDraftImage(null);
    setSpendError('');
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  const handleReset = () => {
    setResetSnapshot({ day, totalReceived, items, accepted });
    setDay(1);
    setViewDay(1);
    setTotalReceived(0);
    setItems([]);
    setAccepted(false);
  };

  const handleUndoReset = () => {
    if (!resetSnapshot) return;
    setDay(resetSnapshot.day);
    setViewDay(resetSnapshot.day);
    setTotalReceived(resetSnapshot.totalReceived);
    setItems(resetSnapshot.items);
    setAccepted(resetSnapshot.accepted);
    setResetSnapshot(null);
  };

  /* ── render ─────────────────────────────────────────────────── */

  return (
    <View style={styles.screen}>
      {/* ── Fixed deposit header ─────────────────────────────── */}
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <ScreenHeader
          title="Prosperity Game"
          onBack={goHome}
          style={styles.headerRow}
          leftStyle={styles.headerLeft}
          backButtonStyle={styles.backBtn}
          titleStyle={styles.title}
          iconColor={colors.textPrimary}
          rightAccessory={
            <Pressable
              onPress={() => setShowSettings(true)}
              style={styles.gearBtn}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Adjust your game"
            >
              <Gear size={20} color={colors.textMuted} />
            </Pressable>
          }
        />

        {!accepted && (
          <DepositNotification
            day={day}
            amount={todaysDeposit}
            milestone={isMilestoneDay(day)}
            onAccept={acceptDeposit}
          />
        )}

        <View style={styles.statsRow}>
          <View>
            <Text style={styles.statLabel}>BALANCE</Text>
            <Animated.Text
              style={[styles.balanceValue, { transform: [{ scale: balanceScale }] }]}
            >
              {formatMoney(balance)}
            </Animated.Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.statLabel}>DAY {day} DEPOSIT</Text>
            <Text style={styles.depositValue}>{formatMoney(todaysDeposit)}</Text>
          </View>
        </View>

        <View style={styles.meterTrack}>
          <View style={[styles.meterFill, { width: `${meterPct * 100}%` }]} />
        </View>
        <View style={styles.meterRow}>
          <Text style={styles.meterLabel}>Spent today {formatMoney(spentToday)}</Text>
          <Text style={styles.meterLabel}>Total received {formatMoney(totalReceived)}</Text>
        </View>

        <PressableScale
          onPress={handleAdvanceDay}
          disabled={!accepted}
          style={styles.completeBtn}
          pressedStyle={styles.completeBtnPressed}
          disabledStyle={styles.completeBtnDisabled}
          accessibilityLabel={accepted ? `Complete day ${day}` : 'Accept deposit before completing the day'}
        >
          <Text style={styles.completeBtnText}>
            {accepted ? `Complete Day ${day}` : 'Accept Deposit First'}
          </Text>
          <Text style={styles.completeBtnArrow}>{accepted ? '→' : ''}</Text>
        </PressableScale>
      </View>

      {/* ── Scrolling list ───────────────────────────────────── */}
      <ScrollView
        ref={scrollRef}
        style={styles.list}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + space.xl }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
      >
        {day > 1 && (
          <View style={styles.lookBackCard}>
            <View style={styles.lookBackHeader}>
              <ClockCounterClockwise size={15} color={colors.textMuted} />
              <Text style={styles.lookBackTitle}>LOOKING BACK</Text>
            </View>
            <View style={styles.lookBackRow}>
              <LookBackStat label="Day before" value={summary.yesterday} />
              <LookBackStat label="Last 7 days" value={summary.last7} />
              <LookBackStat label="Last 30 days" value={summary.last30} />
            </View>
          </View>
        )}

        {dayChips.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.historyChipsScroll}
            contentContainerStyle={styles.historyChipsRow}
          >
            {dayChips.map((chip) => {
              const isActive = chip.day === viewDay;
              return (
                <Pressable
                  key={chip.day}
                  onPress={() => setViewDay(chip.day)}
                  style={({ pressed }) => [
                    styles.historyChip,
                    isActive && styles.historyChipActive,
                    pressed && !isActive && styles.historyChipPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                  accessibilityLabel={`${chip.label}, spent ${formatMoney(chip.total)}`}
                >
                  <Text
                    style={[styles.historyChipText, isActive && styles.historyChipTextActive]}
                  >
                    {chip.label}
                  </Text>
                  <Text
                    style={[styles.historyChipCount, isActive && styles.historyChipCountActive]}
                  >
                    {formatMoney(chip.total)}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        )}

        {isViewingToday ? (
          <View style={styles.composerInline}>
            <View style={[styles.inputCard, focused && styles.inputCardFocused]}>
              <TextInput
                value={draftDesc}
                onChangeText={(text) => {
                  setDraftDesc(text);
                  if (spendError) setSpendError('');
                }}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                onSubmitEditing={handleAddItem}
                onKeyPress={(e) => {
                  const ev = e.nativeEvent as unknown as {
                    key: string;
                    shiftKey?: boolean;
                    preventDefault?: () => void;
                  };
                  // Enter adds the entry; Shift+Enter inserts a newline.
                  if (ev.key === 'Enter' && !ev.shiftKey) {
                    ev.preventDefault?.();
                    handleAddItem();
                  }
                }}
                placeholder={spendPlaceholder}
                placeholderTextColor={colors.textMuted}
                multiline
                blurOnSubmit={false}
                returnKeyType="done"
                {...({ enterKeyHint: 'done' } as object)}
                textAlignVertical="top"
                style={styles.descInput}
                maxLength={200}
                accessibilityLabel="Spending description"
              />

              {draftImage && (
                <View style={styles.thumbWrap}>
                  <Image source={{ uri: draftImage }} style={styles.thumb} />
                  <Pressable
                    onPress={() => setDraftImage(null)}
                    style={styles.thumbRemove}
                    hitSlop={12}
                    accessibilityRole="button"
                    accessibilityLabel="Remove picture"
                  >
                    <X size={14} color={colors.primaryText} />
                  </Pressable>
                </View>
              )}

              <View style={styles.composerActions}>
                {/* amount, flush left */}
                <View style={styles.amountRow}>
                  <Text style={styles.amountPrefix}>$</Text>
                  <TextInput
                    value={draftAmount}
                    onChangeText={(t) => {
                      setDraftAmount(t.replace(/[^0-9]/g, ''));
                      if (spendError) setSpendError('');
                    }}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    onSubmitEditing={handleAddItem}
                    placeholder="0"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="number-pad"
                    returnKeyType="done"
                    style={styles.amountInput}
                    accessibilityLabel="Spending amount"
                  />
                </View>

                {/* grouped controls: photo + use balance */}
                <View style={styles.groupedControls}>
                  <Pressable
                    onPress={handlePickImage}
                    style={styles.photoBtn}
                    hitSlop={4}
                    accessibilityRole="button"
                    accessibilityLabel="Add a picture"
                  >
                    <ImageIcon size={18} color={colors.sageDark} />
                  </Pressable>
                  {canQuickFill && (
                    <Pressable
                      onPress={handleUseBalance}
                      style={({ pressed }) => [styles.restBtn, pressed && { opacity: 0.7 }]}
                      accessibilityRole="button"
                      accessibilityLabel={`Use full balance, ${formatMoney(balance)}`}
                    >
                      <Text style={styles.restBtnText}>Use balance</Text>
                    </Pressable>
                  )}
                </View>

                <PressableScale
                  onPress={handleAddItem}
                  disabled={!canAdd}
                  hitSlop={8}
                  style={styles.addBtn}
                  disabledStyle={styles.addBtnDisabled}
                  accessibilityLabel="Add to today's list"
                >
                  <Plus size={20} color={colors.primaryText} />
                </PressableScale>
              </View>
              {!!spendErrorText && <Text style={styles.spendError}>{spendErrorText}</Text>}
            </View>
          </View>
        ) : (
          <View style={styles.pastHintInline}>
            <Text style={styles.pastHintText}>
              Viewing Day {viewDay} · spent {formatMoney(spentOnViewDay)}
            </Text>
            <Pressable
              onPress={() => setViewDay(day)}
              style={({ pressed }) => [styles.pastHintBtn, pressed && { opacity: 0.7 }]}
              accessibilityRole="button"
              accessibilityLabel="Back to today"
            >
              <ArrowCounterClockwise size={15} color={colors.sageDark} />
              <Text style={styles.pastHintBtnText}>Back to today</Text>
            </Pressable>
          </View>
        )}

        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>
            {isViewingToday ? "Today's spending" : `Day ${viewDay} spending`}
          </Text>
          {viewItems.length > 0 && (
            <View style={styles.countPill}>
              <Text style={styles.countPillText}>{viewItems.length}</Text>
            </View>
          )}
        </View>

        {viewItems.length === 0 ? (
          <EmptyState
            dayDeposit={depositForDay(viewDay)}
            day={viewDay}
            viewingPast={!isViewingToday}
          />
        ) : (
          <View style={{ gap: space.sm }}>
            {[...viewItems].reverse().map((it) => (
              <SpendRow
                key={it.id}
                item={it}
                onRemove={isViewingToday ? () => handleRemoveItem(it.id) : undefined}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* ── Settings sheet ───────────────────────────────────── */}
      <SettingsSheet
        visible={showSettings}
        day={day}
        bankBalance={balance}
        onDayChange={(n) => {
          setDay(n);
          setViewDay(n);
        }}
        onBalanceChange={(v) => setTotalReceived(v + totalSpent)}
        onReset={handleReset}
        onUndo={handleUndoReset}
        onClose={() => {
          setResetSnapshot(null);
          setShowSettings(false);
        }}
      />
    </View>
  );
}

/* ──────────────────────────────────────────────────────────── */
/* Deposit notification                                          */
/* ──────────────────────────────────────────────────────────── */

function DepositNotification({
  day,
  amount,
  milestone,
  onAccept,
}: {
  day: number;
  amount: number;
  milestone: boolean;
  onAccept: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const enter = useRef(new Animated.Value(0)).current; // 0 → 1 entrance
  const exit = useRef(new Animated.Value(0)).current; // 0 → 1 exit
  const float = useRef(new Animated.Value(0)).current; // badge float loop
  const shimmer = useRef(new Animated.Value(0)).current; // one-time sweep
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (reduceMotion) {
      enter.setValue(1); // present, settled — no slide, shimmer, or float
      exit.setValue(0);
      float.setValue(0);
      shimmer.setValue(1);
      return;
    }

    Animated.timing(enter, {
      toValue: 1,
      duration: 450,
      easing: Easing.bezier(0.23, 1, 0.32, 1),
      useNativeDriver: true,
    }).start();

    Animated.timing(shimmer, {
      toValue: 1,
      duration: 1100,
      delay: 250,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(float, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(float, {
          toValue: 0,
          duration: 1600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [enter, shimmer, float, reduceMotion]);

  const accept = () => {
    if (exiting) return;
    setExiting(true);
    if (reduceMotion) {
      onAccept(); // no exit animation — commit immediately
      return;
    }
    Animated.timing(exit, {
      toValue: 1,
      duration: 420,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => onAccept());
  };

  const t = milestone ? notifyTheme.milestone : notifyTheme.regular;

  const translateY = Animated.add(
    enter.interpolate({ inputRange: [0, 1], outputRange: [-14, 0] }),
    exit.interpolate({ inputRange: [0, 1], outputRange: [0, -8] }),
  );
  const opacity = exit.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });
  const floatY = float.interpolate({ inputRange: [0, 1], outputRange: [0, -2] });
  const shimmerX = shimmer.interpolate({ inputRange: [0, 1], outputRange: [-160, 360] });

  return (
    <Animated.View style={[styles.notifyOuter, { opacity, transform: [{ translateY }] }]}>
      <LinearGradient
        colors={t.bg}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.notifyCard, { borderColor: t.border }]}
      >
        {/* one-time light shimmer */}
        {!exiting && !reduceMotion && (
          <Animated.View
            style={[styles.shimmer, { transform: [{ translateX: shimmerX }, { skewX: '-16deg' }] }]}
          >
            <LinearGradient
              colors={['transparent', t.shimmer, 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ flex: 1 }}
            />
          </Animated.View>
        )}

        {/* sparkle badge with banknote */}
        <Animated.View
          style={[
            styles.notifyBadge,
            { backgroundColor: t.badgeBg, borderColor: t.badgeBorder, transform: [{ translateY: floatY }] },
          ]}
        >
          <Banknote size={22} color={t.badgeIcon} />
        </Animated.View>

        {/* text */}
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[styles.notifyLabel, { color: t.label }]}>
            {milestone ? `MILESTONE · DAY ${day}` : 'YOUR DEPOSIT IS READY'}
          </Text>
          <Text style={[styles.notifyAmount, { color: t.amount }]}>{formatMoney(amount)}</Text>
        </View>

        {/* accept */}
        <PressableScale
          onPress={accept}
          style={[styles.notifyBtn, { backgroundColor: t.btnBg }]}
          pressedStyle={{ opacity: 0.85 }}
          accessibilityLabel="Accept deposit"
        >
          <Text style={[styles.notifyBtnText, { color: t.btnColor }]}>
            {exiting ? 'Received ✓' : 'Accept'}
          </Text>
        </PressableScale>
      </LinearGradient>
    </Animated.View>
  );
}

/* ──────────────────────────────────────────────────────────── */
/* Spend row                                                     */
/* ──────────────────────────────────────────────────────────── */

function SpendRow({ item, onRemove }: { item: SpendItem; onRemove?: () => void }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowTile}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.rowTileImg} />
        ) : (
          <View style={{ opacity: 0.6 }}>
            <Sparkle size={20} color={colors.sageDark} />
          </View>
        )}
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 6 }}>
        <Text style={styles.rowText}>{item.description}</Text>
        <View style={styles.rowChip}>
          <Text style={styles.rowChipText}>{formatMoney(item.amount)}</Text>
        </View>
      </View>
      {onRemove && (
        <Pressable
          onPress={onRemove}
          style={styles.removeBtn}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${item.description}`}
        >
          <X size={16} color={colors.textMuted} />
        </Pressable>
      )}
    </View>
  );
}

/* A single look-back stat (label + money), used in the history summary card. */
function LookBackStat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.lookBackStat}>
      <Text style={styles.lookBackStatLabel}>{label}</Text>
      <Text style={styles.lookBackStatValue}>{formatMoney(value)}</Text>
    </View>
  );
}

/* ──────────────────────────────────────────────────────────── */
/* Empty state                                                   */
/* ──────────────────────────────────────────────────────────── */

function EmptyState({
  dayDeposit,
  day,
  viewingPast = false,
}: {
  dayDeposit: number;
  day?: number;
  viewingPast?: boolean;
}) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyGlyph}>
        <Sparkle size={40} color={colors.sage} />
        <View style={styles.emptySparkTR}>
          <Twinkle duration={2200}>
            <Sparkle size={13} color={colors.sage} />
          </Twinkle>
        </View>
        <View style={styles.emptySparkBL}>
          <Twinkle duration={1700} delay={400}>
            <Sparkle size={9} color={colors.sage} />
          </Twinkle>
        </View>
      </View>
      {viewingPast ? (
        <>
          <Text style={styles.emptyTitle}>Nothing recorded for Day {day}</Text>
          <Text style={styles.emptyBody}>No spending was logged on this day.</Text>
        </>
      ) : (
        <>
          <Text style={styles.emptyTitle}>{formatMoney(dayDeposit)} is waiting</Text>
          <Text style={styles.emptyBody}>
            Start small or start big. A dinner. A donation. The house. The point is the feeling
            of having it.
          </Text>
        </>
      )}
    </View>
  );
}

/* ──────────────────────────────────────────────────────────── */
/* Settings sheet                                                */
/* ──────────────────────────────────────────────────────────── */

function SettingsSheet({
  visible,
  day,
  bankBalance,
  onDayChange,
  onBalanceChange,
  onReset,
  onUndo,
  onClose,
}: {
  visible: boolean;
  day: number;
  bankBalance: number;
  onDayChange: (n: number) => void;
  onBalanceChange: (n: number) => void;
  onReset: () => void;
  onUndo: () => void;
  onClose: () => void;
}) {
  const [dayDraft, setDayDraft] = useState(String(day));
  const [balanceDraft, setBalanceDraft] = useState(String(bankBalance));
  const [justReset, setJustReset] = useState(false);
  const [prevDrafts, setPrevDrafts] = useState<{ day: string; balance: string } | null>(null);

  // re-sync drafts whenever the sheet opens
  useEffect(() => {
    if (visible) {
      setDayDraft(String(day));
      setBalanceDraft(String(bankBalance));
      setJustReset(false);
      setPrevDrafts(null);
    }
  }, [visible, day, bankBalance]);

  const commitDay = () => {
    const n = parseInt(dayDraft, 10);
    if (Number.isFinite(n) && n >= 1) onDayChange(n);
    else setDayDraft(String(day));
  };
  const commitBalance = () => {
    const n = parseInt(balanceDraft, 10);
    if (Number.isFinite(n) && n >= 0) onBalanceChange(n);
    else setBalanceDraft(String(bankBalance));
  };

  const handleReset = () => {
    setPrevDrafts({ day: dayDraft, balance: balanceDraft });
    onReset();
    setDayDraft('1');
    setBalanceDraft('0');
    setJustReset(true);
  };
  const handleUndo = () => {
    onUndo();
    if (prevDrafts) {
      setDayDraft(prevDrafts.day);
      setBalanceDraft(prevDrafts.balance);
    }
    setJustReset(false);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.sheetRoot}>
        <Pressable style={styles.sheetScrim} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.sheetGrabber} />
          <View style={styles.sheetTitleRow}>
            <Text style={styles.sheetTitle}>Adjust your game</Text>
            <Pressable
              onPress={onClose}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Close settings"
            >
              <X size={20} color={colors.textMuted} />
            </Pressable>
          </View>

          <View style={styles.sheetFields}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingsLabel}>CURRENT DAY</Text>
              <TextInput
                value={dayDraft}
                onChangeText={(t) => setDayDraft(t.replace(/[^0-9]/g, ''))}
                keyboardType="number-pad"
                style={styles.settingsInput}
                accessibilityLabel="Current day"
              />
              <Text style={styles.settingsHint}>
                Deposit: {formatMoney(depositForDay(parseInt(dayDraft, 10) || 0))}
              </Text>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.settingsLabel}>BALANCE</Text>
              <View style={styles.settingsAmountRow}>
                <Text style={styles.settingsAmountPrefix}>$</Text>
                <TextInput
                  value={balanceDraft}
                  onChangeText={(t) => setBalanceDraft(t.replace(/[^0-9]/g, ''))}
                  keyboardType="number-pad"
                  style={styles.settingsAmountInput}
                  accessibilityLabel="Current balance"
                />
              </View>
              <Text style={styles.settingsHint}>Your running total.</Text>
            </View>
          </View>

          <View style={styles.sheetFooter}>
            {justReset ? (
              <Pressable
                onPress={handleUndo}
                style={({ pressed }) => [styles.undoBtn, pressed && { opacity: 0.7 }]}
              >
                <ArrowCounterClockwise size={15} color={colors.sageDark} />
                <Text style={styles.undoBtnText}>Undo reset</Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={handleReset}
                style={({ pressed }) => [styles.resetBtn, pressed && { opacity: 0.7 }]}
              >
                <Text style={styles.resetBtnText}>Reset game</Text>
              </Pressable>
            )}
            <PressableScale
              onPress={() => {
                commitDay();
                commitBalance();
                onClose();
              }}
              style={styles.saveBtn}
              pressedStyle={styles.saveBtnPressed}
              accessibilityLabel="Save settings"
            >
              <Text style={styles.saveBtnText}>Save</Text>
            </PressableScale>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/* ──────────────────────────────────────────────────────────── */
/* Looping twinkle wrapper                                       */
/* ──────────────────────────────────────────────────────────── */

function Twinkle({
  children,
  duration,
  delay = 0,
}: {
  children: React.ReactNode;
  duration: number;
  delay?: number;
}) {
  const reduceMotion = useReducedMotion();
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduceMotion) {
      v.setValue(1); // hold steady at full brightness — no twinkle loop
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, {
          toValue: 1,
          duration: duration / 2,
          delay,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(v, {
          toValue: 0,
          duration: duration / 2,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [v, duration, delay, reduceMotion]);
  const opacity = v.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });
  const scale = v.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] });
  return <Animated.View style={{ opacity, transform: [{ scale }] }}>{children}</Animated.View>;
}

/* ──────────────────────────────────────────────────────────── */
/* Tokens — local names mapped onto the shared design system      */
/* (lib/constants.ts) so this screen stays in sync with the app.  */
/* ──────────────────────────────────────────────────────────── */

const colors = {
  background: theme.colors.background,
  surface: theme.colors.white,
  surfaceWarm: theme.colors.surface,
  textPrimary: theme.colors.text,
  textSecondary: theme.colors.textBody,
  textMuted: theme.colors.textLight,
  eyebrow: theme.colors.highlight,
  accent: theme.colors.highlight,
  primary: theme.colors.cta,
  primaryPressed: theme.colors.ctaHover,
  primaryText: theme.colors.background,
  disabled: theme.colors.disabled,
  error: theme.colors.error,
  secondaryBorder: theme.colors.border,
  divider: theme.colors.border,
  sage: theme.colors.sage,
  sageDark: theme.colors.success,
  sageTint: 'rgba(130,157,148,0.16)',
  meterTrack: 'rgba(130,157,148,0.18)',
  tierRebirth: theme.colors.tierRebirth,
};

const space = theme.spacing;
const radius = { ...theme.borderRadius, pill: theme.borderRadius.full };

const fonts = {
  serif: theme.fontFamily.serifSemiBold,
  regular: theme.fontFamily.regular,
  medium: theme.fontFamily.medium,
  semiBold: theme.fontFamily.semiBold,
  bold: theme.fontFamily.bold,
};

const notifyTheme = {
  milestone: {
    bg: ['#4A2A16', '#2E170E'] as const,
    border: 'rgba(232,153,106,0.30)',
    label: '#E8995F',
    amount: '#FDFBFA',
    badgeBg: 'rgba(232,153,106,0.16)',
    badgeBorder: 'rgba(232,153,106,0.42)',
    badgeIcon: '#E8995F',
    btnBg: '#FDFBFA',
    btnColor: colors.tierRebirth,
    shimmer: 'rgba(232,153,106,0.22)',
  },
  regular: {
    bg: ['#FCF6EE', '#F2E5D3'] as const,
    border: 'rgba(181,102,58,0.22)',
    label: colors.eyebrow,
    amount: colors.accent,
    badgeBg: 'rgba(181,102,58,0.10)',
    badgeBorder: 'rgba(181,102,58,0.26)',
    badgeIcon: colors.accent,
    btnBg: colors.primary,
    btnColor: '#FDFBFA',
    shimmer: 'rgba(255,255,255,0.55)',
  },
};

const noOutline = Platform.select({ web: { outlineStyle: 'none' as any }, default: {} });

/* ──────────────────────────────────────────────────────────── */
/* Styles                                                        */
/* ──────────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },

  /* Header */
  header: {
    paddingHorizontal: space.lg,
    paddingBottom: 22,
    backgroundColor: colors.surfaceWarm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: space.xl,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    flexShrink: 1,
    minWidth: 0,
  },
  backBtn: {
    width: 34,
    height: 34,
    marginLeft: -8,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: 25,
    fontWeight: '600',
    letterSpacing: -0.4,
    color: colors.textPrimary,
  },
  gearBtn: {
    width: 34,
    height: 34,
    marginRight: -6,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },

  statsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: space.md,
  },
  statLabel: {
    fontFamily: fonts.bold,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: colors.textMuted,
    marginBottom: 3,
  },
  balanceValue: {
    fontFamily: fonts.serif,
    fontSize: 40,
    lineHeight: 44,
    fontWeight: '600',
    color: colors.accent,
    letterSpacing: -1,
  },
  depositValue: {
    fontFamily: fonts.serif,
    fontSize: 22,
    fontWeight: '600',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },

  meterTrack: {
    height: 6,
    backgroundColor: colors.meterTrack,
    borderRadius: radius.pill,
    overflow: 'hidden',
    marginBottom: space.sm,
  },
  meterFill: { height: '100%', backgroundColor: colors.sage, borderRadius: radius.pill },
  meterRow: { flexDirection: 'row', justifyContent: 'space-between' },
  meterLabel: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted },

  completeBtn: {
    marginTop: space.lg,
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOpacity: 0.2,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: 3 },
      default: { boxShadow: '0 4px 12px rgba(92,72,60,0.20)' as any },
    }),
  },
  completeBtnPressed: { backgroundColor: colors.primaryPressed },
  completeBtnDisabled: {
    backgroundColor: colors.disabled,
    ...Platform.select({
      ios: { shadowOpacity: 0 },
      android: { elevation: 0 },
      default: { boxShadow: 'none' as any },
    }),
  },
  completeBtnText: { fontFamily: fonts.semiBold, fontSize: 14, fontWeight: '600', color: colors.primaryText },
  completeBtnArrow: { fontSize: 15, lineHeight: 15, color: 'rgba(253,251,250,0.7)' },

  /* Notification */
  notifyOuter: { marginBottom: space.md },
  notifyCard: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: '42%',
    pointerEvents: 'none',
  },
  notifyBadge: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifyLabel: {
    fontFamily: fonts.bold,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.6,
    marginBottom: 3,
  },
  notifyAmount: { fontFamily: fonts.serif, fontSize: 24, lineHeight: 26, fontWeight: '600', letterSpacing: -0.5 },
  notifyBtn: { paddingVertical: 10, paddingHorizontal: 18, borderRadius: radius.pill },
  notifyBtnText: { fontFamily: fonts.bold, fontSize: 13, fontWeight: '700' },

  /* List */
  list: { flex: 1 },
  listContent: {
    paddingHorizontal: space.lg,
    paddingTop: space.lg,
  },
  listHeader: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginBottom: space.md },
  listTitle: { fontFamily: fonts.semiBold, fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  countPill: {
    minWidth: 22,
    height: 22,
    borderRadius: radius.pill,
    backgroundColor: colors.sage,
    paddingHorizontal: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countPillText: { fontFamily: fonts.bold, fontSize: 11, fontWeight: '700', color: '#fff' },

  /* Look-back summary */
  lookBackCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.secondaryBorder,
    borderRadius: radius.lg,
    paddingHorizontal: space.md,
    paddingVertical: space.md,
    marginBottom: space.md,
  },
  lookBackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: space.sm,
  },
  lookBackTitle: {
    fontFamily: fonts.bold,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: colors.textMuted,
  },
  lookBackRow: { flexDirection: 'row', justifyContent: 'space-between', gap: space.sm },
  lookBackStat: { flex: 1, minWidth: 0 },
  lookBackStatLabel: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 2,
  },
  lookBackStatValue: {
    fontFamily: fonts.serif,
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    letterSpacing: -0.4,
  },

  /* History day chips */
  historyChipsScroll: { flexGrow: 0, marginBottom: space.md },
  historyChipsRow: { flexDirection: 'row', alignItems: 'center', gap: space.xs + 2 },
  historyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.secondaryBorder,
    backgroundColor: 'transparent',
  },
  historyChipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  historyChipPressed: { backgroundColor: colors.surfaceWarm },
  historyChipText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
  },
  historyChipTextActive: { color: '#fff' },
  historyChipCount: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    lineHeight: 14,
    color: colors.textMuted,
  },
  historyChipCountActive: { color: 'rgba(255,255,255,0.82)' },

  /* Past-day hint card (replaces the composer when browsing history) */
  pastHintInline: {
    backgroundColor: colors.surfaceWarm,
    borderWidth: 1,
    borderColor: colors.secondaryBorder,
    borderRadius: radius.lg,
    paddingHorizontal: space.md,
    paddingVertical: space.sm + 2,
    marginBottom: space.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.sm,
  },
  pastHintText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.textSecondary,
    flexShrink: 1,
    minWidth: 0,
  },
  pastHintBtn: {
    height: 40,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.sage,
    backgroundColor: colors.sageTint,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  pastHintBtnText: { fontFamily: fonts.semiBold, fontSize: 13, fontWeight: '600', color: colors.sageDark },

  /* Row */
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.secondaryBorder,
    ...Platform.select({
      ios: {
        shadowColor: colors.textPrimary,
        shadowOpacity: 0.04,
        shadowRadius: 2,
        shadowOffset: { width: 0, height: 1 },
      },
      android: { elevation: 1 },
      default: { boxShadow: '0 1px 2px rgba(89,59,46,0.04)' as any },
    }),
  },
  rowTile: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surfaceWarm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTileImg: { width: '100%', height: '100%' },
  rowText: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: colors.textPrimary },
  rowChip: {
    alignSelf: 'flex-start',
    backgroundColor: colors.sageTint,
    paddingVertical: 2,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
  },
  rowChipText: { fontFamily: fonts.serif, fontSize: 13, fontWeight: '600', color: colors.sageDark },
  removeBtn: { width: 26, height: 26, alignItems: 'center', justifyContent: 'center' },

  /* Empty state */
  empty: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.secondaryBorder,
    borderStyle: 'dashed',
    paddingVertical: 28,
    paddingHorizontal: space.lg,
    alignItems: 'center',
    marginBottom: space.xl,
  },
  emptyGlyph: { width: 56, height: 48, marginBottom: space.md, alignItems: 'center', justifyContent: 'center' },
  emptySparkTR: { position: 'absolute', top: 2, right: 4 },
  emptySparkBL: { position: 'absolute', bottom: 4, left: 6 },
  emptyTitle: { fontFamily: fonts.semiBold, fontSize: 17, fontWeight: '600', color: colors.textPrimary, marginBottom: space.xs },
  emptyBody: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 300,
  },

  /* Composer */
  composerInline: {
    marginBottom: space.lg,
  },
  inputCard: {
    borderWidth: 1.5,
    borderColor: colors.secondaryBorder,
    borderRadius: radius.lg,
    padding: 12,
  },
  inputCardFocused: { borderColor: colors.primary },
  descInput: {
    height: 59,
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 21,
    color: colors.textPrimary,
    ...noOutline,
  },
  thumbWrap: { alignSelf: 'flex-start', marginTop: space.sm },
  thumb: { width: 72, height: 72, borderRadius: radius.md },
  thumbRemove: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },

  composerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    marginTop: space.sm,
    paddingTop: space.sm,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  amountRow: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 2 },
  amountPrefix: { fontFamily: fonts.semiBold, fontSize: 18, fontWeight: '600', color: colors.textMuted },
  amountInput: { flex: 1, fontFamily: fonts.semiBold, fontSize: 18, fontWeight: '600', color: colors.textPrimary, ...noOutline },
  groupedControls: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  photoBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.secondaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restBtn: {
    height: 38,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceWarm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restBtnText: { fontFamily: fonts.semiBold, fontSize: 13, fontWeight: '600', color: colors.eyebrow },
  spendError: {
    marginTop: space.sm,
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 16,
    color: colors.error,
  },
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnDisabled: { backgroundColor: colors.disabled },

  /* Settings sheet */
  sheetRoot: {
    flex: 1,
    justifyContent: 'flex-end',
    // On desktop web the Modal escapes the app column, so re-center its
    // contents to keep the mobile-width feel.
    ...Platform.select({ web: { alignItems: 'center' }, default: {} }),
  },
  sheetScrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(42,26,16,0.35)' },
  sheet: {
    width: '100%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: space.lg,
    paddingTop: 20,
    paddingBottom: 32,
    gap: space.md,
    ...Platform.select({ web: { maxWidth: 420 }, default: {} }),
  },
  sheetGrabber: { width: 36, height: 4, borderRadius: radius.pill, backgroundColor: colors.secondaryBorder, alignSelf: 'center' },
  sheetTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sheetTitle: { fontFamily: fonts.semiBold, fontSize: 18, fontWeight: '600', color: colors.textPrimary },
  sheetClose: { fontSize: 24, lineHeight: 24, color: colors.textMuted },
  sheetFields: { flexDirection: 'row', gap: space.md },
  settingsLabel: {
    fontFamily: fonts.bold,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
    color: colors.textMuted,
    marginBottom: space.sm,
  },
  settingsInput: {
    fontFamily: fonts.semiBold,
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: colors.surfaceWarm,
    borderRadius: radius.md,
    ...noOutline,
  },
  settingsAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceWarm,
    borderRadius: radius.md,
    paddingLeft: 16,
  },
  settingsAmountPrefix: { fontFamily: fonts.semiBold, fontSize: 20, fontWeight: '600', color: colors.textMuted, marginRight: 4 },
  settingsAmountInput: {
    flex: 1,
    fontFamily: fonts.semiBold,
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    paddingVertical: 10,
    paddingRight: 16,
    ...noOutline,
  },
  settingsHint: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted, marginTop: space.xs, lineHeight: 16 },

  sheetFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
    marginTop: space.xs,
  },
  resetBtn: {
    height: 46,
    paddingHorizontal: 18,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.secondaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetBtnText: { fontFamily: fonts.semiBold, fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  undoBtn: {
    height: 46,
    paddingHorizontal: 18,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.sage,
    backgroundColor: colors.sageTint,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  undoBtnText: { fontFamily: fonts.semiBold, fontSize: 13, fontWeight: '600', color: colors.sageDark },
  saveBtn: {
    height: 46,
    paddingHorizontal: 28,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnPressed: { backgroundColor: colors.primaryPressed },
  saveBtnText: { fontFamily: fonts.semiBold, fontSize: 15, fontWeight: '600', color: colors.primaryText },
});
