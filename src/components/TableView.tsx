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
import { seatsLeftToRight, theme } from '../ui/theme';
import { PlayingCard } from './PlayingCard';

type TableViewProps = {
  round: RoundState | null;
  mySeat: SeatNumber | null;
  onPressSeat(seat: SeatNumber, hand: number): void;
  onLongPressSeat(seat: SeatNumber): void;
  onPressDealer(): void;
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

function TotalChip({ cards, single }: { cards: Rank[]; single: boolean }) {
  const value = total(cards);
  const bust = value > 21;
  const blackjack = value === 21 && cards.length === 2 && single;
  return (
    <View style={[styles.chip, bust && styles.bustChip, blackjack && styles.bjChip]}>
      <Text numberOfLines={1} style={[styles.chipText, blackjack && styles.bjText]}>
        {bust ? 'Pasó' : blackjack ? 'BJ' : value}
      </Text>
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
  const [area, setArea] = useState({ width: 0, height: 0 });
  const onAreaLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setArea({ width, height });
  };
  // Cada puesto es una columna de igual ancho: el arco solo baja los del centro, nunca los encima.
  const colW = area.width / 7;
  const arcDepth = Math.min(area.height * 0.18, 40);
  const cardW = Math.max(18, Math.min(colW - 8, 54));
  const dealerCardW = Math.max(26, Math.min(area.width / 9, 58));
  const dealerCards = round?.dealer ?? [];
  const lastTarget = round?.log.at(-1)?.target;
  const dealerSelected = round?.target?.kind === 'dealer';

  return (
    <View style={styles.rail}>
      <View style={styles.felt}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={dealerCards.length
            ? `Crupier, ${dealerCards.length} cartas, total ${total(dealerCards)}`
            : 'Crupier, sin cartas'}
          onPress={onPressDealer}
          style={({ hovered, pressed }) => [styles.dealer,
            dealerSelected && styles.dealerSelected,
            (hovered || pressed) && styles.hover]}
        >
          <View style={styles.dealerCards}>
            {dealerCards.map((card, index) => (
              <Pressable
                key={`${index}-${card}`}
                accessibilityRole="button"
                accessibilityLabel={`Carta ${labelCard(card)} del crupier. Mantén presionado para quitarla`}
                delayLongPress={500}
                onPress={onPressDealer}
                onLongPress={() => onPressCard({ kind: 'dealer' }, index)}
                style={{ marginLeft: index ? -dealerCardW * 0.4 : 0 }}
              >
                <PlayingCard
                  rank={card}
                  size={dealerCardW}
                  highlight={lastTarget?.kind === 'dealer' && index === dealerCards.length - 1}
                />
              </Pressable>
            ))}
            {dealerCards.length === 1 && (
              <View style={{ marginLeft: -dealerCardW * 0.4 }}>
                <PlayingCard rank={null} size={dealerCardW} />
              </View>
            )}
            {dealerCards.length === 0 && (
              <View style={[styles.cardSlot, { width: dealerCardW, height: dealerCardW * 1.4 }]} />
            )}
          </View>
          <Text style={styles.dealerLabel}>
            {dealerCards.length ? `Crupier ${total(dealerCards)}` : 'Crupier'}
          </Text>
        </Pressable>

        <View onLayout={onAreaLayout} style={styles.seats}>
          {seatsLeftToRight.map((seat, column) => {
            const hands = round?.hands[seat] ?? [];
            const inactive = round ? !round.active[seat] : false;
            const selected = round?.target?.kind === 'seat' && round.target.seat === seat;
            const mine = seat === mySeat;
            const cardCount = hands.reduce((sum, hand) => sum + hand.length, 0);
            return (
              <View
                key={seat}
                style={[styles.seat, {
                  paddingBottom: arcDepth * (1 - Math.sin((Math.PI * column) / 6)),
                  opacity: inactive ? 0.35 : 1,
                }]}
              >
                <ScrollView
                  style={styles.handsScroll}
                  contentContainerStyle={styles.handsContent}
                  nestedScrollEnabled
                >
                  {hands.map((cards, hand) => (
                    <Pressable
                      key={hand}
                      accessibilityRole="button"
                      accessibilityLabel={`Mano ${hand + 1} del puesto ${seat}`}
                      onPress={() => onPressSeat(seat, hand)}
                      style={[styles.hand,
                        selected && round?.target?.kind === 'seat'
                          && round.target.hand === hand && styles.handSelected]}
                    >
                      {cards.map((card, index) => (
                        <Pressable
                          key={`${index}-${card}`}
                          accessibilityRole="button"
                          accessibilityLabel={`Carta ${labelCard(card)} del puesto ${seat}. Mantén presionado para quitarla`}
                          delayLongPress={500}
                          onPress={() => onPressSeat(seat, hand)}
                          onLongPress={() => onPressCard({ kind: 'seat', seat, hand }, index)}
                          style={{ marginTop: index ? -cardW * 1.4 * 0.62 : 0 }}
                        >
                          <PlayingCard
                            rank={card}
                            size={cardW}
                            highlight={lastTarget?.kind === 'seat'
                              && lastTarget.seat === seat
                              && lastTarget.hand === hand
                              && index === cards.length - 1}
                          />
                        </Pressable>
                      ))}
                      {cards.length > 0 && <TotalChip cards={cards} single={hands.length === 1} />}
                    </Pressable>
                  ))}
                </ScrollView>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Puesto ${seat}${mine ? ', tu asiento' : ''}${inactive ? ', no juega' : ''}, ${cardCount} cartas. Mantén presionado para activarlo o desactivarlo`}
                  accessibilityState={{ selected }}
                  delayLongPress={500}
                  onPress={() => onPressSeat(seat, 0)}
                  onLongPress={() => onLongPressSeat(seat)}
                  style={({ hovered, pressed }) => [styles.spot,
                    mine && styles.spotMine,
                    selected && styles.spotSelected,
                    (hovered || pressed) && styles.hover]}
                >
                  <Text style={[styles.spotText, mine && styles.spotTextMine]}>{seat}</Text>
                </Pressable>
                <Text numberOfLines={1} style={styles.spotCaption}>
                  {inactive ? 'no juega' : mine ? 'tú' : ' '}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rail: {
    flex: 1,
    minHeight: 180,
    padding: 6,
    borderTopLeftRadius: theme.radius.md,
    borderTopRightRadius: theme.radius.md,
    borderBottomLeftRadius: 80,
    borderBottomRightRadius: 80,
    backgroundColor: theme.colors.feltEdge,
  },
  felt: {
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
    paddingHorizontal: 2,
    paddingTop: theme.space.xs,
    borderTopLeftRadius: theme.radius.sm,
    borderTopRightRadius: theme.radius.sm,
    borderBottomLeftRadius: 74,
    borderBottomRightRadius: 74,
    borderWidth: 1,
    borderColor: theme.colors.feltLine,
    backgroundColor: theme.colors.felt,
  },
  dealer: {
    alignSelf: 'center',
    alignItems: 'center',
    minHeight: theme.minTouch,
    paddingHorizontal: theme.space.md,
    paddingVertical: 2,
    borderRadius: theme.radius.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  dealerSelected: { borderColor: theme.colors.gold },
  hover: { backgroundColor: 'rgba(255,255,255,0.08)' },
  dealerCards: { flexDirection: 'row', alignItems: 'center' },
  cardSlot: {
    borderRadius: 6,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: theme.colors.feltLine,
  },
  dealerLabel: {
    marginTop: 2,
    color: theme.colors.text,
    fontSize: theme.text.sm,
    fontWeight: '700',
    ...theme.numbers,
  },
  seats: {
    flex: 1,
    minHeight: 0,
    flexDirection: 'row',
  },
  seat: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
  },
  handsScroll: { flex: 1, width: '100%' },
  handsContent: { flexGrow: 1, justifyContent: 'flex-end', alignItems: 'center', gap: 4 },
  hand: {
    alignItems: 'center',
    padding: 1,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  handSelected: { borderColor: theme.colors.gold },
  chip: {
    marginTop: 2,
    minWidth: 26,
    paddingHorizontal: 4,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  bustChip: { backgroundColor: theme.colors.danger },
  bjChip: { backgroundColor: theme.colors.gold },
  chipText: { color: theme.colors.text, fontSize: 11, fontWeight: '700', ...theme.numbers },
  bjText: { color: theme.colors.background },
  spot: {
    width: 44,
    maxWidth: '96%',
    aspectRatio: 1,
    marginTop: 4,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: theme.colors.feltLine,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spotMine: { borderColor: theme.colors.gold, backgroundColor: 'rgba(212,175,90,0.15)' },
  spotSelected: { borderColor: theme.colors.ok, borderWidth: 3 },
  spotText: { color: theme.colors.text, fontSize: theme.text.md, fontWeight: '700' },
  spotTextMine: { color: theme.colors.gold },
  spotCaption: { color: theme.colors.textMuted, fontSize: 11 },
});
