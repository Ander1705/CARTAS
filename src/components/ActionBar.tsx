import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
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
  desktop?: boolean;
};

export function ActionBar(props: Props) {
  const { width } = useWindowDimensions();
  const compact = width < 400;
  const items: [string, string, boolean, () => void][] = [
    ['Deshacer', '↶', props.canUndo, props.onUndo],
    ['Rehacer', '↷', props.canRedo, props.onRedo],
    ['Dividir', 'Dividir', true, props.onSplit],
    ['Siguiente', compact ? 'Sig.' : 'Siguiente', true, props.onNext],
    ...(props.round?.phase === 'done'
      ? [['Nueva ronda', compact ? 'Nueva' : 'Nueva ronda', true, props.onFinish] as [string, string, boolean, () => void]]
      : []),
  ];

  return (
    <View style={[styles.container, props.desktop && styles.desktopContainer]}>
      {items.map(([label, text, enabled, action]) => (
        <Pressable
          key={label}
          accessibilityRole="button"
          accessibilityLabel={label}
          disabled={!enabled}
          onPress={action}
          style={({ hovered, pressed }) => [styles.button,
            enabled ? styles.enabled : styles.disabled,
            props.desktop && styles.desktopButton,
            { opacity: pressed ? 0.7 : 1,
              backgroundColor: hovered ? '#26334D' : undefined }]}
        >
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
            style={[styles.label, !enabled && styles.disabledLabel]}
          >
            {text}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
  },
  desktopContainer: {
    flexWrap: 'wrap',
  },
  desktopButton: {
    flexBasis: '30%',
  },
  button: {
    flex: 1,
    minWidth: 0,
    minHeight: theme.minTouch,
    margin: 2,
    paddingHorizontal: theme.space.xs,
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
