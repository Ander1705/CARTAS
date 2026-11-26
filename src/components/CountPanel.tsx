import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { runningCount, trueCount, decksRemaining } from '../core/hilo';
import type { TableSession } from '../core/session';
import { penetration } from '../core/shoe';
import type { SeatNumber } from '../core/table';
import { seatsLeftToRight, theme } from '../ui/theme';

type CountPanelProps = {
  session: TableSession;
  onMySeat?(seat: SeatNumber): void;
  onEndShoe?(): void;
  large?: boolean;
};

function signed(value: number, digits = 0) {
  const text = value.toFixed(digits);
  return value > 0 ? `+${text}` : text;
}

export function CountPanel({ session, onMySeat, onEndShoe, large = false }: CountPanelProps) {
  const [seatPickerOpen, setSeatPickerOpen] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const confirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shoe = session.round?.shoe;
  const tc = shoe ? trueCount(shoe) : null;
  const tcColor = tc === null || Math.abs(tc) < 1
    ? theme.colors.text
    : tc > 0 ? theme.colors.ok : theme.colors.danger;

  useEffect(() => () => {
    if (confirmTimer.current) clearTimeout(confirmTimer.current);
  }, []);

  const pressEndShoe = () => {
    if (confirmEnd) {
      if (confirmTimer.current) clearTimeout(confirmTimer.current);
      confirmTimer.current = null;
      setConfirmEnd(false);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      onEndShoe?.();
      return;
    }
    setConfirmEnd(true);
    confirmTimer.current = setTimeout(() => {
      setConfirmEnd(false);
      confirmTimer.current = null;
    }, 3000);
  };

  return (
    <View style={[styles.panel, large && styles.largePanel]}>
      {session.status === 'lastRound' && (
        <Text style={styles.warning}>Última ronda: después se baraja</Text>
      )}
      <View style={[styles.row, large && styles.largeRow]}>
        <View accessible accessibilityLabel={`Conteo real ${tc === null ? 'sin datos' : signed(tc, 1)}`}>
          <Text style={[styles.tc, large && styles.largeTc, { color: tcColor }]}>
            {tc === null ? '—' : signed(tc, 1)}
          </Text>
          <Text style={styles.caption}>conteo real</Text>
        </View>
        <View style={styles.stats}>
          <Text numberOfLines={1} style={styles.stat}>
            Corrido <Text style={styles.statValue}>{shoe ? signed(runningCount(shoe)) : '—'}</Text>
          </Text>
          <Text numberOfLines={1} style={styles.stat}>
            Mazos <Text style={styles.statValue}>{shoe ? decksRemaining(shoe).toFixed(1) : '—'}</Text>
          </Text>
        </View>
        <View style={styles.buttons}>
          {onMySeat && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Cambiar asiento. Asiento ${session.mySeat ?? 'sin asignar'}`}
              accessibilityState={{ expanded: seatPickerOpen }}
              onPress={() => setSeatPickerOpen((open) => !open)}
              style={({ hovered, pressed }) => [styles.button, (hovered || pressed) && styles.active]}
            >
              <Text numberOfLines={1} style={styles.buttonText}>
                Asiento {session.mySeat ?? '—'} ▾
              </Text>
            </Pressable>
          )}
          {onEndShoe && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Nuevo zapato: reinicia el conteo"
              onPress={pressEndShoe}
              style={({ hovered, pressed }) => [styles.button,
                confirmEnd && styles.confirm, (hovered || pressed) && styles.active]}
            >
              <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.buttonText, confirmEnd && styles.confirmText]}>
                {confirmEnd ? '¿Seguro? Toca otra vez' : 'Nuevo zapato'}
              </Text>
            </Pressable>
          )}
        </View>
      </View>
      {seatPickerOpen && onMySeat && (
        <View style={styles.seatOptions}>
          {seatsLeftToRight.map((seat) => (
            <Pressable
              key={seat}
              accessibilityRole="button"
              accessibilityLabel={`Cambiar asiento al puesto ${seat}`}
              onPress={() => {
                onMySeat(seat);
                setSeatPickerOpen(false);
              }}
              style={({ hovered, pressed }) => [styles.seatOption,
                seat === session.mySeat && styles.seatOptionMine,
                (hovered || pressed) && styles.active]}
            >
              <Text style={[styles.seatOptionText, seat === session.mySeat && styles.mine]}>
                {seat}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
      {shoe && (
        <View
          accessible
          accessibilityLabel={`Penetración ${Math.round(penetration(shoe) * 100)} por ciento`}
          style={styles.progressTrack}
        >
          <View style={[styles.progressFill,
            { width: `${Math.min(100, penetration(shoe) * 100)}%` }]} />
          <View style={[styles.cutMarker, { left: `${session.rules.cutPenetration * 100}%` }]} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    paddingHorizontal: theme.space.md,
    paddingVertical: theme.space.sm,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    gap: theme.space.xs,
  },
  largePanel: { padding: theme.space.lg },
  warning: { color: theme.colors.warning, fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', gap: theme.space.md },
  largeRow: { flexWrap: 'wrap' },
  tc: {
    color: theme.colors.text,
    fontSize: 34,
    lineHeight: 38,
    fontWeight: '800',
    ...theme.numbers,
  },
  largeTc: { fontSize: 56, lineHeight: 60 },
  caption: { color: theme.colors.textMuted, fontSize: theme.text.xs },
  stats: { flex: 1, minWidth: 0, gap: 2 },
  stat: { color: theme.colors.textMuted, fontSize: theme.text.sm },
  statValue: { color: theme.colors.text, fontWeight: '700', ...theme.numbers },
  buttons: { gap: theme.space.xs, alignItems: 'stretch' },
  button: {
    minHeight: 40,
    paddingHorizontal: theme.space.sm,
    justifyContent: 'center',
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  active: { backgroundColor: theme.colors.surfaceHi },
  confirm: { borderColor: theme.colors.danger },
  buttonText: { color: theme.colors.gold, fontSize: theme.text.sm, fontWeight: '600' },
  confirmText: { color: theme.colors.danger },
  seatOptions: { flexDirection: 'row', gap: 4 },
  seatOption: {
    flex: 1,
    minHeight: theme.minTouch,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  seatOptionMine: { borderColor: theme.colors.gold },
  seatOptionText: { color: theme.colors.text, fontWeight: '700' },
  mine: { color: theme.colors.gold },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.muted,
  },
  progressFill: { height: 6, borderRadius: 3, backgroundColor: theme.colors.gold },
  cutMarker: {
    position: 'absolute',
    top: -3,
    width: 2,
    height: 12,
    backgroundColor: theme.colors.danger,
  },
});
