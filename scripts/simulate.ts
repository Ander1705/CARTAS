import { DEFAULT_RULES } from '../src/core/rules';
import { generateStrategy } from '../src/core/strategy';
import { simulate } from '../src/core/simulator';

const rounds = Number(process.argv[2] ?? 10_000_000);
const seed = 20261126;
const configurations = [
  { name: 'Reglas de la tabla de referencia', rules: { ...DEFAULT_RULES, hitSplitAces: false, resplitAces: false } },
  { name: 'Reglas de tu mesa', rules: { ...DEFAULT_RULES } },
];

for (const { name, rules } of configurations) {
  const tableStart = Date.now();
  const table = generateStrategy(rules);
  const tableTime = (Date.now() - tableStart) / 1000;
  const simStart = Date.now();
  const result = simulate(rules, table, rounds, seed);
  const simTime = (Date.now() - simStart) / 1000;
  console.log(name);
  console.log(`Rondas: ${result.rounds}`);
  console.log(`Ventaja de la casa: ${(result.houseEdge * 100).toFixed(3)}% ± ${(2 * result.stdError * 100).toFixed(3)}%`);
  console.log(`Tiempo de generar la tabla: ${tableTime.toFixed(2)} s`);
  console.log(`Tiempo de simular: ${simTime.toFixed(2)} s`);
}
console.log('Aproximación por simulación; incluye el efecto de la carta de corte.');
