import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import type { RoundState } from '../core/table';
import { theme } from '../ui/theme';

type Props = {
  round: RoundState | null;
  canUndo: boolean;
  canRedo: boolean;
  /** Apuesta sugerida al empezar esta ronda: valor inicial del campo "Aposté". */
  suggestedBet: number;
  onUndo(): void;
  onRedo(): void;
  onSplit(): void;
  onNext(): void;
  onFinish(bet: number): void;
  desktop?: boolean;
};

function Button({ label, text, enabled = true, onPress, primary = false, desktop = false }: {
  label: string; text: string; enabled?: boolean; onPress(): void; primary?: boolean; desktop?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !enabled }}
      disabled={!enabled}
      onPress={onPress}
      style={({ hovered, pressed }) => [styles.button,
        desktop && styles.desktopButton,
        enabled ? styles.enabled : styles.disabled,
        primary && styles.primary,
        (hovered || pressed) && enabled && styles.active]}
    >
      <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}
        style={[styles.label, !enabled && styles.disabledLabel, primary && styles.primaryLabel]}>
        {text}
      </Text>
    </Pressable>
  );
}

export function ActionBar(props: Props) {
  const { width } = useWindowDimensions();
  const compact = width < 400;
  const done = props.round?.phase === 'done';
  // El campo se reinicia en cada ronda porque el padre lo monta con key por ronda.
  const [betText, setBetText] = useState(String(props.suggestedBet));
  const bet = Number(betText.replace(/\D/g, '') || '0');

  return (
    <View style={styles.wrap}>
      {done && (
        <View style={styles.betRow}>
          <Text style={styles.betLabel}>Aposté</Text>
          <TextInput
            accessibilityLabel="Cuánto apostaste en esta ronda, en pesos. 0 si no apostaste"
            value={betText}
            onChangeText={setBetText}
            keyboardType="number-pad"
            selectTextOnFocus
            style={styles.betInput}
          />
          <Button label="No aposté" text="No aposté" onPress={() => setBetText('0')} />
          <Button label="Nueva ronda" text={compact ? 'Nueva' : 'Nueva ronda'} primary
            onPress={() => props.onFinish(bet)} />
        </View>
      )}
      <View style={[styles.container, props.desktop && styles.desktopContainer]}>
        <Button label="Deshacer" text="↶ Deshacer" enabled={props.canUndo} onPress={props.onUndo} desktop={props.desktop} />
        <Button label="Rehacer" text="↷" enabled={props.canRedo} onPress={props.onRedo} desktop={props.desktop} />
        <Button label="Dividir" text="Dividir" onPress={props.onSplit} desktop={props.desktop} />
        {!done && <Button label="Siguiente" text={compact ? 'Sig.' : 'Siguiente'} onPress={props.onNext} desktop={props.desktop} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 4 },
  container: { flexDirection: 'row', gap: 4 },
  desktopContainer: { flexWrap: 'wrap' },
  desktopButton: { flexBasis: '45%' },
  betRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  betLabel: { color: theme.colors.textMuted, fontSize: theme.text.sm },
  betInput: {
    flex: 1,
    minWidth: 70,
    minHeight: theme.minTouch,
    paddingHorizontal: theme.space.sm,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.gold,
    color: theme.colors.text,
    fontSize: theme.text.lg,
    fontWeight: '700',
    backgroundColor: theme.colors.card,
  },
  button: {
    flex: 1,
    minWidth: 0,
    minHeight: theme.minTouch,
    paddingHorizontal: theme.space.xs,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.sm,
  },
  enabled: { borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.card },
  disabled: { backgroundColor: theme.colors.muted },
  primary: { backgroundColor: theme.colors.gold, borderColor: theme.colors.gold },
  active: { opacity: 0.8 },
  label: { color: theme.colors.text },
  primaryLabel: { color: theme.colors.background, fontWeight: '800' },
  disabledLabel: { color: theme.colors.textMuted },
});
