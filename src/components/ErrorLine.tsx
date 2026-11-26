import { StyleSheet, Text } from 'react-native';
import { theme } from '../ui/theme';

export function ErrorLine({ error }: { error: string | null }) {
  if (!error) return null;

  return (
    <Text accessibilityLiveRegion="polite" style={styles.error}>
      {error}
    </Text>
  );
}

const styles = StyleSheet.create({
  error: {
    padding: theme.space.xs,
    color: theme.colors.danger,
    textAlign: 'center',
  },
});
