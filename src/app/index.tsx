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
import { useTableSession } from '../state/useTableSession';
import { useAdvice } from '../state/useAdvice';
import { theme } from '../ui/theme';

export default function Index() {
  const { loading, session, error, dispatch, canUndo, canRedo } = useTableSession();
  const advice = useAdvice(session);
  const { width, height } = useWindowDimensions();
  const landscape = width > height;
  const starting = session.status === 'waiting' || session.status === 'observing';

  if (loading) {
    return (
      <SafeAreaView style={styles.loading}>
        <StatusBar style="light" />
        <Text style={styles.loadingText}>Cargando…</Text>
      </SafeAreaView>
    );
  }

  const center = starting ? (
    <StartShoePanel
      status={session.status}
      onStart={(seat) => dispatch({ type: 'start', seat })}
      onObserve={() => dispatch({ type: 'observe' })}
    />
  ) : (
    <>
      <CountPanel
        session={session}
        onMySeat={(seat) => dispatch({ type: 'mySeat', seat })}
        onEndShoe={() => dispatch({ type: 'endShoe' })}
      />
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
        onPressCard={(target, index) =>
          dispatch({ type: 'removeCard', target, index })
        }
      />
      <AdvicePanel {...advice} />
      <ErrorLine error={error} />
      <ActionBar
        round={session.round}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={() => dispatch({ type: 'undo' })}
        onRedo={() => dispatch({ type: 'redo' })}
        onSplit={() => dispatch({ type: 'split' })}
        onNext={() => dispatch({ type: 'next' })}
        onFinish={() => dispatch({ type: 'finishRound' })}
      />
    </>
  );

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="light" />
      {landscape ? (
        <View style={styles.landscape}>
          <CardKeypad
            layout="split"
            side="left"
            onCard={(rank) => dispatch({ type: 'card', rank })}
          />
          <View style={styles.center}>{center}</View>
          <CardKeypad
            layout="split"
            side="right"
            onCard={(rank) => dispatch({ type: 'card', rank })}
          />
        </View>
      ) : (
        <View style={styles.portrait}>
          {center}
          {!starting && (
            <CardKeypad
              layout="grid"
              onCard={(rank) => dispatch({ type: 'card', rank })}
            />
          )}
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
  loadingText: {
    color: theme.colors.text,
  },
  screen: {
    flex: 1,
    padding: theme.space.xs,
    backgroundColor: theme.colors.background,
  },
  landscape: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
    minWidth: 0,
  },
  center: {
    flex: 1,
    minWidth: 0,
    minHeight: 0,
    overflow: 'hidden',
  },
  portrait: {
    flex: 1,
    minHeight: 0,
  },
});
