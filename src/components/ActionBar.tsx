import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { RoundState } from '../core/table';
import { theme } from '../ui/theme';

type Props = {
  round: RoundState | null;
  canUndo: boolean;
  canRedo: boolean;
  onUndo(): void;
  onRedo(): void;
  onSplit(): void;
  onNext(): void;
  onFinish(): void;
};

export function ActionBar(props: Props) {
  const items: [string, boolean, () => void][] = [
    ['Deshacer', props.canUndo, props.onUndo],
    ['Rehacer', props.canRedo, props.onRedo],
    ['Dividir', true, props.onSplit],
    ['Siguiente', true, props.onNext],
    ...(props.round?.phase === 'done'
      ? [['Nueva ronda', true, props.onFinish] as [string, boolean, () => void]]
      : []),
  ];

  return (
    <View style={styles.container}>
      {items.map(([label, enabled, action]) => (
        <Pressable
          key={label}
          accessibilityRole="button"
          accessibilityLabel={label}
          disabled={!enabled}
          onPress={action}
          style={[styles.button, enabled ? styles.enabled : styles.disabled]}
        >
          <Text style={[styles.label, !enabled && styles.disabledLabel]}>
            {label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  button: {
    minWidth: theme.minTouch,
    minHeight: theme.minTouch,
    margin: 2,
    paddingHorizontal: theme.space.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.sm,
  },
  enabled: {
    backgroundColor: theme.colors.card,
  },
  disabled: {
    backgroundColor: theme.colors.muted,
  },
  label: {
    color: theme.colors.text,
  },
  disabledLabel: {
    color: theme.colors.textMuted,
  },
});
