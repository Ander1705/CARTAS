import { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import type { Rank } from '../core/cards';
import { theme } from '../ui/theme';

type Props = { rank: Rank | null; size: number; highlight?: boolean };

export function PlayingCard({ rank, size, highlight = false }: Props) {
  const [opacity] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!highlight) return;
    opacity.setValue(1);
    Animated.timing(opacity, {
      toValue: 0,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [highlight, opacity]);

  const value = rank === 'T' ? '10' : rank;
  return (
    <View
      accessibilityLabel={rank === null ? 'Carta tapada' : `Carta ${value}`}
      style={[
        styles.card,
        {
          width: size,
          height: size * 1.4,
          borderRadius: size * 0.12,
          backgroundColor: rank === null
            ? theme.colors.cardBack
            : theme.colors.cardFace,
          borderColor: rank === null ? theme.colors.gold : 'rgba(0,0,0,0.2)',
          borderWidth: rank === null ? 2 : 1,
        },
      ]}
    >
      {rank === null ? (
        <View style={styles.pattern}>
          <View style={styles.diamond} />
        </View>
      ) : (
        <>
          <Text style={[styles.corner, { fontSize: size * 0.25 }]}>{value}</Text>
          <Text style={[styles.value, { fontSize: size * 0.5 }]}>{value}</Text>
        </>
      )}
      {highlight && (
        <Animated.View
          pointerEvents="none"
          style={[styles.highlight, { opacity }]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  corner: {
    position: 'absolute',
    top: 2,
    left: 3,
    color: theme.colors.cardText,
    fontWeight: '800',
  },
  value: {
    color: theme.colors.cardText,
    fontWeight: '800',
  },
  pattern: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  diamond: {
    width: '42%',
    aspectRatio: 1,
    borderWidth: 1,
    borderColor: theme.colors.gold,
    transform: [{ rotate: '45deg' }],
  },
  highlight: {
    ...StyleSheet.absoluteFill,
    borderWidth: 3,
    borderColor: theme.colors.ok,
    borderRadius: 4,
  },
});
