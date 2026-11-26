import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Platform, useWindowDimensions, Text, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActionBar } from '../components/ActionBar';
import { AdvicePanel } from '../components/AdvicePanel';
import { CardKeypad } from '../components/CardKeypad';
import { CountPanel } from '../components/CountPanel';
import { ErrorLine } from '../components/ErrorLine';
import { SettingsPanel } from '../components/SettingsPanel';
import { StartShoePanel } from '../components/StartShoePanel';
import { TableView } from '../components/TableView';
import { suggestedBet } from '../core/betting';
import type { Rank } from '../core/cards';
import { trueCount } from '../core/hilo';
import { useBetConfig } from '../state/useBetConfig';
import { useTableSession } from '../state/useTableSession';
import { useAdvice } from '../state/useAdvice';
import { theme } from '../ui/theme';

const keyToRank: Record<string, Rank> = {
  a: 'A', '2': '2', '3': '3', '4': '4', '5': '5', '6': '6', '7': '7', '8': '8', '9': '9',
  '0': 'T', t: 'T', j: 'T', q: 'T', k: 'T',
};

export default function Index() {
  const { loading, session, error, dispatch, canUndo, canRedo } = useTableSession();
  const bets = useBetConfig();
  const advice = useAdvice(session);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { width, height } = useWindowDimensions();
  const landscape = width > height;
  const desktop = width >= 900;
  const starting = session.status === 'waiting' || session.status === 'observing';
  // Lo sugerido al empezar la ronda es lo que se debió apostar en ella.
  const roundBet = session.round ? suggestedBet(trueCount(session.round.startShoe), bets.config) : 0;

  // Atajos de teclado en la PC: A, 2-9, 0/J/Q/K = 10, espacio = siguiente, retroceso = deshacer, N = zapato.
  useEffect(() => {
    if (Platform.OS !== 'web' || settingsOpen || starting) return;
    const onKey = (event: KeyboardEvent) => {
      const tag = (event.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || event.ctrlKey || event.metaKey || event.altKey) return;
      const key = event.key.toLowerCase();
      if (keyToRank[key]) dispatch({ type: 'card', rank: keyToRank[key] });
      else if (key === ' ') dispatch({ type: 'next' });
      else if (key === 'backspace') dispatch({ type: 'undo' });
      else if (key === 'n') setSettingsOpen(true);
      else return;
      event.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dispatch, settingsOpen, starting]);

  if (loading) {
    return (
      <SafeAreaView style={styles.loading}>
        <StatusBar style="light" />
        <Text style={styles.loadingText}>Cargando…</Text>
      </SafeAreaView>
    );
  }

  if (settingsOpen) {
    return (
      <SafeAreaView style={styles.screen}>
        <StatusBar style="light" />
        <SettingsPanel
          session={session}
          config={bets.config}
          profiles={bets.profiles}
          records={bets.records}
          onUpdateConfig={bets.updateConfig}
          onSaveProfiles={bets.saveProfiles}
          onAddRecord={bets.addRecord}
          onRules={(rules) => dispatch({ type: 'rules', rules })}
          onEndShoe={() => dispatch({ type: 'endShoe' })}
          onCutCard={() => dispatch({ type: 'cutCard' })}
          onCloseSession={() => dispatch({ type: 'closeSession' })}
          onClose={() => setSettingsOpen(false)}
        />
      </SafeAreaView>
    );
  }

  if (starting) {
    return (
      <SafeAreaView style={styles.screen}>
        <StatusBar style="light" />
        <StartShoePanel
          onSettings={() => setSettingsOpen(true)}
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
      bet={bets.config}
      onMySeat={(seat) => dispatch({ type: 'mySeat', seat })}
      onSettings={() => setSettingsOpen(true)}
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
      key={`${session.sessionStart}-${session.roundsPlayed}`}
      suggestedBet={roundBet}
      desktop={desktop}
      round={session.round}
      canUndo={canUndo}
      canRedo={canRedo}
      onUndo={() => dispatch({ type: 'undo' })}
      onRedo={() => dispatch({ type: 'redo' })}
      onSplit={() => dispatch({ type: 'split' })}
      onNext={() => dispatch({ type: 'next' })}
      onFinish={(bet) => dispatch({ type: 'finishRound', bet })}
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
