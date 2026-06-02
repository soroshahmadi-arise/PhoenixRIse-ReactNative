import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

export type OrbAnimationType = 'splash' | 'idle' | 'breathing';

type EmberOrbProps = {
  size: number;
  darkMode?: boolean;
  showBloom?: boolean;
  instanceId?: string;
};

export function EmberOrb({
  size,
  darkMode = false,
  showBloom = true,
  instanceId = 'default',
}: EmberOrbProps) {
  const bloomId = useMemo(
    () => `orbBloom_${instanceId.replace(/[^a-zA-Z0-9_-]/g, '_')}`,
    [instanceId],
  );
  const orbId = useMemo(
    () => `orbBody_${instanceId.replace(/[^a-zA-Z0-9_-]/g, '_')}`,
    [instanceId],
  );

  return (
    <View
      style={[styles.wrap, { width: size, height: size }]}
      accessibilityRole="image"
      accessibilityLabel="Ember"
    >
      {showBloom ? (
        <View
          style={{
            ...styles.bloom,
            left: -(size * 1.02),
            top: -(size * 0.74),
            width: size * 3.05,
            height: size * 2.45,
          }}
        >
          <Svg width="100%" height="100%">
            <Defs>
              <RadialGradient id={bloomId} cx="50%" cy="45%" rx="48%" ry="39%">
                <Stop offset="0%" stopColor="#FFF5D9" stopOpacity="0.62" />
                <Stop offset="20%" stopColor="#F8E2AE" stopOpacity="0.42" />
                <Stop offset="42%" stopColor="#E7B06F" stopOpacity="0.24" />
                <Stop offset="68%" stopColor="#D9965B" stopOpacity="0.10" />
                <Stop offset="100%" stopColor="#D9965B" stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${bloomId})`} />
          </Svg>
        </View>
      ) : null}

      <View style={[styles.orbBody, { width: size, height: size }]}>
        <Svg width={size} height={size}>
          <Defs>
            <RadialGradient id={orbId} cx="50%" cy="44%" rx="38%" ry="38%">
              <Stop offset="0%" stopColor="#F8DCBB" stopOpacity={darkMode ? '0.85' : '0.95'} />
              <Stop offset="35%" stopColor="#E8B07B" stopOpacity={darkMode ? '0.75' : '0.80'} />
              <Stop offset="65%" stopColor="#C67D4D" stopOpacity={darkMode ? '0.55' : '0.55'} />
              <Stop offset="92%" stopColor="#8B4A28" stopOpacity="0" />
              <Stop offset="100%" stopColor="#8B4A28" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${orbId})`} />
        </Svg>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
    pointerEvents: 'box-none',
  },
  bloom: {
    position: 'absolute',
    pointerEvents: 'none',
  },
  orbBody: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
});
