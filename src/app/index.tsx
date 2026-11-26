import { StatusBar } from 'expo-status-bar';
import { useWindowDimensions, Text, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActionBar } from '../components/ActionBar';
import { AdvicePanel } from '../components/AdvicePanel';
import { CardKeypad } from '../components/CardKeypad';
import { CountPanel } from '../components/CountPanel';
import { ErrorLine } from '../components/ErrorLine';
import { StartShoePanel } from '../components/StartShoePanel';
import { TableView } from '../components/TableView';
import type { Rank } from '../core/cards';
import { useTableSession } from '../state/useTableSession';
import { useAdvice } from '../state/useAdvice';
import { theme } from '../ui/theme';

export default function Index() {
  const { loading, session, error, dispatch, canUndo, canRedo } = useTableSession();
  const advice = useAdvice(session);
  const { width, height } = useWindowDimensions();
  const landscape = width > height;
  const desktop = width >= 900;
  const starting = session.status === 'waiting' || session.status === 'observing';

  if (loading) {
    return (
      <SafeAreaView style={styles.loading}>
        <StatusBar style="light" />
        <Text style={styles.loadingText}>Cargando…</Text>
      </SafeAreaView>
    );
  }

  if (starting) {
    return (
      <SafeAreaView style={styles.screen}>
        <StatusBar style="light" />
        <StartShoePanel
          status={session.status}
          onStart={(seat) => dispatch({ type: 'start', seat })}
          onObserve={() => dispatch({ type: 'observe' })}
        />
      </SafeAreaView>
    );
  }

  const onCard = (rank: Rank) => dispatch({ type: 'card', rank });
  const count = (
    <CountPanel
      large={desktop}
      session={session}
      onMySeat={(seat) => dispatch({ type: 'mySeat', seat })}
      onEndShoe={() => dispatch({ type: 'endShoe' })}
    />
  );
  const table = (
    <TableView
      round={session.round}
      mySeat={session.mySeat}
      onPressSeat={(seat, hand) => {
        if (session.round?.phase === 'initial' || session.round?.phase === 'players') {
          dispatch({ type: 'target', target: { kind: 'seat', seat, hand } });
        }
      }}
      onLongPressSeat={(seat) => dispatch({ type: 'toggleSeat', seat })}
      onPressDealer={() => dispatch({ type: 'target', target: { kind: 'dealer' } })}
      onPressCard={(target, index) => dispatch({ type: 'removeCard', target, index })}
    />
  );
  const actions = (
    <ActionBar
      desktop={desktop}
      round={session.round}
      canUndo={canUndo}
      canRedo={canRedo}
      onUndo={() => dispatch({ type: 'undo' })}
      onRedo={() => dispatch({ type: 'redo' })}
      onSplit={() => dispatch({ type: 'split' })}
      onNext={() => dispatch({ type: 'next' })}
      onFinish={() => dispatch({ type: 'finishRound' })}
    />
  );

  if (desktop) {
    return (
      <SafeAreaView style={styles.screen}>
        <StatusBar style="light" />
        <View style={styles.desktop}>
          <View style={styles.desktopSide}>
            {count}
            <AdvicePanel {...advice} large />
          </View>
          <View style={styles.column}>
            {table}
            <ErrorLine error={error} />
          </View>
          <View style={styles.desktopSide}>
            <CardKeypad columns={2} onCard={onCard} style={styles.fill} />
            {actions}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const center = (
    <View style={styles.column}>
      {count}
      {table}
      <AdvicePanel {...advice} />
      <ErrorLine error={error} />
      {actions}
    </View>
  );

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="light" />
      {landscape ? (
        <View style={styles.row}>
          <CardKeypad columns={1} only="low" onCard={onCard} style={styles.sideKeys} />
          {center}
          <CardKeypad columns={1} only="high" onCard={onCard} style={styles.sideKeys} />
        </View>
      ) : (
        <View style={styles.column}>
          {center}
          <CardKeypad columns={5} onCard={onCard} style={styles.bottomKeys} />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: { color: theme.colors.text },
  screen: {
    flex: 1,
    padding: theme.space.sm,
    backgroundColor: theme.colors.background,
  },
  row: { flex: 1, minHeight: 0, flexDirection: 'row', gap: theme.space.sm },
  column: { flex: 1, minWidth: 0, minHeight: 0, gap: theme.space.sm },
  fill: { flex: 1 },
  sideKeys: { width: 76 },
  bottomKeys: { height: 2 * 60 + 6 },
  desktop: { flex: 1, minHeight: 0, flexDirection: 'row', gap: theme.space.lg },
  desktopSide: { width: '26%', minWidth: 0, gap: theme.space.md },
});
