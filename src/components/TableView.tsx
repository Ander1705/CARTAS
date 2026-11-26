import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import type { Rank } from '../core/cards';
import type { RoundState, SeatNumber, Target } from '../core/table';
import { theme } from '../ui/theme';

type TableViewProps = {
  round: RoundState | null;
  mySeat: SeatNumber | null;
  onPressSeat(seat: SeatNumber, hand: number): void;
  onLongPressSeat(seat: SeatNumber): void;
  onPressDealer(): void;
  onPressCard(target: Target, index: number): void;
};

type SeatProps = {
  seat: SeatNumber;
  hands: Rank[][];
  mySeat: SeatNumber | null;
  inactive: boolean;
  selected: boolean;
  compact: boolean;
  onPressSeat(seat: SeatNumber, hand: number): void;
  onLongPressSeat(seat: SeatNumber): void;
  onPressCard(target: Target, index: number): void;
};

function total(cards: Rank[]) {
  const base = cards.reduce(
    (sum, card) => sum + (card === 'A' ? 1 : card === 'T' ? 10 : Number(card)),
    0,
  );
  return base + (cards.includes('A') && base + 10 <= 21 ? 10 : 0);
}

function labelCard(card: Rank) {
  return card === 'T' ? '10' : card;
}

function Seat({
  seat,
  hands,
  mySeat,
  inactive,
  selected,
  compact,
  onPressSeat,
  onLongPressSeat,
  onPressCard,
}: SeatProps) {
  const width = compact ? 90 : 110;

  return (
    <View
      accessibilityLabel={`Puesto ${seat}, ${hands.reduce((sum, hand) => sum + hand.length, 0)} cartas`}
      style={[
        styles.seat,
        {
          width,
          borderWidth: selected ? 4 : seat === mySeat ? 2 : 1,
          borderColor: selected
            ? theme.colors.ok
            : seat === mySeat
              ? theme.colors.gold
              : theme.colors.border,
          opacity: inactive ? 0.4 : 1,
        },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Puesto ${seat}${seat === mySeat ? ', tu asiento' : ''}${inactive ? ', no juega' : ''}`}
        delayLongPress={500}
        onPress={() => onPressSeat(seat, 0)}
        onLongPress={() => onLongPressSeat(seat)}
        style={styles.seatHeader}
      >
        <Text style={styles.seatText}>
          {seat}{seat === mySeat ? ' · TÚ' : ''}{inactive ? ' · no juega' : ''}
        </Text>
      </Pressable>
      {hands.map((cards, hand) => (
        <View key={hand} style={styles.hand}>
          {cards.map((card, index) => (
            <Pressable
              key={`${index}-${card}`}
              accessibilityRole="button"
              accessibilityLabel={`Carta ${labelCard(card)} del puesto ${seat}. Mantén presionado para quitarla`}
              delayLongPress={500}
              onPress={() => onPressSeat(seat, hand)}
              onLongPress={() => onPressCard({ kind: 'seat', seat, hand }, index)}
              style={styles.cardTouch}
            >
              <Text style={styles.cardText}>{labelCard(card)}</Text>
            </Pressable>
          ))}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Mano ${hand + 1} del puesto ${seat}, total ${total(cards)}`}
            onPress={() => onPressSeat(seat, hand)}
            style={styles.handTotalTouch}
          >
            <Text style={styles.cardText}>{total(cards)}</Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
}

export function TableView({
  round,
  mySeat,
  onPressSeat,
  onLongPressSeat,
  onPressDealer,
  onPressCard,
}: TableViewProps) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const onLayout = (event: LayoutChangeEvent) => {
    setSize({
      width: event.nativeEvent.layout.width,
      height: event.nativeEvent.layout.height,
    });
  };
  const { width, height } = size;
  const centerX = width / 2;
  const radius = width * 0.42;
  const top = height * 0.35;
  const radiusY = Math.min(radius * 0.55, height - top - 60);
  const seatWidth = width < 520 ? 90 : 110;
  const dealerCards = round?.dealer ?? [];

  return (
    <View onLayout={onLayout} style={styles.table}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          dealerCards.length
            ? `Crupier, ${dealerCards.length} cartas, total ${total(dealerCards)}`
            : 'Crupier, sin cartas'
        }
        onPress={onPressDealer}
        style={[
          styles.dealer,
          {
            left: centerX - 90,
            borderWidth: round?.target?.kind === 'dealer' ? 3 : 1,
            borderColor:
              round?.target?.kind === 'dealer' ? theme.colors.ok : theme.colors.border,
          },
        ]}
      >
        {dealerCards.length ? (
          <View style={styles.dealerCards}>
            {dealerCards.map((card, index) => (
              <Pressable
                key={`${index}-${card}`}
                accessibilityRole="button"
                accessibilityLabel={`Carta ${labelCard(card)} del crupier. Mantén presionado para quitarla`}
                delayLongPress={500}
                onPress={onPressDealer}
                onLongPress={() => onPressCard({ kind: 'dealer' }, index)}
                style={styles.cardTouch}
              >
                <Text style={styles.cardText}>{labelCard(card)}</Text>
              </Pressable>
            ))}
            <Text style={styles.cardText}>· {total(dealerCards)}</Text>
          </View>
        ) : (
          <Text style={styles.cardText}>Crupier —</Text>
        )}
      </Pressable>
      {Array.from({ length: 7 }, (_, index) => {
        const seat = (index + 1) as SeatNumber;
        const angle = Math.PI * (0.1 + (0.8 * index) / 6);
        const x = centerX + radius * Math.cos(angle);
        const y = top + radiusY * Math.sin(angle);
        const hands = round?.hands[seat] ?? [];

        return (
          <View
            key={seat}
            style={[
              styles.seatPosition,
              { left: x - seatWidth / 2, top: y - 30 },
            ]}
          >
            <Seat
              seat={seat}
              hands={hands}
              mySeat={mySeat}
              inactive={round ? !round.active[seat] : false}
              selected={round?.target?.kind === 'seat' && round.target.seat === seat}
              compact={width < 520}
              onPressSeat={onPressSeat}
              onLongPressSeat={onLongPressSeat}
              onPressCard={onPressCard}
            />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  table: {
    flex: 1,
    minHeight: 120,
    overflow: 'hidden',
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.felt,
  },
  dealer: {
    position: 'absolute',
    top: 8,
    width: 180,
    minHeight: theme.minTouch,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.card,
  },
  dealerCards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
  },
  seatPosition: {
    position: 'absolute',
  },
  seat: {
    minHeight: theme.minTouch,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 3,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.card,
  },
  seatHeader: {
    minHeight: theme.minTouch,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seatText: {
    color: theme.colors.text,
    fontSize: theme.text.xs,
  },
  hand: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTouch: {
    minWidth: theme.minTouch,
    minHeight: theme.minTouch,
    alignItems: 'center',
    justifyContent: 'center',
  },
  handTotalTouch: {
    minHeight: theme.minTouch,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: {
    color: theme.colors.text,
    fontSize: theme.text.md,
    fontWeight: '600',
  },
});
