import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
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
import { Colors, Radius, Spacing } from '@/lib/constants';
import { GratitudeItem, formatStamp, groupByMonth } from '@/lib/gratitude';

const STORAGE_KEY = 'phoenix-rise/gratitude/v1';
const SAVE_DEBOUNCE_MS = 300;

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const fadeAnim: Parameters<typeof LayoutAnimation.configureNext>[0] = {
  duration: 220,
  create: { type: 'easeInEaseOut', property: 'opacity' },
  update: { type: 'easeInEaseOut' },
  delete: { type: 'easeInEaseOut', property: 'opacity' },
};

type Section = {
  key: string;
  title: string;
  count: number;
  data: GratitudeItem[];
};

export default function GratitudeScreen() {
  const router = useRouter();
  const [items, setItems] = useState<GratitudeItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [draft, setDraft] = useState('');
  const [inputFocused, setInputFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items)).catch(() => {
        // best-effort persistence
      });
    }, SAVE_DEBOUNCE_MS);
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [items, loaded]);

  const canAdd = draft.trim().length > 0;

  const handleAdd = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    LayoutAnimation.configureNext(fadeAnim);
    setItems((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        text: trimmed,
        createdAt: Date.now(),
      },
    ]);
    setDraft('');
    inputRef.current?.focus();
  };

  const handleRemove = (id: string) => {
    LayoutAnimation.configureNext(fadeAnim);
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handleSave = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  const sections: Section[] = groupByMonth(items).map((g) => ({
    key: g.key,
    title: g.label,
    count: g.items.length,
    data: g.items,
  }));

  return (
    <Screen scrollable={false}>
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.screen}>
          <View style={styles.topRegion}>
            <Pressable
              onPress={handleBack}
              hitSlop={8}
              style={({ pressed }) => [styles.backLink, pressed && styles.backLinkPressed]}
              accessibilityRole="link"
              accessibilityLabel="Go back"
            >
              <Text style={styles.backLinkText}>← Back</Text>
            </Pressable>

            <Text style={styles.eyebrow} accessibilityRole="header">
              WHAT ARE YOU GRATEFUL FOR TODAY?
            </Text>

            <View style={[styles.composer, inputFocused && styles.composerFocused]}>
              <TextInput
                ref={inputRef}
                value={draft}
                onChangeText={setDraft}
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
                placeholderTextColor="#B8A595"
                returnKeyType="send"
                {...({ enterKeyHint: 'send' } as object)}
                blurOnSubmit={false}
                multiline
                style={styles.promptInput}
                accessibilityLabel="I am grateful for"
              />
            </View>

            <Pressable
              onPress={handleAdd}
              disabled={!canAdd}
              style={({ pressed }) => [
                styles.addButton,
                !canAdd && styles.addButtonDisabled,
                pressed && canAdd && styles.addButtonPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Add gratitude item"
              accessibilityState={{ disabled: !canAdd }}
            >
              <Text
                style={[styles.addButtonText, !canAdd && styles.addButtonTextDisabled]}
              >
                + Add to list
              </Text>
            </Pressable>
          </View>

          <SectionList
            sections={sections}
            keyExtractor={(item) => item.id}
            stickySectionHeadersEnabled
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              items.length > 0 ? (
                <Text style={styles.countText}>
                  {items.length} {items.length === 1 ? 'thing' : 'things'} so far
                </Text>
              ) : null
            }
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
              <View style={styles.listItem}>
                <View style={styles.listItemDot} />
                <View style={styles.listItemBody}>
                  <Text style={styles.listItemText}>{item.text}</Text>
                  <Text style={styles.listItemStamp}>{formatStamp(item.createdAt)}</Text>
                </View>
                <Pressable
                  onPress={() => handleRemove(item.id)}
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
              </View>
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
                pressed && styles.primaryButtonPressed,
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
  kav: {
    flex: 1,
    width: '100%',
  },
  screen: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  topRegion: {
    flexShrink: 0,
  },
  scroll: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    flexGrow: 1,
  },

  backLink: {
    alignSelf: 'flex-start',
    paddingVertical: Spacing.xs,
    marginBottom: Spacing.md,
  },
  backLinkPressed: {
    opacity: 0.55,
  },
  backLinkText: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textSecondary,
  },

  eyebrow: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: Colors.eyebrow,
    marginBottom: Spacing.md,
  },

  composer: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.secondaryBorder,
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    marginBottom: Spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: '#2A1A10',
        shadowOpacity: 0.05,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 6 },
      },
      android: {
        elevation: 0,
      },
      default: {},
    }),
  },
  composerFocused: {
    borderColor: Colors.primary,
  },
  promptInput: {
    fontSize: 22,
    lineHeight: 30,
    fontWeight: '600',
    color: Colors.textPrimary,
    minHeight: 60,
    padding: 0,
    textAlignVertical: 'top',
    ...Platform.select({
      web: {
        outlineStyle: 'none' as 'none',
      },
      default: {},
    }),
  },
  addButton: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.pill,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  addButtonPressed: {
    backgroundColor: Colors.primaryPressed,
  },
  addButtonDisabled: {
    backgroundColor: '#F2D9C2',
  },
  addButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.primaryText,
    letterSpacing: 0.2,
  },
  addButtonTextDisabled: {
    color: '#FFFFFF',
    opacity: 0.85,
  },

  countText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.4,
    color: Colors.textMuted,
    marginBottom: Spacing.md,
  },

  groupHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    backgroundColor: Colors.background,
    paddingBottom: Spacing.sm + 2,
    marginBottom: Spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(232, 201, 168, 0.5)',
  },
  groupHeaderTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.2,
  },
  groupHeaderCount: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
    letterSpacing: 0.4,
  },

  emptyState: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.secondaryBorder,
    borderStyle: 'dashed',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  emptyMark: {
    width: 48,
    height: 48,
    borderRadius: Radius.pill,
    backgroundColor: '#FFE9D4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  emptyMarkText: {
    fontSize: 22,
    color: Colors.primary,
    fontWeight: '600',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  emptyBody: {
    fontSize: 15,
    lineHeight: 22,
    color: Colors.textSecondary,
    textAlign: 'center',
    maxWidth: 320,
  },

  itemSeparator: {
    height: Spacing.sm,
  },
  sectionSeparator: {
    height: Spacing.lg,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.secondaryBorder,
    paddingVertical: Spacing.sm + 2,
    paddingLeft: Spacing.md,
    paddingRight: Spacing.xs,
    gap: Spacing.md,
  },
  listItemDot: {
    width: 8,
    height: 8,
    borderRadius: Radius.pill,
    backgroundColor: Colors.primary,
    flexShrink: 0,
  },
  listItemBody: {
    flex: 1,
    flexDirection: 'column',
    gap: 2,
  },
  listItemText: {
    fontSize: 16,
    lineHeight: 22,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  listItemStamp: {
    fontSize: 12,
    lineHeight: 16,
    color: Colors.textMuted,
    letterSpacing: 0.2,
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonPressed: {
    backgroundColor: '#FFF0E0',
  },
  removeButtonText: {
    fontSize: 22,
    lineHeight: 24,
    color: Colors.textMuted,
    fontWeight: '400',
  },

  ctaWrap: {
    paddingTop: Spacing.md,
    marginTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(232, 201, 168, 0.5)',
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.pill,
    minHeight: 54,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonPressed: {
    backgroundColor: Colors.primaryPressed,
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.primaryText,
    letterSpacing: 0.2,
  },
});
