import { useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { hourly, riskOfRuin, type BetConfig } from '../core/betting';
import { UNCONFIRMED_RULES, type Rules } from '../core/rules';
import { sessionRecord, type SessionRecord, type TableSession } from '../core/session';
import type { TableProfile } from '../state/useBetConfig';
import { theme } from '../ui/theme';
import { cop } from './CountPanel';

type Props = {
  session: TableSession;
  config: BetConfig;
  profiles: TableProfile[];
  records: SessionRecord[];
  onUpdateConfig(config: BetConfig): void;
  onSaveProfiles(profiles: TableProfile[]): void;
  onAddRecord(record: SessionRecord): void;
  onRules(rules: Rules): void;
  onEndShoe(): void;
  onCutCard(): void;
  onCloseSession(): void;
  onClose(): void;
};

type Field = { key: string; label: string; hint?: string };

const betFields: Field[] = [
  { key: 'bankroll', label: 'Capital (COP)' },
  { key: 'minBet', label: 'Apuesta mínima de la mesa' },
  { key: 'maxBet', label: 'Apuesta máxima de la mesa' },
  { key: 'maxNoBetHands', label: 'Máximo de manos seguidas sin apostar' },
  { key: 'ramp', label: 'Rampa en unidades', hint: 'para conteo real ≤+1, +2, +3, +4, +5 o más' },
  { key: 'kellyFraction', label: 'Fracción de Kelly', hint: '0,25 = un cuarto' },
  { key: 'yellowAt', label: 'Amarillo desde conteo real' },
  { key: 'greenAt', label: 'Verde (entra) desde conteo real' },
  { key: 'negativeAt', label: 'Muy negativo desde conteo real' },
  { key: 'handsPerHour', label: 'Manos por hora' },
  { key: 'baseEdge', label: 'Ventaja con conteo 0 (%)', hint: 'aproximación; negativa = a favor de la casa' },
  { key: 'edgePerTC', label: 'Ventaja por punto de conteo (%)', hint: 'aproximación' },
];

const ruleNumbers: Field[] = [
  { key: 'decks', label: 'Mazos' },
  { key: 'cutPenetration', label: 'Penetración del corte (%)' },
  { key: 'burnCards', label: 'Cartas quemadas al barajar' },
  { key: 'blackjackPays', label: 'Pago del blackjack', hint: '1,5 = 3 a 2' },
  { key: 'maxSplitHands', label: 'Máximo de manos al dividir' },
];
const ruleFlags: [keyof Rules, string][] = [
  ['dealerHitsSoft17', 'Crupier pide con 17 blando'],
  ['doubleAfterSplit', 'Doblar después de dividir'],
  ['dealerPeeks', 'Crupier revisa blackjack (peek)'],
  ['resplitAces', 'Volver a dividir ases'],
  ['hitSplitAces', 'Pedir sobre ases divididos'],
];
const percentKeys = new Set(['baseEdge', 'edgePerTC', 'cutPenetration']);

const show = (key: string, value: unknown) =>
  Array.isArray(value) ? value.join(', ')
    : percentKeys.has(key) ? String(Math.round(Number(value) * 100_000) / 1000)
      : String(value);
const parse = (key: string, text: string) => {
  const n = Number(text.replace(',', '.'));
  return percentKeys.has(key) ? n / 100 : n;
};

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text accessibilityRole="header" style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Btn({ text, onPress, tone = 'normal', enabled = true }: {
  text: string; onPress(): void; tone?: 'normal' | 'primary' | 'danger'; enabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !enabled }}
      disabled={!enabled}
      onPress={onPress}
      style={({ hovered, pressed }) => [styles.btn,
        tone === 'primary' && styles.btnPrimary, tone === 'danger' && styles.btnDanger,
        !enabled && styles.btnDisabled, (hovered || pressed) && styles.btnActive]}
    >
      <Text style={[styles.btnText, tone === 'primary' && styles.btnTextPrimary]}>{text}</Text>
    </Pressable>
  );
}

function Input({ label, hint, value, onChange, flag }: {
  label: string; hint?: string; value: string; onChange(v: string): void; flag?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>
        {label}{flag ? <Text style={styles.flag}>  por confirmar</Text> : null}
      </Text>
      {hint && <Text style={styles.hint}>{hint}</Text>}
      <TextInput accessibilityLabel={label} value={value} onChangeText={onChange}
        keyboardType="numbers-and-punctuation" selectTextOnFocus style={styles.input} />
    </View>
  );
}

export function SettingsPanel(p: Props) {
  const between = p.session.status === 'waiting' || p.session.status === 'observing';
  const [draft, setDraft] = useState<Record<string, string>>(() => Object.fromEntries([
    ...betFields.map((f) => [f.key, show(f.key, p.config[f.key as keyof BetConfig])]),
    ...ruleNumbers.map((f) => [f.key, show(f.key, p.session.rules[f.key as keyof Rules])]),
  ]));
  const [method, setMethod] = useState(p.config.method);
  const [flags, setFlags] = useState(() => Object.fromEntries(
    ruleFlags.map(([key]) => [key, Boolean(p.session.rules[key])])) as Record<string, boolean>);
  const [surrender, setSurrender] = useState(p.session.rules.surrender);
  const [doubleOn, setDoubleOn] = useState(p.session.rules.doubleOn);
  const [message, setMessage] = useState<string | null>(null);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [endBankroll, setEndBankroll] = useState('');
  const [rorBet, setRorBet] = useState(String(p.config.minBet * 2));
  const [rorTc, setRorTc] = useState('1');
  const set = (key: string) => (value: string) => setDraft((d) => ({ ...d, [key]: value }));

  const buildConfig = (): BetConfig => ({
    ...p.config,
    ...Object.fromEntries(betFields.filter((f) => f.key !== 'ramp')
      .map((f) => [f.key, parse(f.key, draft[f.key])])),
    ramp: draft.ramp.split(/[\s,;]+/).filter(Boolean).map(Number),
    method,
  });
  const buildRules = (): Rules => ({
    ...p.session.rules,
    ...Object.fromEntries(ruleNumbers.map((f) => [f.key, parse(f.key, draft[f.key])])),
    ...flags,
    surrender,
    doubleOn,
  });

  const saveAll = () => {
    try {
      p.onUpdateConfig(buildConfig());
      const rules = buildRules();
      if (JSON.stringify(rules) !== JSON.stringify(p.session.rules)) {
        if (!between) throw new Error('Apuestas guardadas. Las reglas solo cambian entre zapatos');
        p.onRules(rules);
      }
      setMessage('Guardado');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : String(e));
    }
  };

  const closeSession = () => {
    try {
      const end = Number(endBankroll.replace(/\D/g, ''));
      if (!endBankroll.trim()) throw new Error('Escribe tu capital final');
      p.onAddRecord(sessionRecord(p.session, p.config.bankroll, end));
      p.onUpdateConfig({ ...p.config, bankroll: end });
      p.onCloseSession();
      setDraft((d) => ({ ...d, bankroll: String(end) }));
      setEndBankroll('');
      setMessage('Sesión cerrada y guardada en el historial');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : String(e));
    }
  };

  const ror = (() => {
    const bet = Number(rorBet.replace(/\D/g, ''));
    const tc = Number(rorTc.replace(',', '.'));
    if (!bet || !Number.isFinite(tc)) return null;
    const edge = p.config.baseEdge + p.config.edgePerTC * tc;
    return { risk: riskOfRuin(p.config.bankroll, bet, edge, p.config.variance), ...hourly(bet, tc, p.config) };
  })();

  const s = p.session;
  const estDecks = s.cutAtCards === null ? null
    : (s.cutAtCards + s.rules.burnCards) / (s.rules.cutPenetration * 52);
  const totalResult = p.records.reduce((sum, r) => sum + r.endBankroll - r.startBankroll, 0);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={styles.title}>Ajustes</Text>
        <Btn text="Volver a la mesa" tone="primary" onPress={p.onClose} />
      </View>
      {message && <Text accessibilityLiveRegion="polite" style={styles.message}>{message}</Text>}
      <ScrollView contentContainerStyle={styles.content}>
        <Section title="Zapato">
          <View style={styles.row}>
            <Btn text="Salió la carta de corte" enabled={s.status === 'counting'} onPress={() => {
              p.onCutCard(); setMessage('Última ronda marcada');
            }} />
            <Btn text={confirmEnd ? '¿Seguro? Toca otra vez' : 'Nuevo zapato'} tone="danger"
              enabled={!between} onPress={() => {
                if (!confirmEnd) { setConfirmEnd(true); return; }
                setConfirmEnd(false); p.onEndShoe(); p.onClose();
              }} />
          </View>
          <Text style={styles.text}>
            {estDecks === null
              ? 'Cuando salga la carta de corte real, márcala: así se estima cuántos mazos tiene el zapato.'
              : `El último corte salió a las ${s.cutAtCards} cartas: con ${Math.round(s.rules.cutPenetration * 100)} % de penetración serían unos ${estDecks.toFixed(1)} mazos.`}
          </Text>
        </Section>

        <Section title="Sesión de juego">
          {s.sessionStart === null ? (
            <Text style={styles.text}>No hay sesión abierta. Empieza sola al iniciar un zapato.</Text>
          ) : (
            <>
              <Text style={styles.text}>
                Desde {new Date(s.sessionStart).toLocaleString('es-CO')}: {s.betRounds} rondas apostadas, {cop(s.wagered)} apostado.
                Capital al empezar {cop(p.config.bankroll)}.
              </Text>
              <View style={styles.row}>
                <TextInput accessibilityLabel="Capital final de la sesión, en pesos" value={endBankroll}
                  onChangeText={setEndBankroll} placeholder="Capital final" placeholderTextColor={theme.colors.textMuted}
                  keyboardType="number-pad" style={[styles.input, styles.flex]} />
                <Btn text="Cerrar sesión" tone="primary" onPress={closeSession} />
              </View>
            </>
          )}
          {p.records.length > 0 && (
            <View style={styles.list}>
              {p.records.map((r) => {
                const result = r.endBankroll - r.startBankroll;
                const minutes = Math.round((r.end - r.start) / 60000);
                return (
                  <View key={r.start} style={styles.listRow}>
                    <Text style={styles.text}>
                      {new Date(r.start).toLocaleDateString('es-CO')}  {Math.floor(minutes / 60)}h{String(minutes % 60).padStart(2, '0')}  {r.rounds} rondas
                    </Text>
                    <Text style={[styles.value, { color: result >= 0 ? theme.colors.ok : theme.colors.danger }]}>
                      {result >= 0 ? '+' : '−'}{cop(Math.abs(result))}
                    </Text>
                  </View>
                );
              })}
              <View style={styles.listRow}>
                <Text style={styles.value}>Total</Text>
                <Text style={[styles.value, { color: totalResult >= 0 ? theme.colors.ok : theme.colors.danger }]}>
                  {totalResult >= 0 ? '+' : '−'}{cop(Math.abs(totalResult))}
                </Text>
              </View>
            </View>
          )}
        </Section>

        <Section title="Apuestas">
          <View style={styles.row}>
            <Btn text="Rampa de unidades" tone={method === 'ramp' ? 'primary' : 'normal'} onPress={() => setMethod('ramp')} />
            <Btn text="Kelly fraccionado" tone={method === 'kelly' ? 'primary' : 'normal'} onPress={() => setMethod('kelly')} />
          </View>
          {betFields.map((f) => (
            <Input key={f.key} label={f.label} hint={f.hint} value={draft[f.key]} onChange={set(f.key)} />
          ))}
          <Btn text="Guardar ajustes" tone="primary" onPress={saveAll} />
        </Section>

        <Section title="Riesgo de ruina y ganancia por hora">
          <Text style={styles.hint}>Estimaciones con tu capital y la ventaja aproximada; no son garantía.</Text>
          <Input label="Apuesta promedio (COP)" value={rorBet} onChange={setRorBet} />
          <Input label="Conteo real promedio al que apuestas" value={rorTc} onChange={setRorTc} />
          {ror && (
            <Text style={styles.text}>
              Riesgo de ruina ≈ <Text style={styles.value}>{(ror.risk * 100).toFixed(1)} %</Text>.
              Ganancia esperada ≈ <Text style={styles.value}>{cop(ror.ev)}</Text> por hora,
              desviación ≈ <Text style={styles.value}>{cop(ror.sd)}</Text> por hora.
            </Text>
          )}
        </Section>

        <Section title="Reglas de la mesa">
          {!between && <Text style={styles.hint}>Se pueden cambiar entre zapatos.</Text>}
          {ruleNumbers.map((f) => (
            <Input key={f.key} label={f.label} hint={f.hint} value={draft[f.key]} onChange={set(f.key)}
              flag={UNCONFIRMED_RULES.includes(f.key as keyof Rules)} />
          ))}
          {ruleFlags.map(([key, label]) => (
            <Pressable key={key} accessibilityRole="switch" accessibilityState={{ checked: flags[key] }}
              onPress={() => setFlags((f) => ({ ...f, [key]: !f[key] }))} style={styles.switchRow}>
              <Text style={styles.text}>
                {label}{UNCONFIRMED_RULES.includes(key) ? <Text style={styles.flag}>  por confirmar</Text> : null}
              </Text>
              <Text style={[styles.value, { color: flags[key] ? theme.colors.ok : theme.colors.textMuted }]}>
                {flags[key] ? 'Sí' : 'No'}
              </Text>
            </Pressable>
          ))}
          <Pressable accessibilityRole="button" onPress={() => setSurrender((v) => (v === 'none' ? 'late' : 'none'))} style={styles.switchRow}>
            <Text style={styles.text}>Rendición<Text style={styles.flag}>  por confirmar</Text></Text>
            <Text style={styles.value}>{surrender === 'late' ? 'Tardía' : 'No'}</Text>
          </Pressable>
          <Pressable accessibilityRole="button"
            onPress={() => setDoubleOn((v) => (v === 'any' ? '9-11' : v === '9-11' ? '10-11' : 'any'))} style={styles.switchRow}>
            <Text style={styles.text}>Doblar con<Text style={styles.flag}>  por confirmar</Text></Text>
            <Text style={styles.value}>{doubleOn === 'any' ? 'Cualquier mano' : doubleOn}</Text>
          </Pressable>
          <Btn text="Guardar ajustes" tone="primary" onPress={saveAll} />
        </Section>

        <Section title="Perfiles de mesa">
          <View style={styles.row}>
            <TextInput accessibilityLabel="Nombre del perfil" value={profileName} onChangeText={setProfileName}
              placeholder="Ej.: Mesa 25.000" placeholderTextColor={theme.colors.textMuted} style={[styles.input, styles.flex]} />
            <Btn text="Guardar actual" enabled={profileName.trim().length > 0} onPress={() => {
              const name = profileName.trim();
              p.onSaveProfiles([...p.profiles.filter((x) => x.name !== name), { name, rules: p.session.rules, bet: p.config }]);
              setProfileName('');
              setMessage(`Perfil "${name}" guardado`);
            }} />
          </View>
          {p.profiles.map((profile) => (
            <View key={profile.name} style={styles.listRow}>
              <Text style={[styles.text, styles.flex]}>{profile.name}</Text>
              <Btn text="Usar" onPress={() => {
                try {
                  p.onUpdateConfig(profile.bet);
                  if (between) p.onRules(profile.rules);
                  setMessage(between ? `Usando "${profile.name}". Vuelve a abrir Ajustes para ver los valores.`
                    : 'Apuestas cargadas. Las reglas del perfil se aplican entre zapatos');
                } catch (e) {
                  setMessage(e instanceof Error ? e.message : String(e));
                }
              }} />
              <Btn text="Borrar" tone="danger" onPress={() => p.onSaveProfiles(p.profiles.filter((x) => x !== profile))} />
            </View>
          ))}
        </Section>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, width: '100%', maxWidth: 720, alignSelf: 'center', gap: theme.space.sm },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: theme.space.sm },
  title: { color: theme.colors.text, fontSize: theme.text.xl, fontWeight: '800' },
  message: { color: theme.colors.gold, fontWeight: '700' },
  content: { gap: theme.space.lg, paddingBottom: theme.space.xl },
  section: {
    gap: theme.space.sm,
    padding: theme.space.md,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },
  sectionTitle: { color: theme.colors.gold, fontSize: theme.text.lg, fontWeight: '800' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.sm, alignItems: 'center' },
  flex: { flex: 1, minWidth: 120 },
  text: { color: theme.colors.text, fontSize: theme.text.sm, lineHeight: 20 },
  value: { color: theme.colors.text, fontWeight: '800', ...theme.numbers },
  hint: { color: theme.colors.textMuted, fontSize: theme.text.xs },
  flag: { color: theme.colors.warning, fontSize: theme.text.xs },
  field: { gap: 2 },
  fieldLabel: { color: theme.colors.text, fontSize: theme.text.sm },
  input: {
    minHeight: theme.minTouch,
    paddingHorizontal: theme.space.sm,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    color: theme.colors.text,
    fontSize: theme.text.md,
    backgroundColor: theme.colors.muted,
  },
  btn: {
    minHeight: theme.minTouch,
    paddingHorizontal: theme.space.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceHi,
  },
  btnPrimary: { backgroundColor: theme.colors.gold, borderColor: theme.colors.gold },
  btnDanger: { borderColor: theme.colors.danger },
  btnDisabled: { opacity: 0.4 },
  btnActive: { opacity: 0.8 },
  btnText: { color: theme.colors.text, fontWeight: '600' },
  btnTextPrimary: { color: theme.colors.background, fontWeight: '800' },
  list: { gap: 4 },
  switchRow: {
    minHeight: theme.minTouch,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.space.sm,
  },
  listRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: theme.space.sm },
});
