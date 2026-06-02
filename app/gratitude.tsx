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
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  UIManager,
  View,
} from 'react-native';

import { Screen } from '@/components/Screen';
import { autoCorrectText } from '@/lib/autocap';
import { INPUT_HEIGHT, theme, typography } from '@/lib/constants';
import { GratitudeItem, formatStamp, groupByMonth } from '@/lib/gratitude';

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

type ListItemProps = {
  item: GratitudeItem;
  isNew: boolean;
  onRemove: (id: string) => void;
};

function GratitudeListItemView({ item, isNew, onRemove }: ListItemProps) {
  const anim = useRef(new Animated.Value(isNew ? 0 : 1)).current;

  useEffect(() => {
    if (!isNew) return;
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
  const [items, setItems] = useState<GratitudeItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [draft, setDraft] = useState('');
  const [inputFocused, setInputFocused] = useState(false);
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rippleScale = useRef(new Animated.Value(1)).current;
  const rippleOpacity = useRef(new Animated.Value(0)).current;

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
    const newId = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    LayoutAnimation.configureNext(layoutAnim);
    setItems((prev) => [
      ...prev,
      { id: newId, text: trimmed, createdAt: Date.now() },
    ]);
    setLastAddedId(newId);
    setDraft('');
    inputRef.current?.focus();

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

  const sections: Section[] = groupByMonth(items).map((g) => ({
    key: g.key,
    title: g.label,
    count: g.items.length,
    data: g.items,
  }));

  const primaryBtn = theme.buttons.primary;

  return (
    <Screen scrollable={false}>
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.screen}>
          <View style={styles.topRegion}>
            <Text style={styles.eyebrow} accessibilityRole="header">
              WHAT ARE YOU GRATEFUL FOR TODAY?
            </Text>

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
                  <Pressable
                    onPress={handleAdd}
                    disabled={!canAdd}
                    hitSlop={8}
                    style={({ pressed }) => [
                      styles.addButton,
                      !canAdd && styles.addButtonDisabled,
                      pressed && canAdd && styles.addButtonPressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="Add gratitude item"
                    accessibilityState={{ disabled: !canAdd }}
                  >
                    <Text style={styles.addButtonIcon}>+</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </View>

          <SectionList
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
            renderSectionHeader={({ section }) => (
              <View style={styles.groupHeader}>
                <Text style={styles.groupHeaderTitle}>{(section as Section).title}</Text>
                <Text style={styles.groupHeaderCount}>{(section as Section).count}</Text>
              </View>
            )}
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
            <Pressable
              onPress={handleSave}
              style={({ pressed }) => [
                styles.primaryButton,
                {
                  backgroundColor: pressed
                    ? primaryBtn.pressedBackground
                    : primaryBtn.backgroundColor,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Save and exit"
            >
              <Text style={styles.primaryButtonText}>Save & Exit</Text>
            </Pressable>
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
    marginTop: theme.spacing.sm,
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
    backgroundColor: '#9A5731',
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
  groupHeaderTitle: {
    ...typography.headline3,
    color: theme.colors.highlight,
  },
  groupHeaderCount: {
    ...typography.meta,
    color: theme.colors.textLight,
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
