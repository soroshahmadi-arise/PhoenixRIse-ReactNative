import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  UIManager,
  View,
} from 'react-native';

import Svg, { Path } from 'react-native-svg';

import { PressableScale } from '@/components/PressableScale';
import { Screen } from '@/components/Screen';
import { autoCorrectText, capitalizeVoiceTranscript } from '@/lib/autocap';
import { INPUT_HEIGHT, theme, typography } from '@/lib/constants';
import { GratitudeItem, formatStamp, groupByMonth } from '@/lib/gratitude';
import { useReducedMotion } from '@/lib/useReducedMotion';

function MicIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2C10.34 2 9 3.34 9 5v6c0 1.66 1.34 3 3 3s3-1.34 3-3V5c0-1.66-1.34-3-3-3z"
        fill={color}
      />
      <Path
        d="M19 10v1a7 7 0 01-14 0v-1"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Path d="M12 18v3" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

function ChevronLeftIcon({ color }: { color: string }) {
  return (
    <Svg
      width={22}
      height={22}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M15 18l-6-6 6-6" />
    </Svg>
  );
}

const STORAGE_KEY = 'phoenix-rise/gratitude/v1';
const SAVE_DEBOUNCE_MS = 300;

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const layoutAnim: Parameters<typeof LayoutAnimation.configureNext>[0] = {
  duration: 240,
  update: { type: 'easeInEaseOut' },
  delete: { type: 'easeInEaseOut', property: 'opacity' },
};

type Section = {
  key: string;
  title: string;
  count: number;
  data: GratitudeItem[];
};

type SpeechRecognitionResultLike = {
  isFinal: boolean;
  length: number;
  0: { transcript: string };
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: { length: number; [index: number]: SpeechRecognitionResultLike };
};

type SpeechRecognitionInstance = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: unknown) => void) | null;
  onend: ((event: unknown) => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type ListItemProps = {
  item: GratitudeItem;
  isNew: boolean;
  onRemove: (id: string) => void;
};

function GratitudeListItemView({ item, isNew, onRemove }: ListItemProps) {
  const reduceMotion = useReducedMotion();
  const anim = useRef(new Animated.Value(isNew ? 0 : 1)).current;

  useEffect(() => {
    if (!isNew) return;
    if (reduceMotion) {
      anim.setValue(1); // appear settled — no slide/scale/flash
      return;
    }
    Animated.timing(anim, {
      toValue: 1,
      duration: 720,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const opacity = anim.interpolate({
    inputRange: [0, 0.44, 1],
    outputRange: [0, 1, 1],
    extrapolate: 'clamp',
  });
  const translateY = anim.interpolate({
    inputRange: [0, 0.44, 1],
    outputRange: [10, 0, 0],
    extrapolate: 'clamp',
  });
  const scale = anim.interpolate({
    inputRange: [0, 0.44, 1],
    outputRange: [0.96, 1, 1],
    extrapolate: 'clamp',
  });
  const borderColor = anim.interpolate({
    inputRange: [0, 0.55, 1],
    outputRange: [theme.colors.highlight, theme.colors.highlight, theme.colors.border],
  });

  return (
    <Animated.View
      style={[
        styles.listItem,
        {
          opacity,
          transform: [{ translateY }, { scale }],
          borderColor,
        },
      ]}
    >
      <View style={styles.listItemDot} />
      <View style={styles.listItemBody}>
        <Text style={styles.listItemText}>{item.text}</Text>
        <Text style={styles.listItemStamp}>{formatStamp(item.createdAt)}</Text>
      </View>
      <Pressable
        onPress={() => onRemove(item.id)}
        hitSlop={8}
        style={({ pressed }) => [
          styles.removeButton,
          pressed && styles.removeButtonPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={`Remove ${item.text}`}
      >
        <Text style={styles.removeButtonText}>×</Text>
      </Pressable>
    </Animated.View>
  );
}

export default function GratitudeScreen() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [items, setItems] = useState<GratitudeItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [draft, setDraft] = useState('');
  const [inputFocused, setInputFocused] = useState(false);
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rippleScale = useRef(new Animated.Value(1)).current;
  const rippleOpacity = useRef(new Animated.Value(0)).current;
  const recognitionRef = useRef<{ stop: () => void; abort: () => void } | null>(null);
  const baseDraftRef = useRef('');
  const sectionListRef = useRef<SectionList<GratitudeItem, Section>>(null);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const SR =
      (globalThis as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown })
        .SpeechRecognition ??
      (globalThis as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown })
        .webkitSpeechRecognition;
    setSpeechSupported(!!SR);
  }, []);

  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.abort();
      } catch {
        // ignore
      }
    };
  }, []);

  const startListening = () => {
    if (Platform.OS !== 'web') return;
    const w = globalThis as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionInstance;
      webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
    };
    const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!SR) return;

    baseDraftRef.current = draft;

    const recognition = new SR();
    recognition.lang = 'en-US';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: SpeechRecognitionEventLike) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      const base = baseDraftRef.current;
      const separator = base && !base.endsWith(' ') ? ' ' : '';
      const cappedTranscript = capitalizeVoiceTranscript(transcript.trim());
      setDraft(base + separator + cappedTranscript);
    };

    recognition.onerror = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };
    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      setIsListening(true);
    } catch {
      setIsListening(false);
    }
  };

  const stopListening = () => {
    try {
      recognitionRef.current?.stop();
    } catch {
      // ignore
    }
  };

  const handleMicTap = () => {
    if (isListening) stopListening();
    else startListening();
  };

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (cancelled || !raw) return;
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) setItems(parsed);
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
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items)).catch(() => {});
    }, SAVE_DEBOUNCE_MS);
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [items, loaded]);

  const canAdd = draft.trim().length > 0;

  const handleAdd = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    if (isListening) stopListening();
    const newId = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    LayoutAnimation.configureNext(layoutAnim);
    setItems((prev) => [
      ...prev,
      { id: newId, text: trimmed, createdAt: Date.now() },
    ]);
    setLastAddedId(newId);
    setDraft('');
    inputRef.current?.focus();

    if (!reduceMotion) {
      rippleScale.setValue(1);
      rippleOpacity.setValue(0.45);
      Animated.parallel([
        Animated.timing(rippleScale, {
          toValue: 2.6,
          duration: 480,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(rippleOpacity, {
          toValue: 0,
          duration: 480,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
    }

    setTimeout(() => {
      setLastAddedId((prev) => (prev === newId ? null : prev));
    }, 1200);
  };

  const handleRemove = (id: string) => {
    LayoutAnimation.configureNext(layoutAnim);
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handleSave = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  const goHome = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  const sections: Section[] = groupByMonth(items).map((g) => ({
    key: g.key,
    title: g.label,
    count: g.items.length,
    data: g.items,
  }));

  const monthChips = sections.map((s) => {
    const first = s.data[0];
    const d = new Date(first.createdAt);
    const monthAbbr = d.toLocaleString('en-US', { month: 'short' });
    return {
      key: s.key,
      label: `${monthAbbr} ${d.getFullYear()}`,
      count: s.count,
    };
  });

  const handleChipPress = (sectionIndex: number) => {
    try {
      sectionListRef.current?.scrollToLocation({
        sectionIndex,
        itemIndex: 0,
        animated: true,
        viewPosition: 0,
      });
    } catch {
      // scrollToLocation can throw before items are measured; safe to ignore
    }
  };

  const primaryBtn = theme.buttons.primary;

  return (
    <Screen scrollable={false}>
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.screen}>
          <View style={styles.topRegion}>
            <View style={styles.headerRow}>
              <Pressable
                onPress={goHome}
                hitSlop={10}
                style={({ pressed }) => [
                  styles.backBtn,
                  pressed && styles.backBtnPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Back to home"
              >
                <ChevronLeftIcon color={theme.colors.text} />
              </Pressable>
              <Text style={styles.title} accessibilityRole="header">
                Gratitude list
              </Text>
            </View>

            <Text style={styles.eyebrow}>WHAT ARE YOU GRATEFUL FOR TODAY?</Text>

            <View style={[styles.composer, inputFocused && styles.composerFocused]}>
              <TextInput
                ref={inputRef}
                value={draft}
                onChangeText={(text) =>
                  setDraft((prev) => autoCorrectText(prev, text))
                }
                autoCapitalize="sentences"
                autoCorrect
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                onSubmitEditing={handleAdd}
                onKeyPress={(e) => {
                  const ev = e.nativeEvent as unknown as {
                    key: string;
                    shiftKey?: boolean;
                    preventDefault?: () => void;
                  };
                  if (ev.key === 'Enter' && !ev.shiftKey) {
                    ev.preventDefault?.();
                    handleAdd();
                  }
                }}
                placeholder="I am grateful for..."
                placeholderTextColor={theme.colors.textLight}
                returnKeyType="send"
                {...({ enterKeyHint: 'send' } as object)}
                blurOnSubmit={false}
                multiline
                style={styles.promptInput}
                accessibilityLabel="I am grateful for"
              />

              <View style={styles.composerActions}>
                {speechSupported ? (
                  <Pressable
                    onPress={handleMicTap}
                    hitSlop={8}
                    style={({ pressed }) => [
                      styles.micButton,
                      isListening && styles.micButtonActive,
                      pressed && !isListening && styles.micButtonPressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={isListening ? 'Stop voice input' : 'Start voice input'}
                  >
                    <MicIcon
                      size={16}
                      color={isListening ? theme.colors.white : theme.colors.textBody}
                    />
                  </Pressable>
                ) : null}
                <View style={styles.addButtonWrap}>
                  <Animated.View
                    pointerEvents="none"
                    style={[
                      styles.addButtonRipple,
                      {
                        opacity: rippleOpacity,
                        transform: [{ scale: rippleScale }],
                      },
                    ]}
                  />
                  <PressableScale
                    onPress={handleAdd}
                    disabled={!canAdd}
                    hitSlop={8}
                    style={styles.addButton}
                    pressedStyle={styles.addButtonPressed}
                    disabledStyle={styles.addButtonDisabled}
                    accessibilityLabel="Add gratitude item"
                  >
                    <Text style={styles.addButtonIcon}>+</Text>
                  </PressableScale>
                </View>
              </View>
            </View>
          </View>

          <SectionList
            ref={sectionListRef}
            sections={sections}
            keyExtractor={(item) => item.id}
            stickySectionHeadersEnabled
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState} accessibilityRole="text">
                <View style={styles.emptyMark}>
                  <Text style={styles.emptyMarkText}>✦</Text>
                </View>
                <Text style={styles.emptyTitle}>Your list is open and waiting</Text>
                <Text style={styles.emptyBody}>
                  Anything counts — warm light through the window, a person you love, a
                  quiet minute to yourself.
                </Text>
              </View>
            }
            renderSectionHeader={({ section }) => {
              const currentKey = (section as Section).key;
              const activeIndex = monthChips.findIndex((c) => c.key === currentKey);
              return (
                <View style={styles.groupHeader}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.headerChipsScroll}
                    contentContainerStyle={styles.headerChipsRow}
                    contentOffset={{ x: Math.max(0, activeIndex * 96 - 16), y: 0 }}
                  >
                    {monthChips.map((chip, idx) => {
                      const isActive = idx === activeIndex;
                      return (
                        <Pressable
                          key={chip.key}
                          onPress={() => handleChipPress(idx)}
                          style={({ pressed }) => [
                            styles.headerChip,
                            isActive && styles.headerChipActive,
                            pressed && !isActive && styles.chipPressed,
                          ]}
                          accessibilityRole="button"
                          accessibilityLabel={`Jump to ${chip.label}, ${chip.count} ${chip.count === 1 ? 'entry' : 'entries'}`}
                          accessibilityState={{ selected: isActive }}
                        >
                          <Text
                            style={[
                              styles.headerChipText,
                              isActive && styles.headerChipTextActive,
                            ]}
                          >
                            {chip.label}
                          </Text>
                          <Text
                            style={[
                              styles.headerChipCount,
                              isActive && styles.headerChipCountActive,
                            ]}
                          >
                            {chip.count} {chip.count === 1 ? 'entry' : 'entries'}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </View>
              );
            }}
            renderItem={({ item }) => (
              <GratitudeListItemView
                item={item}
                isNew={item.id === lastAddedId}
                onRemove={handleRemove}
              />
            )}
            ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
            SectionSeparatorComponent={({ leadingItem }) =>
              leadingItem ? <View style={styles.sectionSeparator} /> : null
            }
          />

          <View style={styles.ctaWrap}>
            <PressableScale
              onPress={handleSave}
              style={[
                styles.primaryButton,
                { backgroundColor: primaryBtn.backgroundColor },
              ]}
              pressedStyle={{ backgroundColor: primaryBtn.pressedBackground }}
              accessibilityLabel="Done with gratitude list"
            >
              <Text style={styles.primaryButtonText}>Done</Text>
            </PressableScale>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  kav: { flex: 1, width: '100%' },
  screen: { flex: 1, backgroundColor: 'transparent' },
  topRegion: { flexShrink: 0 },
  scroll: { flex: 1, backgroundColor: 'transparent' },
  scrollContent: {
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.md,
    flexGrow: 1,
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -10,
  },
  backBtnPressed: {
    backgroundColor: theme.colors.surfaceNested,
  },
  title: {
    fontFamily: theme.fontFamily.serifSemiBold,
    fontSize: 25,
    letterSpacing: -0.4,
    color: theme.colors.text,
  },

  eyebrow: {
    ...typography.micro,
    textTransform: 'uppercase',
    marginBottom: theme.spacing.md,
  },

  composer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    paddingTop: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    ...Platform.select<object>({
      ios: theme.shadows.subtle,
      android: { elevation: 0 },
      default: {},
    }),
  },
  composerFocused: {
    borderColor: theme.colors.highlight,
  },
  promptInput: {
    fontFamily: theme.fontFamily.semiBold,
    fontSize: 20,
    lineHeight: 28,
    letterSpacing: -0.3,
    color: theme.colors.text,
    minHeight: 60,
    padding: 0,
    textAlignVertical: 'top',
    ...Platform.select({
      web: { outlineStyle: 'none' as 'none' },
      default: {},
    }),
  },

  composerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  micButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: theme.colors.border,
  },
  micButtonActive: {
    backgroundColor: theme.colors.highlight,
    borderColor: theme.colors.highlight,
  },
  micButtonPressed: {
    backgroundColor: theme.colors.surfaceNested,
  },
  addButtonWrap: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.highlight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonDisabled: {
    opacity: theme.buttons.disabled.opacity,
  },
  addButtonPressed: {
    backgroundColor: theme.colors.highlightPressed,
  },
  addButtonRipple: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.highlight,
  },
  addButtonIcon: {
    color: theme.colors.white,
    fontFamily: theme.fontFamily.semiBold,
    fontSize: 20,
    lineHeight: 22,
    includeFontPadding: false,
  },

  headerChipsScroll: {
    flex: 1,
    minWidth: 0,
  },
  headerChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs + 2,
    paddingRight: theme.spacing.sm,
  },
  headerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: 'transparent',
  },
  headerChipActive: {
    backgroundColor: theme.colors.highlight,
    borderColor: theme.colors.highlight,
  },
  chipPressed: {
    backgroundColor: theme.colors.surfaceNested,
  },
  headerChipText: {
    fontFamily: theme.fontFamily.medium,
    fontSize: 12,
    lineHeight: 16,
    color: theme.colors.textBody,
  },
  headerChipTextActive: {
    color: theme.colors.white,
  },
  headerChipCount: {
    fontFamily: theme.fontFamily.semiBold,
    fontSize: 11,
    lineHeight: 14,
    color: theme.colors.textLight,
  },
  headerChipCountActive: {
    color: 'rgba(255,255,255,0.78)',
  },

  groupHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.background,
    paddingBottom: theme.spacing.sm + 2,
    marginBottom: theme.spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },

  emptyState: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  emptyMark: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.emberBubble,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  emptyMarkText: {
    fontSize: 22,
    fontFamily: theme.fontFamily.semiBold,
    color: theme.colors.highlight,
  },
  emptyTitle: {
    ...typography.headline3,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  emptyBody: {
    ...typography.bodyMedium,
    textAlign: 'center',
    maxWidth: 320,
  },

  itemSeparator: { height: theme.spacing.sm },
  sectionSeparator: { height: theme.spacing.lg },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: theme.spacing.sm + 2,
    paddingLeft: theme.spacing.md,
    paddingRight: theme.spacing.xs,
    gap: theme.spacing.md,
  },
  listItemDot: {
    width: 8,
    height: 8,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.highlight,
    flexShrink: 0,
  },
  listItemBody: {
    flex: 1,
    flexDirection: 'column',
    gap: 2,
  },
  listItemText: {
    ...typography.bodyMedium,
    color: theme.colors.text,
    fontFamily: theme.fontFamily.medium,
  },
  listItemStamp: {
    ...typography.meta,
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonPressed: {
    backgroundColor: theme.colors.warmOverlay,
  },
  removeButtonText: {
    fontSize: 22,
    lineHeight: 24,
    color: theme.colors.textLight,
    fontFamily: theme.fontFamily.regular,
  },

  ctaWrap: {
    paddingTop: theme.spacing.md,
    marginTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  primaryButton: {
    borderRadius: theme.borderRadius.lg,
    height: INPUT_HEIGHT,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    ...typography.button,
    color: theme.buttons.primary.textColor,
  },
});
