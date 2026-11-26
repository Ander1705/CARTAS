import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ShoeStatus } from '../core/session';
import { SEATS, type SeatNumber } from '../core/table';
import { theme } from '../ui/theme';

type StartShoePanelProps = {
  status: ShoeStatus;
  onStart(seat: SeatNumber): void;
  onObserve(): void;
};

export function StartShoePanel({ status, onStart, onObserve }: StartShoePanelProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Inicio de zapato</Text>
      <Text style={styles.subtitle}>
        {status === 'observing'
          ? 'Observando: espera el próximo zapato'
          : 'Elige tu asiento'}
      </Text>
      <View style={styles.seats}>
        {SEATS.map((seat) => (
          <Pressable
            key={seat}
            accessibilityRole="button"
            accessibilityLabel={`Iniciar en el puesto ${seat}`}
            onPress={() => onStart(seat)}
            style={styles.seatButton}
          >
            <Text style={styles.seatLabel}>{seat}</Text>
          </Pressable>
        ))}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Observar zapato"
        onPress={onObserve}
        style={styles.observeButton}
      >
        <Text style={styles.muted}>Observar (abrí a mitad de zapato)</Text>
      </Pressable>
      <Text style={styles.disclaimer}>
        Herramienta de práctica: no garantiza ganancias. Juega con responsabilidad.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.space.lg,
  },
  title: {
    color: theme.colors.text,
    fontSize: theme.text.xl,
  },
  subtitle: {
    margin: theme.space.md,
    color: theme.colors.textMuted,
    fontSize: theme.text.md,
  },
  seats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  seatButton: {
    minWidth: theme.minTouch,
    minHeight: theme.minTouch,
    margin: theme.space.xs,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.card,
  },
  seatLabel: {
    color: theme.colors.text,
  },
  observeButton: {
    minHeight: theme.minTouch,
    justifyContent: 'center',
    paddingHorizontal: theme.space.lg,
  },
  muted: {
    color: theme.colors.textMuted,
  },
  disclaimer: {
    marginTop: theme.space.lg,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
});
