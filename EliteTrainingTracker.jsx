import React, { useEffect, useMemo, useState } from 'react';

const SET_POINTS = {
  'Back Squat': 150,
  'Front Squat': 120,
  Deadlift: 170,
  'Bench Press': 110,
  'Shoulder Press': 65,
};

const MONTH_CONFIG = {
  1: { label: 'Fevereiro', range: [0.8, 0.9], focus: 'Base de força + técnica sob fadiga controlada' },
  2: { label: 'Março', range: [0.7, 0.75], focus: 'Volume inteligente + refinamento mecânico' },
  3: { label: 'Abril', range: [0.8, 0.85], focus: 'Intensificação progressiva + consistência' },
  4: { label: 'Maio', range: [0.85, 0.95], focus: 'Bloco de elite + tolerância a cargas altas' },
  5: { label: 'Junho', range: [1.0, 1.0], focus: 'Peak month: expressão máxima de performance' },
};

const WEEKDAY_TEMPLATES = {
  0: {
    warmup: ['8\' Bike erg leve', '2 RNDS: 10 PVC pass-through + 10 Air Squats + 30s Ankle stretch'],
    strength: [
      { movement: 'Back Squat', lift: 'Back Squat', sets: 5, reps: 5, tempo: '31X1' },
      { movement: 'Bench Press', lift: 'Bench Press', sets: 4, reps: 6, tempo: '21X1' },
    ],
    conditioning: [
      "AMRAP 14': 12 Wall Balls (9/6kg), 10 Toes to Bar, 8 DB Snatches (22.5/15kg)",
      "Goal: ritmo constante, sem quebra técnica | Cap: 14'",
    ],
    cooldown: ['2 RNDS: 60s Child\'s Pose + 45s Pec stretch por lado', '2 min box breathing'],
  },
  1: {
    warmup: ['300m Row + mobilidade específica de ombro', '2 RNDS: 10 Ring Rows + 12 Reverse Lunges'],
    strength: [{ movement: 'Shoulder Press', lift: 'Shoulder Press', sets: 6, reps: 3, tempo: '20X1' }],
    conditioning: [
      "For Time (Cap 12'): 21-15-9 Thrusters (40/30kg) + Pull-Ups",
      'Goal: unbroken sets iniciais e pacing agressivo na última ronda',
    ],
    cooldown: ['3 min de breathing nasal em decúbito dorsal', '90s Sleeper stretch por lado'],
  },
  2: {
    warmup: ['400m Row', '2 RNDS: 30s Couch Stretch, 15 KB Swings (24kg)'],
    strength: [{ movement: 'Deadlift', lift: 'Deadlift', sets: 5, reps: 3, fixedPercent: 0.8, tempo: '21X1' }],
    conditioning: [
      "EMOM 16': M1: 15 Cal Row, M2: 15 Box Jumps, M3: 12 Burpees Lateral, M4: Rest",
      'Goal: manter output estável em todas as rondas | Cap: 16\'',
    ],
    cooldown: ['3 RNDS: 60s Legs up the wall, 30s Figure 4'],
  },
  3: {
    warmup: ['10\' Assault Bike Z2', '2 RNDS: 12 Glute bridges + 10 Cossack squats'],
    strength: [{ movement: 'Front Squat', lift: 'Front Squat', sets: 5, reps: 4, tempo: '30X1' }],
    conditioning: [
      "4 RNDS for quality: 500m Row + 20 GHD Sit-Ups + 15 Push-Ups",
      "Goal: engine sustentável e core íntegro | Cap: 20'",
    ],
    cooldown: ['2 RNDS: 60s pigeon stretch por lado', '2 min respiração 4-7-8'],
  },
  4: {
    warmup: ['5\' Ski erg + mobilidade torácica', '2 RNDS: 8 Tempo squats (3s descida) + 12 Banded pull-aparts'],
    strength: [
      { movement: 'Back Squat (heavy triples)', lift: 'Back Squat', sets: 6, reps: 3, tempo: '20X1' },
      { movement: 'Shoulder Press (volume)', lift: 'Shoulder Press', sets: 4, reps: 8, tempo: '2111' },
    ],
    conditioning: [
      "Chipper (Cap 18'): 30 Cal Bike, 30 KB Swings (32/24), 30 Box Step Overs, 30 Sit-Ups",
      'Goal: transições rápidas e respiração sob controlo',
    ],
    cooldown: ['90s Lat stretch por lado', '90s Hamstring stretch por lado', '2 min breathing down-regulation'],
  },
  5: {
    warmup: ['300m Run + drills técnicos', '2 RNDS: 10 Scap push-ups + 10 Single-leg RDL'],
    strength: [{ movement: 'Bench Press', lift: 'Bench Press', sets: 5, reps: 5, tempo: '21X1' }],
    conditioning: ['Partner style solo adaptation: 5 sets 2\' on / 1\' off (row + burpee over erg)', 'Goal: potência anaeróbia'],
    cooldown: ['8\' caminhada leve + mobilidade global'],
  },
  6: {
    warmup: ['Recovery Flow: 12\' bike leve + fascia release'],
    strength: [{ movement: 'Accessory Posterior Chain', sets: 3, reps: 12, tempo: '2020', noLoad: true }],
    conditioning: ['Zone 2 25-35 min (run / row / bike)', 'Goal: recuperação ativa e capilarização'],
    cooldown: ['5\' respiração diafragmática + alongamentos estáticos leves'],
  },
};

const LOG_STORAGE_KEY = 'elite-training-logs-v1';

const formatDateLabel = (date) =>
  new Intl.DateTimeFormat('pt-PT', { weekday: 'long', day: '2-digit', month: '2-digit' }).format(date);

const roundToNearest = (value, step = 2.5) => Math.round(value / step) * step;

const getWeeksBetween = (year = new Date().getFullYear()) => {
  const start = new Date(year, 1, 1);
  const end = new Date(year, 5, 30);

  const firstMonday = new Date(start);
  while (firstMonday.getDay() !== 1) firstMonday.setDate(firstMonday.getDate() - 1);

  const weeks = [];
  const cursor = new Date(firstMonday);

  while (cursor <= end) {
    const weekStart = new Date(cursor);
    const days = Array.from({ length: 7 }).map((_, index) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + index);
      return d;
    });
    weeks.push({ weekStart, days });
    cursor.setDate(cursor.getDate() + 7);
  }

  return weeks.filter((w) => w.days.some((d) => d >= start && d <= end));
};

const computePercent = (date, fixedPercent) => {
  if (fixedPercent) return fixedPercent;
  const month = MONTH_CONFIG[date.getMonth()];
  if (!month) return 0;
  const [min, max] = month.range;
  const weekOfMonth = Math.ceil(date.getDate() / 7);
  const progression = Math.min((weekOfMonth - 1) / 3, 1);
  return Number((min + (max - min) * progression).toFixed(3));
};

const computeWorkoutForDate = (date) => {
  const template = WEEKDAY_TEMPLATES[date.getDay()];
  const month = MONTH_CONFIG[date.getMonth()];

  const strength = template.strength.map((item, idx) => {
    const pct = computePercent(date, item.fixedPercent);
    const prBase = item.lift ? SET_POINTS[item.lift] : null;
    const kg = prBase && !item.noLoad ? roundToNearest(prBase * pct) : null;
    return {
      ...item,
      id: `strength-${idx}`,
      percent: pct,
      calculatedLoad: kg,
      monthLabel: month?.label,
    };
  });

  const toBlockItems = (blockName, items) =>
    items.map((text, index) => ({ id: `${blockName}-${index}`, text }));

  return {
    warmup: toBlockItems('warmup', template.warmup),
    strength,
    conditioning: toBlockItems('conditioning', template.conditioning),
    cooldown: toBlockItems('cooldown', template.cooldown),
  };
};

const ExerciseLine = ({ title, subtitle, onLog, hasLog }) => (
  <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-4 shadow-lg shadow-black/20">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-sm font-semibold text-zinc-100">{title}</p>
        {subtitle && <p className="mt-1 text-xs text-zinc-400">{subtitle}</p>}
      </div>
      <button
        type="button"
        onClick={onLog}
        className="rounded-md border border-cyan-400/40 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300 transition hover:border-cyan-300 hover:bg-cyan-400/20"
      >
        {hasLog ? 'Editar Log' : 'Log'}
      </button>
    </div>
  </div>
);

export default function EliteTrainingTracker() {
  const [weeks] = useState(() => getWeeksBetween());
  const [selectedWeek, setSelectedWeek] = useState(0);
  const [selectedDay, setSelectedDay] = useState(2);
  const [logs, setLogs] = useState({});
  const [modalState, setModalState] = useState({ open: false, key: '', title: '' });
  const [formState, setFormState] = useState({ load: '', rpe: '', time: '', shoulderNotes: '' });

  useEffect(() => {
    const stored = localStorage.getItem(LOG_STORAGE_KEY);
    if (stored) {
      try {
        setLogs(JSON.parse(stored));
      } catch {
        setLogs({});
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(logs));
  }, [logs]);

  const currentWeek = weeks[selectedWeek] ?? weeks[0];
  const currentDate = currentWeek?.days[selectedDay];
  const workout = useMemo(() => (currentDate ? computeWorkoutForDate(currentDate) : null), [currentDate]);

  const monthInfo = currentDate ? MONTH_CONFIG[currentDate.getMonth()] : null;
  const weekLogCount = currentWeek
    ? currentWeek.days.reduce((acc, day) => {
        const dayPrefix = day.toISOString().slice(0, 10);
        return acc + Object.keys(logs).filter((k) => k.startsWith(dayPrefix)).length;
      }, 0)
    : 0;

  const openLog = (key, title) => {
    setModalState({ open: true, key, title });
    setFormState(logs[key] || { load: '', rpe: '', time: '', shoulderNotes: '' });
  };

  const saveLog = () => {
    setLogs((prev) => ({ ...prev, [modalState.key]: formState }));
    setModalState({ open: false, key: '', title: '' });
  };

  if (!currentWeek || !currentDate || !workout) return null;

  const dateKey = currentDate.toISOString().slice(0, 10);

  const renderBlock = (name, items, isStrength = false) => (
    <section className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4">
      <h3 className="text-sm font-bold uppercase tracking-wider text-lime-400">{name}</h3>
      {items.map((item, idx) => {
        const logKey = `${dateKey}-${name}-${item.id || idx}`;
        const hasLog = Boolean(logs[logKey]);

        if (isStrength) {
          const subtitle = item.noLoad
            ? `${item.sets}x${item.reps} | Tempo ${item.tempo}`
            : `${item.sets}x${item.reps} | ${(item.percent * 100).toFixed(0)}% | ${item.calculatedLoad}kg | Tempo ${item.tempo}`;
          return (
            <ExerciseLine
              key={logKey}
              title={item.movement}
              subtitle={subtitle}
              hasLog={hasLog}
              onLog={() => openLog(logKey, item.movement)}
            />
          );
        }

        return (
          <ExerciseLine
            key={logKey}
            title={item.text}
            hasLog={hasLog}
            onLog={() => openLog(logKey, `${name}: ${item.text}`)}
          />
        );
      })}
    </section>
  );

  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6">
        <header className="rounded-2xl border border-zinc-800 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 p-5">
          <h1 className="font-mono text-2xl font-bold text-cyan-300">Elite CrossFit Tracker</h1>
          <p className="mt-1 text-sm text-zinc-400">Dashboard industrial em dark mode para monitorização de força, metcons e recuperação.</p>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <p className="text-xs uppercase tracking-wide text-zinc-500">Set Points / PRs</p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              {Object.entries(SET_POINTS).map(([lift, kg]) => (
                <div key={lift} className="rounded-lg border border-zinc-700 bg-zinc-950 p-2">
                  <p className="text-zinc-300">{lift}</p>
                  <p className="font-mono text-cyan-300">{kg}kg</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <p className="text-xs uppercase tracking-wide text-zinc-500">Foco do Mês Atual</p>
            <p className="mt-3 text-sm text-zinc-200">{monthInfo?.label}</p>
            <p className="mt-1 text-sm text-zinc-400">{monthInfo?.focus}</p>
            <p className="mt-2 font-mono text-lime-400">
              Intensidade alvo: {(monthInfo?.range[0] * 100).toFixed(0)}% - {(monthInfo?.range[1] * 100).toFixed(0)}%
            </p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <p className="text-xs uppercase tracking-wide text-zinc-500">Estado de Tracking</p>
            <p className="mt-3 text-3xl font-bold text-cyan-300">{weekLogCount}</p>
            <p className="text-sm text-zinc-400">logs gravados nesta semana</p>
            <p className="mt-2 text-xs text-zinc-500">Persistência local via localStorage.</p>
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-cyan-300">Seletor de Calendário (Fev-Jun)</h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={selectedWeek === 0}
                onClick={() => setSelectedWeek((w) => Math.max(0, w - 1))}
                className="rounded-md border border-zinc-700 px-3 py-1 text-xs disabled:opacity-40"
              >
                Semana anterior
              </button>
              <button
                type="button"
                disabled={selectedWeek === weeks.length - 1}
                onClick={() => setSelectedWeek((w) => Math.min(weeks.length - 1, w + 1))}
                className="rounded-md border border-zinc-700 px-3 py-1 text-xs disabled:opacity-40"
              >
                Próxima semana
              </button>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-7">
            {currentWeek.days.map((day, idx) => {
              const inRange = day.getMonth() >= 1 && day.getMonth() <= 5;
              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => setSelectedDay(idx)}
                  disabled={!inRange}
                  className={`rounded-lg border p-2 text-left text-xs transition ${
                    selectedDay === idx
                      ? 'border-cyan-400 bg-cyan-500/20 text-cyan-200'
                      : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-600'
                  } disabled:opacity-30`}
                >
                  <p className="font-semibold">{day.toLocaleDateString('pt-PT', { weekday: 'short' })}</p>
                  <p>{day.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' })}</p>
                </button>
              );
            })}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-mono text-xl text-lime-400">Visualizador de Treino — {formatDateLabel(currentDate)}</h2>
          {renderBlock('Warm-up', workout.warmup)}
          {renderBlock('Strength', workout.strength, true)}
          {renderBlock('Conditioning', workout.conditioning)}
          {renderBlock('Cool-down', workout.cooldown)}
        </section>
      </div>

      {modalState.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-xl border border-zinc-700 bg-zinc-900 p-4 shadow-2xl">
            <h3 className="text-sm font-semibold text-cyan-300">Log de Exercício</h3>
            <p className="mt-1 text-xs text-zinc-400">{modalState.title}</p>

            <div className="mt-4 space-y-3 text-sm">
              <label className="block">
                <span className="text-zinc-400">Carga Realizada (kg)</span>
                <input
                  className="mt-1 w-full rounded-md border border-zinc-700 bg-black px-3 py-2 text-zinc-100"
                  value={formState.load}
                  onChange={(e) => setFormState((prev) => ({ ...prev, load: e.target.value }))}
                />
              </label>
              <label className="block">
                <span className="text-zinc-400">RPE (1-10)</span>
                <input
                  className="mt-1 w-full rounded-md border border-zinc-700 bg-black px-3 py-2 text-zinc-100"
                  value={formState.rpe}
                  onChange={(e) => setFormState((prev) => ({ ...prev, rpe: e.target.value }))}
                />
              </label>
              <label className="block">
                <span className="text-zinc-400">Tempo</span>
                <input
                  className="mt-1 w-full rounded-md border border-zinc-700 bg-black px-3 py-2 text-zinc-100"
                  value={formState.time}
                  onChange={(e) => setFormState((prev) => ({ ...prev, time: e.target.value }))}
                />
              </label>
              <label className="block">
                <span className="text-zinc-400">Notas de Ombro</span>
                <textarea
                  className="mt-1 w-full rounded-md border border-zinc-700 bg-black px-3 py-2 text-zinc-100"
                  rows={3}
                  value={formState.shoulderNotes}
                  onChange={(e) => setFormState((prev) => ({ ...prev, shoulderNotes: e.target.value }))}
                />
              </label>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-md border border-zinc-700 px-3 py-1 text-xs"
                onClick={() => setModalState({ open: false, key: '', title: '' })}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="rounded-md border border-lime-500 bg-lime-500/20 px-3 py-1 text-xs text-lime-300"
                onClick={saveLog}
              >
                Guardar Log
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
