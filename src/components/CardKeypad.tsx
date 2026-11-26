import { Pressable, StyleSheet, Text, View } from 'react-native';
import { parseRank, type Rank } from '../core/cards';
import { theme } from '../ui/theme';

const keys = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'] as const;

type CardKeypadProps = {
  onCard(rank: Rank): void;
  layout: 'split' | 'grid';
  side?: 'left' | 'right';
};

export function CardKeypad({ onCard, layout, side }: CardKeypadProps) {
  const shown = layout === 'grid'
    ? keys
    : side === 'left'
      ? keys.slice(0, 7)
      : keys.slice(7);

  return (
    <View style={styles.container}>
      {shown.map((key) => (
        <Pressable
          key={key}
          accessibilityRole="button"
          accessibilityLabel={`Carta ${key === 'A' ? 'As' : key}`}
          onPress={() => onCard(parseRank(key))}
          style={[styles.key, layout === 'grid' ? styles.gridKey : styles.splitKey]}
        >
          <Text style={styles.label}>{key}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignContent: 'center',
    justifyContent: 'center',
  },
  key: {
    minHeight: theme.minTouch,
    margin: 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.card,
  },
  gridKey: {
    minWidth: '22%',
  },
  splitKey: {
    minWidth: '44%',
  },
  label: {
    color: theme.colors.text,
    fontSize: theme.text.md,
  },
});
