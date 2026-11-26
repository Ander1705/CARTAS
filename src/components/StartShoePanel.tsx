import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ShoeStatus } from '../core/session';
import type { SeatNumber } from '../core/table';
import { seatsLeftToRight, theme } from '../ui/theme';

type StartShoePanelProps = {
  status: ShoeStatus;
  onStart(seat: SeatNumber): void;
  onObserve(): void;
};

export function StartShoePanel({ status, onStart, onObserve }: StartShoePanelProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Zapato nuevo</Text>
      <Text style={styles.subtitle}>
        {status === 'observing'
          ? 'Estás observando. Elige tu asiento cuando empiece el próximo zapato.'
          : '¿Dónde estás sentado? Se cuenta como en el casino: el 1 queda a la izquierda del crupier, o sea a tu derecha.'}
      </Text>
      <View style={styles.table}>
        <Text style={styles.dealer}>Crupier</Text>
        <View style={styles.seats}>
          {seatsLeftToRight.map((seat, column) => (
            <View
              key={seat}
              style={[styles.slot, { paddingTop: 36 * Math.sin((Math.PI * column) / 6) }]}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Empezar en el puesto ${seat}`}
                onPress={() => onStart(seat)}
                style={({ hovered, pressed }) => [styles.spot, (hovered || pressed) && styles.spotActive]}
              >
                <Text style={styles.spotText}>{seat}</Text>
              </Pressable>
            </View>
          ))}
        </View>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Observar este zapato sin jugar"
        onPress={onObserve}
        style={({ hovered, pressed }) => [styles.observe, (hovered || pressed) && styles.spotActive]}
      >
        <Text style={styles.observeText}>Llegué a mitad de zapato: solo observar</Text>
      </Pressable>
      <Text style={styles.disclaimer}>
        Herramienta de práctica. No garantiza ganancias; juega con responsabilidad.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
    justifyContent: 'center',
    padding: theme.space.lg,
    gap: theme.space.lg,
  },
  title: { color: theme.colors.text, fontSize: theme.text.xl, fontWeight: '800' },
  subtitle: { color: theme.colors.textMuted, fontSize: theme.text.md, lineHeight: 22 },
  table: {
    paddingTop: theme.space.md,
    paddingBottom: theme.space.xl,
    borderTopLeftRadius: theme.radius.md,
    borderTopRightRadius: theme.radius.md,
    borderBottomLeftRadius: 120,
    borderBottomRightRadius: 120,
    borderWidth: 6,
    borderColor: theme.colors.feltEdge,
    backgroundColor: theme.colors.felt,
    alignItems: 'center',
  },
  dealer: { color: theme.colors.textMuted, fontSize: theme.text.sm, marginBottom: theme.space.sm },
  seats: { flexDirection: 'row', width: '100%', paddingHorizontal: theme.space.xs },
  slot: { flex: 1, minWidth: 0, alignItems: 'center' },
  spot: {
    width: 46,
    maxWidth: '96%',
    aspectRatio: 1,
    borderRadius: 23,
    borderWidth: 2,
    borderColor: theme.colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spotActive: { backgroundColor: 'rgba(212,175,90,0.2)' },
  spotText: { color: theme.colors.text, fontSize: theme.text.lg, fontWeight: '800' },
  observe: {
    minHeight: theme.minTouch,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  observeText: { color: theme.colors.text, fontSize: theme.text.sm },
  disclaimer: { color: theme.colors.textMuted, fontSize: theme.text.xs, textAlign: 'center' },
});
