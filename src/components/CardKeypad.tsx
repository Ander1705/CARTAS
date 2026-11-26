import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type LayoutChangeEvent,
} from 'react-native';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { parseRank, type Rank } from '../core/cards';
import { theme } from '../ui/theme';

const keys = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'] as const;

type CardKeypadProps = {
  onCard(rank: Rank): void;
  layout: 'split' | 'grid';
  side?: 'left' | 'right';
  largeKeys?: boolean;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function CardKeypad({ onCard, layout, side, largeKeys = false }: CardKeypadProps) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const [size, setSize] = useState({ width: 0, height: 0 });
  const onLayout = (event: LayoutChangeEvent) => {
    setSize({
      width: event.nativeEvent.layout.width,
      height: event.nativeEvent.layout.height,
    });
  };
  const shown = layout === 'grid'
    ? keys
    : side === 'left'
      ? keys.slice(0, 7)
      : keys.slice(7);
  const rows = layout === 'grid' ? 4 : side === 'left' ? 4 : 3;
  const keyHeight = layout === 'grid'
    ? largeKeys ? clamp(screenHeight / 9, 56, 88) : clamp(0.065 * screenHeight, 48, 64)
    : Math.max(48, size.height / rows - 4);
  const keypadHeight = keyHeight * 4 + 12;
  const keypadWidth = clamp(screenWidth * 0.2, 112, 180);

  return (
    <View
      onLayout={onLayout}
      style={[
        styles.container,
        layout === 'grid'
          ? { height: keypadHeight, flex: 0 }
          : { width: keypadWidth, flex: 0 },
      ]}
    >
      {shown.map((key) => (
        <Pressable
          key={key}
          accessibilityRole="button"
          accessibilityLabel={`Carta ${key === 'A' ? 'As' : key}`}
          onPress={() => {
            if (Platform.OS !== 'web') {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            onCard(parseRank(key));
          }}
          style={({ hovered, pressed }) => [
            styles.key,
            {
              flexBasis: layout === 'grid' ? '23%' : '48%',
              flexGrow: 1,
              height: keyHeight,
              opacity: pressed ? 0.7 : 1,
              backgroundColor: hovered ? '#26334D' : theme.colors.card,
            },
          ]}
        >
          <Text style={styles.label}>{key}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignContent: 'space-between',
    justifyContent: 'space-between',
    rowGap: 4,
    columnGap: 4,
  },
  key: {
    minHeight: theme.minTouch,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.card,
  },
  label: {
    color: theme.colors.text,
    fontSize: theme.text.md,
  },
});
