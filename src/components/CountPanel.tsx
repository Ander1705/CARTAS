import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { runningCount, trueCount, decksRemaining } from '../core/hilo';
import type { TableSession } from '../core/session';
import { penetration } from '../core/shoe';
import { SEATS, type SeatNumber } from '../core/table';
import { theme } from '../ui/theme';

type CountPanelProps = {
  session: TableSession;
  onMySeat?(seat: SeatNumber): void;
  onEndShoe?(): void;
  large?: boolean;
};

export function CountPanel({ session, onMySeat, onEndShoe, large = false }: CountPanelProps) {
  const [seatPickerOpen, setSeatPickerOpen] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const confirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shoe = session.round?.shoe;

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
        <Text style={styles.warning}>ÚLTIMA RONDA: después se baraja</Text>
      )}
      <View style={styles.row}>
        {onEndShoe && (
          <Pressable accessibilityRole="button" accessibilityLabel="Nuevo zapato: reinicia el conteo"
            onPress={pressEndShoe} style={({ hovered, pressed }) => [styles.newShoe,
              { opacity: pressed ? 0.7 : 1, backgroundColor: hovered ? '#26334D' : 'transparent' }]}>
            <Text numberOfLines={1} adjustsFontSizeToFit style={styles.newShoeText}>
              {confirmEnd ? 'Toca otra vez para confirmar' : 'Nuevo zapato'}
            </Text>
          </Pressable>
        )}
        {shoe ? (
          <>
            <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.number, large && styles.largeNumber]}>Corrido {runningCount(shoe)}</Text>
            <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.number, large && styles.largeNumber, styles.realNumber]}>
              Real {trueCount(shoe).toFixed(1)}
            </Text>
            <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.number, large && styles.largeNumber]}>Mazos {decksRemaining(shoe).toFixed(1)}</Text>
          </>
        ) : (
          <>
            <Text numberOfLines={1} adjustsFontSizeToFit style={styles.number}>Corrido —</Text>
            <Text numberOfLines={1} adjustsFontSizeToFit style={styles.number}>Real —</Text>
            <Text numberOfLines={1} adjustsFontSizeToFit style={styles.number}>Mazos —</Text>
          </>
        )}
        {onMySeat && (
          <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Cambiar asiento. Asiento ${session.mySeat ?? 'sin asignar'}`}
              accessibilityState={{ expanded: seatPickerOpen }}
              onPress={() => setSeatPickerOpen((open) => !open)}
              style={({ hovered, pressed }) => [styles.seatToggle,
                { opacity: pressed ? 0.7 : 1, backgroundColor: hovered ? '#26334D' : 'transparent' }]}
            >
              <Text numberOfLines={1} adjustsFontSizeToFit style={styles.seatToggleText}>
                Asiento {session.mySeat ?? '—'} ▾
              </Text>
            </Pressable>
        )}
      </View>
      {seatPickerOpen && onMySeat && (
        <View style={styles.seatOptions}>
          {SEATS.map((seat) => (
            <Pressable
              key={seat}
              accessibilityRole="button"
              accessibilityLabel={`Cambiar asiento al puesto ${seat}`}
              onPress={() => {
                onMySeat(seat);
                setSeatPickerOpen(false);
              }}
              style={({ hovered, pressed }) => [styles.seatOption,
                { opacity: pressed ? 0.7 : 1, backgroundColor: hovered ? '#26334D' : 'transparent' }]}
            >
              <Text
                style={[
                  styles.seatOptionText,
                  seat === session.mySeat && styles.selectedSeat,
                ]}
              >
                {seat}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
      {shoe && (
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${Math.min(100, penetration(shoe) * 100)}%` },
            ]}
          />
          <View
            style={[
              styles.cutMarker,
              { left: `${session.rules.cutPenetration * 100}%` },
            ]}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    padding: theme.space.sm,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.card,
  },
  largePanel: { padding: theme.space.md },
  warning: {
    color: theme.colors.warning,
    minHeight: theme.minTouch,
    textAlignVertical: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  number: {
    flex: 1,
    minWidth: 0,
    color: theme.colors.text,
    fontSize: theme.text.lg,
    ...theme.numbers,
  },
  largeNumber: { fontSize: theme.text.xl },
  newShoe: { minHeight: theme.minTouch, justifyContent: 'center', paddingHorizontal: theme.space.xs },
  newShoeText: { color: theme.colors.gold, fontSize: theme.text.xs },
  realNumber: {
    fontWeight: '700',
  },
  muted: {
    color: theme.colors.textMuted,
  },
  seatToggle: {
    flex: 1,
    minWidth: 0,
    minHeight: theme.minTouch,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingHorizontal: theme.space.xs,
  },
  seatToggleText: {
    color: theme.colors.gold,
  },
  seatOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  seatOption: {
    flex: 1,
    minHeight: theme.minTouch,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seatOptionText: {
    color: theme.colors.textMuted,
  },
  selectedSeat: {
    color: theme.colors.gold,
  },
  progressTrack: {
    height: 8,
    marginTop: theme.space.xs,
    borderRadius: 4,
    backgroundColor: theme.colors.muted,
  },
  progressFill: {
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.felt,
  },
  cutMarker: {
    position: 'absolute',
    top: -2,
    width: 2,
    height: 12,
    backgroundColor: theme.colors.warning,
  },
});
