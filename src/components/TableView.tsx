import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import type { Rank } from '../core/cards';
import type { RoundState, SeatNumber, Target } from '../core/table';
import { theme } from '../ui/theme';
import { PlayingCard } from './PlayingCard';

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
  width: number | `${number}%`;
  height: number;
  fontSize: number;
  cardSize: number;
  round: RoundState | null;
  onPressSeat(seat: SeatNumber, hand: number): void;
  onLongPressSeat(seat: SeatNumber): void;
  onPressCard(target: Target, index: number): void;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

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
  width,
  height,
  fontSize,
  cardSize,
  round,
  onPressSeat,
  onLongPressSeat,
  onPressCard,
}: SeatProps) {
  const lastTarget = round?.log[round.log.length - 1]?.target;
  const content = (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Puesto ${seat}${seat === mySeat ? ', tu asiento' : ''}${inactive ? ', no juega' : ''}`}
        delayLongPress={500}
        onPress={() => onPressSeat(seat, 0)}
        onLongPress={() => onLongPressSeat(seat)}
        style={({ hovered, pressed }) => [styles.seatHeader,
          { opacity: pressed ? 0.7 : 1,
            backgroundColor: hovered ? 'rgba(255,255,255,0.12)' : 'transparent' }]}
      >
        <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.seatText, { fontSize }]}>
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
              style={({ hovered, pressed }) => [styles.cardTouch,
                { width: cardSize, height: cardSize * 1.4,
                  marginLeft: index ? -cardSize * 0.35 : 0,
                  opacity: pressed ? 0.7 : 1,
                  backgroundColor: hovered ? 'rgba(255,255,255,0.12)' : 'transparent' }]}
            >
              <PlayingCard
                rank={card}
                size={cardSize}
                highlight={lastTarget?.kind === 'seat'
                  && lastTarget.seat === seat
                  && lastTarget.hand === hand
                  && index === cards.length - 1}
              />
            </Pressable>
          ))}
          {cards.length > 0 && (() => {
            const bust = total(cards) > 21;
            const blackjack = total(cards) === 21 && cards.length === 2
              && hands.length === 1;
            const title = bust ? 'Se pasó' : blackjack ? 'Blackjack' : String(total(cards));
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Mano ${hand + 1} del puesto ${seat}, ${title}`}
                onPress={() => onPressSeat(seat, hand)}
                style={({ hovered, pressed }) => [styles.totalChip,
                  bust && styles.bustChip, blackjack && styles.blackjackChip,
                  { opacity: pressed ? 0.7 : 1,
                    borderWidth: hovered ? 1 : 0,
                    borderColor: theme.colors.text }]}
              >
                <Text style={[styles.totalText, blackjack && styles.blackjackText]}>
                  {title}
                </Text>
              </Pressable>
            );
          })()}
        </View>
      ))}
    </>
  );

  return (
    <View
      accessibilityLabel={`Puesto ${seat}, ${hands.reduce((sum, hand) => sum + hand.length, 0)} cartas`}
      style={[
        styles.seat,
        {
          width,
          height,
          borderWidth: selected ? 3 : seat === mySeat ? 2 : 1,
          borderColor: selected
            ? theme.colors.ok
            : seat === mySeat
              ? theme.colors.gold
              : theme.colors.border,
          opacity: inactive ? 0.4 : 1,
        },
      ]}
    >
      <ScrollView style={styles.handsScroll} nestedScrollEnabled>
        {content}
      </ScrollView>
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
  const [areaSize, setAreaSize] = useState({ width: 0, height: 0 });
  const onAreaLayout = (event: LayoutChangeEvent) => {
    setAreaSize({
      width: event.nativeEvent.layout.width,
      height: event.nativeEvent.layout.height,
    });
  };
  const onLayout = (event: LayoutChangeEvent) => {
    setSize({
      width: event.nativeEvent.layout.width,
      height: event.nativeEvent.layout.height,
    });
  };
  const { width: areaWidth, height: areaHeight } = areaSize;
  const seatW = clamp(0.165 * areaWidth, 56, 120);
  const cardSize = clamp(seatW / 3.2, 18, 44);
  const dealerCardSize = clamp(size.width / 14, 24, 52);
  const seatH = clamp(0.3 * areaHeight, 56, 110);
  const radius = Math.max(0, Math.min(
    (areaWidth - seatW) / 2,
    (areaHeight - seatH) / 0.6,
  ));
  const rowLayout = 0.416 * radius < seatW;
  const dealerCards = round?.dealer ?? [];

  return (
    <View
      onLayout={onLayout}
      style={[styles.table, {
        borderBottomLeftRadius: Math.min(size.height * 0.4, 220),
        borderBottomRightRadius: Math.min(size.height * 0.4, 220),
      }]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          dealerCards.length
            ? `Crupier, ${dealerCards.length} cartas, total ${total(dealerCards)}`
            : 'Crupier, sin cartas'
        }
        onPress={onPressDealer}
        style={({ hovered, pressed }) => [
          styles.dealer,
          {
            width: Math.min(size.width * 0.6, 260),
            borderWidth: round?.target?.kind === 'dealer' ? 3 : 1,
            borderColor:
              round?.target?.kind === 'dealer' ? theme.colors.ok : theme.colors.border,
          },
          { opacity: pressed ? 0.7 : 1,
            backgroundColor: hovered ? 'rgba(255,255,255,0.12)' : theme.colors.card },
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
                style={({ hovered, pressed }) => [styles.cardTouch,
                  { width: dealerCardSize,
                    height: dealerCardSize * 1.4,
                    marginLeft: index ? -dealerCardSize * 0.35 : 0,
                    opacity: pressed ? 0.7 : 1,
                    backgroundColor: hovered ? 'rgba(255,255,255,0.12)' : 'transparent' }]}
              >
                <PlayingCard
                  rank={card}
                  size={dealerCardSize}
                  highlight={round?.log.at(-1)?.target.kind === 'dealer'
                    && index === dealerCards.length - 1}
                />
              </Pressable>
            ))}
            {dealerCards.length === 1 && (
              <View style={{ marginLeft: -dealerCardSize * 0.35 }}>
                <PlayingCard rank={null} size={dealerCardSize} />
              </View>
            )}
            <Text style={styles.cardText}>· {total(dealerCards)}</Text>
          </View>
        ) : (
          <Text style={styles.cardText}>Crupier —</Text>
        )}
      </Pressable>
      <View onLayout={onAreaLayout} style={[styles.seatArea, {
        borderBottomLeftRadius: Math.min(size.height * 0.4, 220),
        borderBottomRightRadius: Math.min(size.height * 0.4, 220),
      }]}>
        {(rowLayout ? [7, 6, 5, 4, 3, 2, 1] : [1, 2, 3, 4, 5, 6, 7]).map((number) => {
          const seat = number as SeatNumber;
          const hands = round?.hands[seat] ?? [];
          const index = seat - 1;
          const angle = Math.PI * (0.1 + (0.8 * index) / 6);
          const x = areaWidth / 2 + radius * Math.cos(angle);
          const y = radius * 0.6 * Math.sin(angle);
          return (
            <View
              key={seat}
              style={rowLayout
                ? styles.rowSeat
                : [styles.seatPosition, {
                    left: x - seatW / 2,
                    top: y + seatH / 2 - seatH / 2,
                  }]}
            >
              <Seat
                seat={seat}
                hands={hands}
                mySeat={mySeat}
                inactive={round ? !round.active[seat] : false}
                selected={round?.target?.kind === 'seat' && round.target.seat === seat}
                width={rowLayout ? '100%' : seatW}
                height={seatH}
                fontSize={clamp(seatW / 5, 12, 18)}
                cardSize={cardSize}
                round={round}
                onPressSeat={onPressSeat}
                onLongPressSeat={onLongPressSeat}
                onPressCard={onPressCard}
              />
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  table: {
    flex: 1,
    minHeight: 200,
    overflow: 'hidden',
    borderTopLeftRadius: theme.radius.md,
    borderTopRightRadius: theme.radius.md,
    borderWidth: 6,
    borderColor: theme.colors.feltEdge,
    backgroundColor: theme.colors.felt,
  },
  dealer: {
    alignSelf: 'center',
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
  seatArea: {
    flex: 1,
    minHeight: 0,
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    columnGap: 4,
  },
  seatPosition: {
    position: 'absolute',
  },
  rowSeat: {
    flex: 1,
    minWidth: 0,
    height: '100%',
    alignItems: 'stretch',
  },
  seat: {
    minHeight: theme.minTouch,
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: 2,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.card,
  },
  handsScroll: {
    width: '100%',
    height: '100%',
  },
  seatHeader: {
    width: '100%',
    minHeight: theme.minTouch,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seatText: {
    color: theme.colors.text,
    fontSize: theme.text.xs,
  },
  hand: {
    minHeight: theme.minTouch,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTouch: {
    minWidth: 18,
    minHeight: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalChip: {
    minHeight: 24,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  bustChip: { backgroundColor: theme.colors.danger },
  blackjackChip: { backgroundColor: theme.colors.gold },
  totalText: { color: theme.colors.text, fontSize: 10, fontWeight: '700' },
  blackjackText: { color: theme.colors.cardText },
  cardText: {
    color: theme.colors.text,
    fontSize: theme.text.md,
    fontWeight: '600',
  },
});
