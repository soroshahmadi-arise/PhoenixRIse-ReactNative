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
  KeyboardAvoidingView,
} from 'react-native';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { STORAGE_KEY, type SpendItem } from '@/lib/prosperity';
import { theme } from '@/lib/constants';

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

const DEPOSIT_STEP = 1000;

/** Deposit for a given day: $1,000 × day. */
const depositForDay = (day: number) => Math.max(0, day) * DEPOSIT_STEP;

const formatMoney = (n: number) => '$' + Math.round(n).toLocaleString('en-US');

const uid = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

/** Days worth celebrating as the deposit climbs. */
const isMilestone = (d: number) =>
  d === 5 || d === 10 || (d % 25 === 0 && d > 0);

/* ──────────────────────────────────────────────────────────── */
/* Screen                                                        */
/* ──────────────────────────────────────────────────────────── */

export default function MoneyGameScreen() {
  const insets = useSafeAreaInsets();

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
  const [focused, setFocused] = useState(false);
  const [resetSnapshot, setResetSnapshot] = useState<ResetSnapshot | null>(null);

  const scrollRef = useRef<ScrollView>(null);

  // derived
  const todaysDeposit = depositForDay(day);
  const totalSpent = useMemo(
    () => items.reduce((s, it) => s + it.amount, 0),
    [items],
  );
  const balance = totalReceived - totalSpent;
  const todaysItems = useMemo(
    () => items.filter((it) => it.day === day),
    [items, day],
  );
  const spentToday = todaysItems.reduce((s, it) => s + it.amount, 0);
  const remainingToday = todaysDeposit - spentToday;
  const parsedAmount = parseInt((draftAmount || '').replace(/[^0-9]/g, ''), 10) || 0;
  const canAdd = draftDesc.trim().length > 0 && parsedAmount > 0;
  const meterPct = todaysDeposit ? Math.min(1, Math.max(0, spentToday / todaysDeposit)) : 0;

  // balance "pop" whenever it changes
  const balanceScale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
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
  }, [balance, balanceScale]);

  /* ── persistence (load once, then debounced save) ──────────── */

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (cancelled || !raw) return;
        try {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            if (typeof parsed.day === 'number') setDay(parsed.day);
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

  const handleSpendRest = () => {
    if (remainingToday > 0) setDraftAmount(String(remainingToday));
  };

  const acceptDeposit = () => {
    setAccepted(true);
    setTotalReceived((prev) => prev + todaysDeposit);
  };

  const handleAdvanceDay = () => {
    setDay((d) => d + 1);
    setAccepted(false);
    setDraftDesc('');
    setDraftAmount('');
    setDraftImage(null);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  const handleReset = () => {
    setResetSnapshot({ day, totalReceived, items, accepted });
    setDay(1);
    setTotalReceived(0);
    setItems([]);
    setAccepted(false);
  };

  const handleUndoReset = () => {
    if (!resetSnapshot) return;
    setDay(resetSnapshot.day);
    setTotalReceived(resetSnapshot.totalReceived);
    setItems(resetSnapshot.items);
    setAccepted(resetSnapshot.accepted);
    setResetSnapshot(null);
  };

  /* ── render ─────────────────────────────────────────────────── */

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* ── Fixed deposit header ─────────────────────────────── */}
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Prosperity game</Text>
          <Pressable
            onPress={() => setShowSettings(true)}
            style={styles.gearBtn}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Adjust your game"
          >
            <GearIcon color={colors.textMuted} />
          </Pressable>
        </View>

        {!accepted && (
          <DepositNotification
            day={day}
            amount={todaysDeposit}
            milestone={isMilestone(day)}
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

        <Pressable
          onPress={handleAdvanceDay}
          style={({ pressed }) => [styles.completeBtn, pressed && styles.completeBtnPressed]}
          accessibilityRole="button"
          accessibilityLabel={`Complete day ${day}`}
        >
          <Text style={styles.completeBtnText}>Complete Day {day}</Text>
          <Text style={styles.completeBtnArrow}>→</Text>
        </Pressable>
      </View>

      {/* ── Scrolling list ───────────────────────────────────── */}
      <ScrollView
        ref={scrollRef}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Today's spending</Text>
          {todaysItems.length > 0 && (
            <View style={styles.countPill}>
              <Text style={styles.countPillText}>{todaysItems.length}</Text>
            </View>
          )}
        </View>

        {todaysItems.length === 0 ? (
          <EmptyState dayDeposit={todaysDeposit} />
        ) : (
          <View style={{ gap: space.sm }}>
            {[...todaysItems].reverse().map((it) => (
              <SpendRow key={it.id} item={it} onRemove={() => handleRemoveItem(it.id)} />
            ))}
          </View>
        )}
      </ScrollView>

      {/* ── Sticky composer ──────────────────────────────────── */}
      <View style={[styles.composer, { paddingBottom: insets.bottom + 16 }]}>
        <View style={[styles.inputCard, focused && styles.inputCardFocused]}>
          <TextInput
            value={draftDesc}
            onChangeText={setDraftDesc}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="How would you like to spend your money?"
            placeholderTextColor={colors.textMuted}
            multiline
            textAlignVertical="top"
            style={styles.descInput}
            maxLength={200}
          />

          {draftImage && (
            <View style={styles.thumbWrap}>
              <Image source={{ uri: draftImage }} style={styles.thumb} />
              <Pressable onPress={() => setDraftImage(null)} style={styles.thumbRemove} hitSlop={6}>
                <Text style={styles.thumbRemoveText}>×</Text>
              </Pressable>
            </View>
          )}

          <View style={styles.composerActions}>
            {/* amount, flush left */}
            <View style={styles.amountRow}>
              <Text style={styles.amountPrefix}>$</Text>
              <TextInput
                value={draftAmount}
                onChangeText={(t) => setDraftAmount(t.replace(/[^0-9]/g, ''))}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                onSubmitEditing={handleAddItem}
                placeholder="0"
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
                returnKeyType="done"
                style={styles.amountInput}
              />
            </View>

            {/* grouped controls: photo + spend the rest */}
            <View style={styles.groupedControls}>
              <Pressable
                onPress={handlePickImage}
                style={styles.photoBtn}
                hitSlop={4}
                accessibilityRole="button"
                accessibilityLabel="Add a picture"
              >
                <ImageIcon color={colors.sageDark} />
              </Pressable>
              {remainingToday > 0 && (
                <Pressable
                  onPress={handleSpendRest}
                  style={({ pressed }) => [styles.restBtn, pressed && { opacity: 0.7 }]}
                  accessibilityRole="button"
                  accessibilityLabel="Spend the rest of today"
                >
                  <Text style={styles.restBtnText}>Spend the rest</Text>
                </Pressable>
              )}
            </View>

            <Pressable
              onPress={handleAddItem}
              disabled={!canAdd}
              style={[styles.addBtn, !canAdd && styles.addBtnDisabled]}
              accessibilityRole="button"
              accessibilityLabel="Add to today's list"
            >
              <Text style={styles.addBtnText}>＋</Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* ── Settings sheet ───────────────────────────────────── */}
      <SettingsSheet
        visible={showSettings}
        day={day}
        bankBalance={balance}
        onDayChange={setDay}
        onBalanceChange={(v) => setTotalReceived(v + totalSpent)}
        onReset={handleReset}
        onUndo={handleUndoReset}
        onClose={() => {
          setResetSnapshot(null);
          setShowSettings(false);
        }}
      />
    </KeyboardAvoidingView>
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
  const enter = useRef(new Animated.Value(0)).current; // 0 → 1 entrance
  const exit = useRef(new Animated.Value(0)).current; // 0 → 1 exit
  const float = useRef(new Animated.Value(0)).current; // badge float loop
  const shimmer = useRef(new Animated.Value(0)).current; // one-time sweep
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
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
  }, [enter, shimmer, float]);

  const accept = () => {
    if (exiting) return;
    setExiting(true);
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
        {!exiting && (
          <Animated.View
            pointerEvents="none"
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
          <BanknoteIcon color={t.badgeIcon} />
        </Animated.View>

        {/* text */}
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[styles.notifyLabel, { color: t.label }]}>
            {milestone ? `MILESTONE · DAY ${day}` : 'YOUR DEPOSIT IS READY'}
          </Text>
          <Text style={[styles.notifyAmount, { color: t.amount }]}>{formatMoney(amount)}</Text>
        </View>

        {/* accept */}
        <Pressable
          onPress={accept}
          style={({ pressed }) => [styles.notifyBtn, { backgroundColor: t.btnBg }, pressed && { opacity: 0.85 }]}
          accessibilityRole="button"
          accessibilityLabel="Accept deposit"
        >
          <Text style={[styles.notifyBtnText, { color: t.btnColor }]}>
            {exiting ? 'Received ✓' : 'Accept'}
          </Text>
        </Pressable>
      </LinearGradient>
    </Animated.View>
  );
}

/* ──────────────────────────────────────────────────────────── */
/* Spend row                                                     */
/* ──────────────────────────────────────────────────────────── */

function SpendRow({ item, onRemove }: { item: SpendItem; onRemove: () => void }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowTile}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.rowTileImg} />
        ) : (
          <SparkleIcon size={20} color={colors.sageDark} opacity={0.6} />
        )}
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 6 }}>
        <Text style={styles.rowText}>{item.description}</Text>
        <View style={styles.rowChip}>
          <Text style={styles.rowChipText}>{formatMoney(item.amount)}</Text>
        </View>
      </View>
      <Pressable onPress={onRemove} style={styles.removeBtn} hitSlop={10} accessibilityLabel="Remove">
        <Text style={styles.removeBtnText}>×</Text>
      </Pressable>
    </View>
  );
}

/* ──────────────────────────────────────────────────────────── */
/* Empty state                                                   */
/* ──────────────────────────────────────────────────────────── */

function EmptyState({ dayDeposit }: { dayDeposit: number }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyGlyph}>
        <SparkleIcon size={40} color={colors.sage} />
        <View style={styles.emptySparkTR}>
          <Twinkle duration={2200}>
            <SparkleIcon size={13} color={colors.sage} />
          </Twinkle>
        </View>
        <View style={styles.emptySparkBL}>
          <Twinkle duration={1700} delay={400}>
            <SparkleIcon size={9} color={colors.sage} />
          </Twinkle>
        </View>
      </View>
      <Text style={styles.emptyTitle}>{formatMoney(dayDeposit)} is waiting</Text>
      <Text style={styles.emptyBody}>
        Start small or start big. A dinner. A donation. The house. The point is the feeling of
        having it.
      </Text>
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
            <Pressable onPress={onClose} hitSlop={8}>
              <Text style={styles.sheetClose}>×</Text>
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
                <UndoIcon color={colors.sageDark} />
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
            <Pressable
              onPress={() => {
                commitDay();
                commitBalance();
                onClose();
              }}
              style={({ pressed }) => [styles.saveBtn, pressed && styles.saveBtnPressed]}
            >
              <Text style={styles.saveBtnText}>Save</Text>
            </Pressable>
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
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
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
  }, [v, duration, delay]);
  const opacity = v.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });
  const scale = v.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] });
  return <Animated.View style={{ opacity, transform: [{ scale }] }}>{children}</Animated.View>;
}

/* ──────────────────────────────────────────────────────────── */
/* Icons (react-native-svg)                                      */
/* ──────────────────────────────────────────────────────────── */

const SPARKLE_PATH =
  'M12 0 L14.2 9.8 L24 12 L14.2 14.2 L12 24 L9.8 14.2 L0 12 L9.8 9.8 Z';

function SparkleIcon({ size, color, opacity = 1 }: { size: number; color: string; opacity?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d={SPARKLE_PATH} fill={color} opacity={opacity} />
    </Svg>
  );
}

function BanknoteIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Rect x={2} y={6} width={20} height={12} rx={2} />
      <Circle cx={12} cy={12} r={2} />
      <Path d="M6 12h.01M18 12h.01" />
    </Svg>
  );
}

function ImageIcon({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Rect x={3} y={3} width={18} height={18} rx={2} />
      <Circle cx={8.5} cy={8.5} r={1.5} />
      <Path d="M21 15l-5-5L5 21" />
    </Svg>
  );
}

function GearIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx={12} cy={12} r={3} />
      <Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </Svg>
  );
}

function UndoIcon({ color }: { color: string }) {
  return (
    <Svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M9 14L4 9l5-5" />
      <Path d="M4 9h11a4 4 0 0 1 0 8h-1" />
    </Svg>
  );
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
  shimmer: { position: 'absolute', top: 0, bottom: 0, left: 0, width: '42%' },
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
  listContent: { paddingHorizontal: space.lg, paddingTop: space.lg, paddingBottom: space.md },
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
  removeBtnText: { fontSize: 20, lineHeight: 20, color: colors.textMuted },

  /* Empty state */
  empty: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.secondaryBorder,
    paddingVertical: 28,
    paddingHorizontal: space.lg,
    alignItems: 'center',
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
  composer: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingHorizontal: space.lg,
    paddingTop: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#8C4A14',
        shadowOpacity: 0.06,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: -8 },
      },
      android: { elevation: 8 },
      default: { boxShadow: '0 -8px 24px rgba(140,74,20,0.06)' as any },
    }),
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
  thumbRemoveText: { color: '#fff', fontSize: 14, lineHeight: 16 },

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
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnDisabled: { backgroundColor: colors.disabled },
  addBtnText: { color: colors.primaryText, fontSize: 22, lineHeight: 24 },

  /* Settings sheet */
  sheetRoot: { flex: 1, justifyContent: 'flex-end' },
  sheetScrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(42,26,16,0.35)' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: space.lg,
    paddingTop: 20,
    paddingBottom: 32,
    gap: space.md,
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
