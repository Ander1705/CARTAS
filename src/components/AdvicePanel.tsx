import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import type { FullAdvice, QuickAdvice, TurnInfo } from '../core/advice';
import type { PlayAction } from '../core/deviations';
import { theme } from '../ui/theme';

type Props = {
  info: TurnInfo;
  quick: QuickAdvice | null;
  full: FullAdvice | null;
  computing: boolean;
  error: string | null;
};

const labels: Record<PlayAction, string> = {
  H: 'PEDIR', S: 'PLANTARSE', D: 'DOBLAR', P: 'DIVIDIR', R: 'RENDIRSE',
};

function formatEV(value: number | null): string {
  return value === null ? '—' : value.toFixed(3).replace('.', ',');
}

export function AdvicePanel({ info, quick, full, computing, error }: Props) {
  const { height } = useWindowDimensions();
  const compact = height < 420;
  if (!info.myTurn) {
    if (info.turnSeat === null) {
      return info.shoe ? <Text style={styles.waiting}>Esperando tu turno</Text> : null;
    }
    return <Text style={styles.waiting}>Turno del puesto {info.turnSeat}</Text>;
  }
  const action = full?.bestAction ?? quick?.countDeviation?.action ?? quick?.tableAction;
  const evs = full?.evs;
  const entries: [PlayAction, number | null][] = evs ? [
    ['S', evs.stand], ['H', evs.hit], ['D', evs.double],
    ['P', evs.split], ['R', evs.surrender],
  ].filter((entry): entry is [PlayAction, number] => entry[1] !== null)
    .sort((a, b) => b[1] - a[1]).slice(0, 3) : [];

  return (
    <View style={[styles.panel, compact && styles.compact]} accessibilityLiveRegion="polite">
      {action && (
        <View style={[styles.action, action === 'D' || action === 'P' ? styles.felt : null,
          action === 'R' && styles.warning]}>
          <Text style={[styles.actionText, compact && styles.compactAction,
            action === 'R' && styles.warningText]}>{labels[action]}</Text>
        </View>
      )}
      <Text style={styles.line}>
        Tabla: {quick?.tableAction ? labels[quick.tableAction] : 'no precalculada para estas reglas'}
      </Text>
      {quick?.countDeviation && (
        <Text style={styles.line}>
          Conteo real {info.tcIndex !== null && info.tcIndex >= 0 ? '+' : ''}{info.tcIndex} → {labels[quick.countDeviation.action]}
          {' '}({quick.countDeviation.id.toUpperCase().replace('-', ' ')}, índice {quick.countDeviation.index})
        </Text>
      )}
      {computing && !full ? <Text style={styles.line}>Calculando…</Text> : entries.length > 0 && (
        <Text style={styles.line}>
          Exacto: {entries.map(([choice, value]) => `${labels[choice]} ${formatEV(value)}`).join(' · ')}
        </Text>
      )}
      {full?.compositionDeviation && <Text style={styles.line}>Desviación por composición: el cálculo exacto difiere de la tabla</Text>}
      {quick?.insurance !== null && quick?.insurance !== undefined && (
        <Text style={styles.line}>Seguro: {quick.insurance ? 'SÍ (conteo real ≥ +3)' : 'NO'}</Text>
      )}
      {error && <Text style={styles.line}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { padding: theme.space.sm, borderRadius: theme.radius.sm, backgroundColor: theme.colors.card, gap: 3 },
  compact: { padding: 4, gap: 1 },
  waiting: { color: theme.colors.textMuted, paddingHorizontal: theme.space.sm, paddingVertical: 2 },
  action: { alignSelf: 'flex-start', paddingHorizontal: theme.space.md, paddingVertical: 2, borderRadius: theme.radius.sm, backgroundColor: theme.colors.background },
  felt: { backgroundColor: theme.colors.felt },
  warning: { backgroundColor: theme.colors.warning },
  actionText: { color: theme.colors.text, fontSize: theme.text.display, fontWeight: '800' },
  compactAction: { fontSize: 24 },
  warningText: { color: '#111827' },
  line: { color: theme.colors.text, fontSize: theme.text.xs },
});
