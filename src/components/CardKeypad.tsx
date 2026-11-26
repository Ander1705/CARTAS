import { Platform, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { parseRank, type Rank } from '../core/cards';
import { theme } from '../ui/theme';

// J, Q y K valen 10 en el conteo y en la estrategia: comparten tecla.
const keys = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10'] as const;
const hiLo = (key: string) => (key === 'A' || key === '10' ? -1 : Number(key) <= 6 ? 1 : 0);
const tagColor = { 1: theme.colors.ok, 0: theme.colors.neutral, [-1]: theme.colors.danger };

type CardKeypadProps = {
  onCard(rank: Rank): void;
  /** Teclas por fila. */
  columns: number;
  /** Subconjunto de teclas (teclado dividido en horizontal). */
  only?: 'low' | 'high';
  style?: ViewStyle;
};

export function CardKeypad({ onCard, columns, only, style }: CardKeypadProps) {
  const shown = only === 'low' ? keys.slice(0, 5) : only === 'high' ? keys.slice(5) : keys;
  const rows: string[][] = [];
  for (let i = 0; i < shown.length; i += columns) rows.push(shown.slice(i, i + columns));

  return (
    <View style={[styles.container, style]}>
      {rows.map((row) => (
        <View key={row[0]} style={styles.row}>
          {row.map((key) => (
            <Pressable
              key={key}
              accessibilityRole="button"
              accessibilityLabel={key === 'A' ? 'Carta As' : key === '10' ? 'Carta 10, J, Q o K' : `Carta ${key}`}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                onCard(parseRank(key));
              }}
              style={({ hovered, pressed }) => [styles.key,
                (hovered || pressed) && styles.keyActive]}
            >
              <Text style={styles.label}>{key}</Text>
              {key === '10' && <Text style={styles.sub}>J Q K</Text>}
              <View style={[styles.tag, { backgroundColor: tagColor[hiLo(key)] }]} />
            </Pressable>
          ))}
          {/* huecos para que la última fila no estire sus teclas */}
          {Array.from({ length: columns - row.length }, (_, i) => (
            <View key={`gap-${i}`} style={styles.gap} />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  row: { flex: 1, flexDirection: 'row', gap: 6 },
  key: {
    flex: 1,
    minWidth: 0,
    minHeight: theme.minTouch,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceHi,
    overflow: 'hidden',
  },
  keyActive: { backgroundColor: '#22453A' },
  gap: { flex: 1 },
  label: { color: theme.colors.text, fontSize: theme.text.lg, fontWeight: '700' },
  sub: { color: theme.colors.textMuted, fontSize: 10, marginTop: -2 },
  tag: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 3 },
});
