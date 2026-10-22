import { useId, type CSSProperties, type ReactNode } from 'react';
import type { VisualKind } from '../../../content/projects';

/*
 * Schematic illustrations, not screenshots. Every label names a real component,
 * check, or stage from the project's implementation; no figures are invented.
 *
 * Two compositions per project: `wide` (640×440) for roomy cards, and `compact`
 * (360×480, portrait) for narrow ones, so labels render near 1:1 on phones
 * instead of shrinking to illegibility. Text stays in ink; amber marks carry
 * emphasis. Elements draw in when the figure first scrolls into view.
 */

export type IllustrationLayout = 'wide' | 'compact';

export const ILLUSTRATION_SIZE: Record<IllustrationLayout, { width: number; height: number }> = {
  wide: { width: 640, height: 440 },
  compact: { width: 360, height: 480 },
};

const delay = (seconds: number) => ({ '--d': `${seconds}s` }) as CSSProperties;

function Label({
  x,
  y,
  children,
  strong = false,
  small = false,
  anchor = 'start',
}: {
  x: number;
  y: number;
  children: ReactNode;
  strong?: boolean;
  small?: boolean;
  anchor?: 'start' | 'middle' | 'end';
}) {
  const classes = ['v-label', strong ? 'v-label--strong' : '', small ? 'v-label--sm' : ''].filter(Boolean).join(' ');
  return (
    <text x={x} y={y} className={classes} textAnchor={anchor}>
      {children}
    </text>
  );
}

/** Amber key mark: emphasis lives on the mark beside the text, never on the text. */
function Swatch({ x, y }: { x: number; y: number }) {
  return <rect x={x} y={y - 7} width={7} height={7} className="v-fill-amber" />;
}

function Node({
  x,
  y,
  w,
  h,
  label,
  active = false,
  dashed = false,
  d = 0,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  active?: boolean;
  dashed?: boolean;
  d?: number;
}) {
  return (
    <g className="v-pop" style={delay(d)}>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={2}
        className={`v-node${active ? ' v-node--active' : ''}${dashed ? ' v-dash' : ''}`}
      />
      <Label x={x + w / 2} y={y + h / 2 + 4} anchor="middle" strong small>
        {label}
      </Label>
    </g>
  );
}

/** A connector that draws itself in, then carries a travelling amber pulse. */
function Link({ path, d = 0, dashed = false }: { path: string; d?: number; dashed?: boolean }) {
  return (
    <g>
      <path
        d={path}
        pathLength={1}
        className={`v-line v-line--strong${dashed ? ' v-dash' : ' v-draw'}`}
        style={delay(d)}
      />
      {dashed ? null : <path d={path} className="v-flow" style={{ animationDelay: `${d + 1}s` }} />}
    </g>
  );
}

/** Horizontal bar with a rounded data-end, square at the baseline, over a same-hue track. */
function Bar({
  x,
  y,
  width,
  value,
  accent = false,
  d = 0,
}: {
  x: number;
  y: number;
  width: number;
  value: number;
  accent?: boolean;
  d?: number;
}) {
  const length = width * value;
  const h = 8;
  const r = 4;
  return (
    <g>
      <rect x={x} y={y} width={width} height={h} className={accent ? 'v-track-amber' : 'v-fill-dim'} />
      <path
        d={`M${x} ${y} H${x + length - r} A${r} ${r} 0 0 1 ${x + length} ${y + r} A${r} ${r} 0 0 1 ${x + length - r} ${y + h} H${x} Z`}
        className={`v-grow ${accent ? 'v-fill-amber' : 'v-fill-mid'}`}
        style={delay(d)}
      />
    </g>
  );
}

/** Text placeholder lines (stand-ins for real copy, deliberately unreadable). */
function Lines({ x, y, widths, gap = 7 }: { x: number; y: number; widths: number[]; gap?: number }) {
  return (
    <>
      {widths.map((width, index) => (
        <rect key={index} x={x} y={y + index * gap} width={width} height={2} className="v-fill-dim" />
      ))}
    </>
  );
}

/* --------------------------------------------------------------- AuditAI */

const DOCS = ['Invoice', 'GST record', 'Bank debit', 'Purchase order'];

function ReportRow({ x, y, flagged }: { x: number; y: number; flagged: boolean }) {
  return (
    <>
      {flagged ? (
        <rect x={x} y={y - 5} width={8} height={8} className="v-fill-amber" />
      ) : (
        <path d={`M${x} ${y} l3 3 l6 -7`} className="v-line v-line--strong" />
      )}
    </>
  );
}

function AuditIllustration({ layout }: { layout: IllustrationLayout }) {
  const glow = useId();
  const label =
    'Diagram: invoices, GST records, bank debits and purchase orders pass through OCR into a LangGraph pipeline. DocAgent feeds parallel Reconcile and Fraud agents, an AuditAgent aggregates findings, critical items go to human review, and a ReportAgent produces the PDF. A QueryAgent answers questions over the audit state.';

  const defs = (
    <defs>
      <linearGradient id={glow} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#f0a43c" stopOpacity="0" />
        <stop offset="1" stopColor="#f0a43c" stopOpacity="0.3" />
      </linearGradient>
    </defs>
  );

  if (layout === 'compact') {
    const cells = [
      { x: 16, y: 46 },
      { x: 188, y: 46 },
      { x: 16, y: 96 },
      { x: 188, y: 96 },
    ];
    return (
      <svg viewBox="0 0 360 480" role="img" aria-label={label}>
        {defs}
        <Label x={16} y={32}>
          Ingest · OCR
        </Label>
        {DOCS.map((doc, index) => {
          const cell = cells[index] ?? { x: 0, y: 0 };
          return (
            <g key={doc} className="v-pop" style={delay(index * 0.08)}>
              <rect x={cell.x} y={cell.y} width={156} height={42} rx={2} className="v-panel" />
              <Label x={cell.x + 10} y={cell.y + 17} strong small>
                {doc}
              </Label>
              <Lines x={cell.x + 10} y={cell.y + 25} widths={[96, 70]} />
            </g>
          );
        })}
        <g className="v-scan" style={{ '--scan-distance': '96px' } as CSSProperties}>
          <rect x={12} y={34} width={336} height={12} fill={`url(#${glow})`} />
          <rect x={12} y={45} width={336} height={1.5} className="v-fill-amber" />
        </g>

        <Swatch x={196} y={170} />
        <Label x={208} y={170} small>
          LangGraph · 6 agents
        </Label>
        <Link path="M180 142 V 178" d={0.3} />
        <Node x={120} y={178} w={120} h={30} label="DocAgent" d={0.35} />
        <Link path="M180 208 C 180 226, 94 222, 94 240" d={0.6} />
        <Link path="M180 208 C 180 226, 266 222, 266 240" d={0.7} />
        <Node x={24} y={240} w={140} h={30} label="Reconcile" d={0.8} />
        <Node x={196} y={240} w={140} h={30} label="Fraud" d={0.85} />
        <Link path="M94 270 C 94 288, 180 282, 180 300" d={1} />
        <Link path="M266 270 C 266 288, 180 282, 180 300" d={1.05} />
        <Node x={120} y={300} w={120} h={30} label="Audit" active d={1.15} />
        <Node x={262} y={300} w={82} h={30} label="Query" dashed d={1.2} />
        <path d="M262 315 H 240" className="v-line v-line--strong v-dash" />

        <Link path="M180 330 V 346" d={1.3} />
        <g className="v-pop" style={delay(1.35)}>
          <rect x={172} y={348} width={16} height={16} transform="rotate(45 180 356)" className="v-node v-node--active" />
          <Label x={200} y={360} strong small>
            Human review
          </Label>
        </g>
        <Link path="M180 366 V 384" d={1.45} />

        <g className="v-pop" style={delay(1.5)}>
          <rect x={60} y={384} width={240} height={80} rx={2} className="v-panel" />
          <Label x={74} y={404} strong small>
            Audit report
          </Label>
          <Label x={286} y={404} anchor="end" small>
            PDF
          </Label>
          {[0, 1, 2, 3].map((row) => {
            const x = row % 2 === 0 ? 74 : 184;
            const y = row < 2 ? 426 : 448;
            return (
              <g key={row}>
                <ReportRow x={x} y={y} flagged={row === 2} />
                <rect x={x + 16} y={y - 2} width={row === 2 ? 64 : 84} height={2} className={row === 2 ? 'v-fill-mid' : 'v-fill-dim'} />
              </g>
            );
          })}
        </g>
      </svg>
    );
  }

  const docY = (index: number) => 72 + index * 60;
  return (
    <svg viewBox="0 0 640 440" role="img" aria-label={label}>
      {defs}
      <Label x={20} y={50}>
        Ingest · OCR
      </Label>
      <Swatch x={168} y={50} />
      <Label x={180} y={50}>
        LangGraph · 6 agents
      </Label>

      {DOCS.map((doc, index) => {
        const y = docY(index);
        return (
          <g key={doc}>
            <g className="v-pop" style={delay(index * 0.08)}>
              <rect x={20} y={y} width={124} height={46} rx={2} className="v-panel" />
              <Label x={30} y={y + 18} strong small>
                {doc}
              </Label>
              <Lines x={30} y={y + 26} widths={[84, 60, 72]} gap={6} />
            </g>
            <Link path={`M144 ${y + 23} C 156 ${y + 23}, 156 190, 168 190`} d={0.3 + index * 0.08} />
          </g>
        );
      })}

      <g className="v-scan" style={{ '--scan-distance': '226px' } as CSSProperties}>
        <rect x={16} y={58} width={132} height={12} fill={`url(#${glow})`} />
        <rect x={16} y={69} width={132} height={1.5} className="v-fill-amber" />
      </g>

      <Node x={168} y={174} w={80} h={32} label="DocAgent" d={0.6} />
      <Node x={276} y={112} w={92} h={32} label="Reconcile" d={0.8} />
      <Node x={276} y={236} w={92} h={32} label="Fraud" d={0.85} />
      <Node x={396} y={174} w={68} h={32} label="Audit" active d={1.05} />
      <Node x={276} y={330} w={92} h={28} label="Query" dashed d={1.1} />

      <Link path="M248 190 C 262 190, 262 128, 276 128" d={0.7} />
      <Link path="M248 190 C 262 190, 262 252, 276 252" d={0.75} />
      <Link path="M368 128 C 382 128, 382 190, 396 190" d={0.95} />
      <Link path="M368 252 C 382 252, 382 190, 396 190" d={1} />
      <Link path="M464 190 H 476" d={1.15} />
      <Link path="M496 190 H 512" d={1.25} />
      <path d="M368 344 H 430 V 206" className="v-line v-line--strong v-dash" />

      <g className="v-pop" style={delay(1.2)}>
        <rect x={478} y={182} width={16} height={16} transform="rotate(45 486 190)" className="v-node v-node--active" />
        <Label x={486} y={228} anchor="middle" strong small>
          HITL
        </Label>
      </g>

      <g className="v-pop" style={delay(1.35)}>
        <rect x={512} y={100} width={108} height={184} rx={2} className="v-panel" />
        <Label x={522} y={122} strong small>
          Audit report
        </Label>
        <line x1={522} y1={132} x2={610} y2={132} className="v-line" />
        {[0, 1, 2, 3].map((row) => {
          const y = 150 + row * 24;
          return (
            <g key={row}>
              <ReportRow x={523} y={y} flagged={row === 2} />
              <rect x={538} y={y - 2} width={row === 2 ? 54 : 66} height={2} className={row === 2 ? 'v-fill-mid' : 'v-fill-dim'} />
            </g>
          );
        })}
        <line x1={522} y1={252} x2={610} y2={252} className="v-line" />
        <Label x={522} y={272} small>
          PDF · ready
        </Label>
      </g>

      <line x1={20} y1={398} x2={620} y2={398} className="v-line" />
      {[
        { x: 20, label: '01 Ingest' },
        { x: 168, label: '02 Analyse' },
        { x: 448, label: '03 Review' },
        { x: 540, label: '04 Report' },
      ].map(({ x, label: stage }) => (
        <g key={stage}>
          <line x1={x} y1={393} x2={x} y2={403} className="v-line v-line--strong" />
          <Label x={x} y={420} small>
            {stage}
          </Label>
        </g>
      ))}
    </svg>
  );
}

/* ------------------------------------------------------------- CyberGuard */

const TACTICS: Array<[string, string]> = [
  ['Initial', 'access'],
  ['Execution', ''],
  ['Persistence', ''],
  ['Privilege', 'escalation'],
  ['Defense', 'evasion'],
  ['Lateral', 'movement'],
];
/** [tactic, row] cells of the mapped attack chain; index 2 is the current stage. */
const CHAIN: Array<[number, number]> = [
  [0, 1],
  [1, 0],
  [3, 2],
  [5, 1],
];
const EVENTS: Array<[number, number]> = [
  [0.04, 3],
  [0.1, 4],
  [0.17, 3],
  [0.24, 3.5],
  [0.31, 5],
  [0.38, 3],
  [0.45, 4],
  [0.52, 3],
  [0.58, 3.5],
  [0.72, 3],
  [0.79, 4],
  [0.86, 3],
  [0.94, 3.5],
];
const FLAGGED = 0.65;
const RETRIEVAL = [0.92, 0.78, 0.61, 0.47, 0.33];
const CHIPS = ['ATT&CK mapped', 'Evidence shown', 'Case opened'];

function EventAxis({ x0, x1, y }: { x0: number; x1: number; y: number }) {
  const at = (t: number) => x0 + (x1 - x0) * t;
  const flagged = at(FLAGGED);
  return (
    <>
      <line x1={x0} y1={y} x2={x1} y2={y} className="v-line" />
      {EVENTS.map(([t, r]) => (
        <circle key={t} cx={at(t)} cy={y} r={r} className="v-fill-mid v-ring v-pop" style={delay(t * 0.6)} />
      ))}
      <circle cx={flagged} cy={y} r={6} className="v-fill-amber v-ring" />
      <circle cx={flagged} cy={y} r={6} className="v-pulse v-line v-line--amber" />
    </>
  );
}

function ThreatIllustration({ layout }: { layout: IllustrationLayout }) {
  const label =
    'Diagram: a stream of simulated log events with one flagged event, mapped across MITRE ATT&CK tactics as an attack chain, with ranked hybrid FAISS and BM25 retrieval results and an incident narrative showing a risk meter and evidence.';

  if (layout === 'compact') {
    const rowY = (row: number) => 92 + row * 22;
    const cellX = (column: number) => 166 + column * 45;
    const chainPoint = ([tactic, column]: [number, number]) => `${cellX(column) + 20} ${rowY(tactic) + 7}`;
    return (
      <svg viewBox="0 0 360 480" role="img" aria-label={label}>
        <Label x={16} y={26}>
          Log stream · simulated
        </Label>
        <Swatch x={282} y={26} />
        <Label x={344} y={26} anchor="end" small>
          Flagged
        </Label>
        <EventAxis x0={16} x1={344} y={52} />
        <path d={`M${16 + 328 * FLAGGED} 60 V 80`} className="v-line v-line--amber v-dash" />

        {TACTICS.map(([first, second], tactic) => (
          <g key={first}>
            <Label x={16} y={rowY(tactic) + 11} small>
              {second ? `${first} ${second}` : first}
            </Label>
            {[0, 1, 2, 3].map((column) => {
              const step = CHAIN.findIndex(([t, c]) => t === tactic && c === column);
              const fill = step === 2 ? 'v-fill-amber' : step >= 0 ? 'v-fill-mid' : 'v-fill-dim';
              return (
                <rect
                  key={column}
                  x={cellX(column)}
                  y={rowY(tactic)}
                  width={40}
                  height={14}
                  className={`${fill} v-pop`}
                  style={delay(0.2 + tactic * 0.05)}
                />
              );
            })}
          </g>
        ))}
        <path
          d={CHAIN.map((cell, index) => `${index === 0 ? 'M' : 'L'}${chainPoint(cell)}`).join(' ')}
          pathLength={1}
          className="v-line v-line--amber v-draw"
          style={delay(0.6)}
        />

        <g className="v-pop" style={delay(0.4)}>
          <rect x={16} y={236} width={328} height={112} rx={2} className="v-panel" />
          <Label x={28} y={256} strong small>
            Retrieval · FAISS + BM25 · RRF
          </Label>
        </g>
        {RETRIEVAL.slice(0, 4).map((score, rank) => {
          const y = 268 + rank * 19;
          return (
            <g key={rank}>
              <Label x={28} y={y + 8} small>
                {`0${rank + 1}`}
              </Label>
              <Bar x={56} y={y} width={276} value={score} accent={rank === 0} d={0.6 + rank * 0.1} />
            </g>
          );
        })}

        <g className="v-pop" style={delay(0.6)}>
          <rect x={16} y={360} width={328} height={110} rx={2} className="v-panel" />
          <Label x={28} y={380} strong small>
            Incident narrative
          </Label>
          <Lines x={28} y={390} widths={[240, 196]} />
          <Label x={28} y={418} small>
            Risk
          </Label>
        </g>
        <Bar x={66} y={411} width={266} value={0.72} accent d={0.9} />
        {CHIPS.map((chip, index) => {
          const widths = [98, 104, 86];
          const x = 28 + widths.slice(0, index).reduce((sum, width) => sum + width + 6, 0);
          return (
            <g key={chip} className="v-pop" style={delay(1 + index * 0.08)}>
              <rect x={x} y={432} width={widths[index] ?? 90} height={24} rx={2} className="v-node" />
              <Label x={x + (widths[index] ?? 90) / 2} y={448} anchor="middle" small>
                {chip}
              </Label>
            </g>
          );
        })}
      </svg>
    );
  }

  const cell = (column: number, row: number) => ({ x: 20 + column * 100, y: 126 + row * 22 });
  return (
    <svg viewBox="0 0 640 440" role="img" aria-label={label}>
      <Label x={20} y={40}>
        Log stream · simulated
      </Label>
      <Swatch x={512} y={40} />
      <Label x={620} y={40} anchor="end">
        Flagged event
      </Label>
      <EventAxis x0={20} x1={620} y={70} />
      <path d={`M${20 + 600 * FLAGGED} 78 V 112`} className="v-line v-line--amber v-dash" />

      {TACTICS.map(([first, second], column) => (
        <text key={first} x={20 + column * 100} y={second ? 98 : 110} className="v-label v-label--sm">
          <tspan x={20 + column * 100}>{first}</tspan>
          {second ? (
            <tspan x={20 + column * 100} dy={12}>
              {second}
            </tspan>
          ) : null}
        </text>
      ))}
      {TACTICS.map((_, column) =>
        [0, 1, 2, 3].map((row) => {
          const { x, y } = cell(column, row);
          const step = CHAIN.findIndex(([c, r]) => c === column && r === row);
          const fill = step === 2 ? 'v-fill-amber' : step >= 0 ? 'v-fill-mid' : 'v-fill-dim';
          return (
            <rect
              key={`${column}-${row}`}
              x={x}
              y={y}
              width={92}
              height={16}
              className={`${fill} v-pop`}
              style={delay(0.2 + column * 0.05)}
            />
          );
        }),
      )}
      <path
        d={CHAIN.map(([column, row], index) => {
          const { x, y } = cell(column, row);
          return `${index === 0 ? 'M' : 'L'}${x + 46} ${y + 8}`;
        }).join(' ')}
        pathLength={1}
        className="v-line v-line--amber v-draw"
        style={delay(0.6)}
      />

      <g className="v-pop" style={delay(0.4)}>
        <rect x={20} y={232} width={294} height={188} rx={2} className="v-panel" />
        <Label x={32} y={254} strong small>
          Retrieval · FAISS + BM25 · RRF
        </Label>
      </g>
      {RETRIEVAL.map((score, rank) => {
        const y = 270 + rank * 28;
        return (
          <g key={rank}>
            <Label x={32} y={y + 8} small>
              {`0${rank + 1}`}
            </Label>
            <Lines x={58} y={y + 1} widths={[70, 48]} gap={6} />
            <Bar x={142} y={y} width={160} value={score} accent={rank === 0} d={0.6 + rank * 0.1} />
          </g>
        );
      })}

      <g className="v-pop" style={delay(0.6)}>
        <rect x={326} y={232} width={294} height={188} rx={2} className="v-panel" />
        <Label x={338} y={254} strong small>
          Incident narrative
        </Label>
        <Lines x={338} y={270} widths={[210, 250, 180, 232, 150]} gap={11} />
        <Label x={338} y={337} small>
          Risk
        </Label>
      </g>
      <Bar x={376} y={330} width={232} value={0.72} accent d={0.9} />
      {CHIPS.map((chip, index) => {
        const positions = [
          { x: 338, y: 352, w: 128 },
          { x: 474, y: 352, w: 134 },
          { x: 338, y: 384, w: 128 },
        ];
        const p = positions[index] ?? { x: 0, y: 0, w: 0 };
        return (
          <g key={chip} className="v-pop" style={delay(1 + index * 0.08)}>
            <rect x={p.x} y={p.y} width={p.w} height={24} rx={2} className="v-node" />
            <Label x={p.x + p.w / 2} y={p.y + 16} anchor="middle" small>
              {chip}
            </Label>
          </g>
        );
      })}
    </svg>
  );
}

/* ------------------------------------------------------------- CloudGuard */

/** Real checks from the implementation, tagged by where they live (compliance rule vs. collector check). */
const FINDINGS: Array<{ check: string; source: 'Rule' | 'Check' }> = [
  { check: 'IAM · MFA required', source: 'Rule' },
  { check: 'IAM · Root account usage', source: 'Rule' },
  { check: 'IAM · Key rotation > 90 days', source: 'Check' },
  { check: 'IAM · Admin / wildcard policy', source: 'Check' },
  { check: 'S3 · Public access', source: 'Rule' },
];

function IamGraph({ user, role, policy }: { user: [number, number]; role: [number, number]; policy: [number, number] }) {
  return (
    <>
      <path d={`M${user[0]} ${user[1]} L${role[0]} ${role[1]}`} pathLength={1} className="v-line v-line--strong v-draw" />
      <path d={`M${user[0]} ${user[1]} L${policy[0]} ${policy[1]}`} pathLength={1} className="v-line v-line--strong v-draw" style={delay(0.15)} />
      <path d={`M${role[0]} ${role[1]} L${policy[0]} ${policy[1]}`} pathLength={1} className="v-line v-line--amber v-draw" style={delay(0.3)} />
      <circle cx={user[0]} cy={user[1]} r={9} className="v-node v-pop" />
      <circle cx={role[0]} cy={role[1]} r={9} className="v-node v-pop" style={delay(0.1)} />
      <rect
        x={policy[0] - 8}
        y={policy[1] - 8}
        width={16}
        height={16}
        transform={`rotate(45 ${policy[0]} ${policy[1]})`}
        className="v-node v-node--active v-pop"
        style={delay(0.2)}
      />
      <Label x={user[0]} y={user[1] + 24} anchor="middle" small>
        User
      </Label>
      <Label x={role[0]} y={role[1] + 24} anchor="middle" small>
        Role
      </Label>
      <Label x={policy[0] + 18} y={policy[1] + 4} strong small>
        Policy *
      </Label>
    </>
  );
}

function FindingRows({ x0, x1, y0, gap, withBars }: { x0: number; x1: number; y0: number; gap: number; withBars: boolean }) {
  return (
    <>
      {FINDINGS.map(({ check, source }, index) => {
        const y = y0 + index * gap;
        const scanning = index === 0;
        return (
          <g key={check} className={`v-pop${scanning ? ' v-blink' : ''}`} style={delay(0.8 + index * 0.08)}>
            <rect x={x0} y={y - 7} width={8} height={8} className={scanning ? 'v-fill-amber' : 'v-fill-mid'} />
            <Label x={x0 + 18} y={y + 1} strong small>
              {check}
            </Label>
            {withBars ? <rect x={x0 + 280} y={y - 3} width={150 - index * 14} height={2} className="v-fill-dim" /> : null}
            <Label x={x1} y={y + 1} anchor="end" small>
              {source}
            </Label>
          </g>
        );
      })}
    </>
  );
}

function CloudIllustration({ layout }: { layout: IllustrationLayout }) {
  const label =
    'Diagram: a read-only collector scans an AWS account and streams events through Redis to compliance and FinOps engines, which raise real-time alerts. A findings table lists IAM and S3 checks such as MFA, root-account usage, key rotation, wildcard policies and public S3 access.';

  if (layout === 'compact') {
    return (
      <svg viewBox="0 0 360 480" role="img" aria-label={label}>
        <g className="v-pop">
          <rect x={16} y={14} width={328} height={108} rx={2} className="v-panel" />
          <Label x={28} y={34} strong small>
            AWS account · read-only role
          </Label>
          <Label x={212} y={70} small>
            IAM · S3 · EC2
          </Label>
          <Label x={212} y={86} small>
            CloudWatch
          </Label>
        </g>
        <IamGraph user={[52, 62]} role={[124, 62]} policy={[88, 96]} />

        <Link path="M180 122 V 140" d={0.5} />
        <Node x={110} y={140} w={140} h={28} label="Collector" d={0.55} />
        {[166, 180, 194].map((x) => (
          <line key={x} x1={x} y1={172} x2={x} y2={200} className="v-line v-line--strong v-dashmove" />
        ))}
        <Label x={208} y={190} small>
          Redis stream
        </Label>
        <Link path="M180 200 C 180 210, 94 204, 94 214" d={0.7} />
        <Link path="M180 200 C 180 210, 266 204, 266 214" d={0.75} />
        <Node x={24} y={214} w={140} h={28} label="Compliance" active d={0.8} />
        <Node x={196} y={214} w={140} h={28} label="FinOps" d={0.85} />
        <Link path="M94 242 C 94 252, 180 246, 180 258" d={0.95} />
        <Link path="M266 242 C 266 252, 180 246, 180 258" d={1} />
        <Node x={110} y={258} w={140} h={28} label="Alerts · SSE" d={1.05} />

        <g className="v-pop" style={delay(0.7)}>
          <rect x={16} y={304} width={328} height={166} rx={2} className="v-panel" />
          <Label x={28} y={324} strong small>
            Findings
          </Label>
          <Label x={332} y={324} anchor="end" small>
            Simulated · live · hybrid
          </Label>
          <line x1={28} y1={334} x2={332} y2={334} className="v-line" />
        </g>
        <FindingRows x0={28} x1={332} y0={356} gap={24} withBars={false} />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 640 440" role="img" aria-label={label}>
      <g className="v-pop">
        <rect x={20} y={36} width={176} height={192} rx={2} className="v-panel" />
        <Label x={32} y={56} strong small>
          AWS account
        </Label>
        <Label x={32} y={70} small>
          Read-only role
        </Label>
        <Label x={32} y={198} small>
          IAM · S3 · EC2
        </Label>
        <Label x={32} y={214} small>
          CloudWatch
        </Label>
      </g>
      <IamGraph user={[62, 108]} role={[142, 108]} policy={[102, 156]} />

      <Node x={214} y={116} w={84} h={32} label="Collector" d={0.5} />
      <Link path="M196 132 H 214" d={0.45} />
      <Label x={338} y={106} anchor="middle" small>
        Redis stream
      </Label>
      {[120, 132, 144].map((y) => (
        <line key={y} x1={306} y1={y} x2={372} y2={y} className="v-line v-line--strong v-dashmove" />
      ))}
      <Node x={394} y={70} w={104} h={30} label="Compliance" active d={0.75} />
      <Node x={394} y={164} w={104} h={30} label="FinOps" d={0.8} />
      <Link path="M372 132 C 384 132, 382 85, 394 85" d={0.65} />
      <Link path="M372 132 C 384 132, 382 179, 394 179" d={0.7} />
      <Node x={516} y={116} w={104} h={32} label="Alerts · SSE" d={1} />
      <Link path="M498 85 C 507 85, 507 132, 516 132" d={0.9} />
      <Link path="M498 179 C 507 179, 507 132, 516 132" d={0.95} />

      <g className="v-pop" style={delay(0.6)}>
        <rect x={20} y={246} width={600} height={174} rx={2} className="v-panel" />
        <Label x={32} y={268} strong small>
          Findings
        </Label>
        <Label x={608} y={268} anchor="end" small>
          Mode: simulated · live · hybrid
        </Label>
        <line x1={32} y1={278} x2={608} y2={278} className="v-line" />
      </g>
      <FindingRows x0={32} x1={608} y0={300} gap={25} withBars />
    </svg>
  );
}

/* ----------------------------------------------------------- SafeDrive AI */

const CHECKPOINTS = ['Assessment', 'Calibration', 'AI scenario', 'Lesson', 'Progress'] as const;
const STATES = ['done', 'done', 'current', 'next', 'next'] as const;

function Waveform({ x, y, count, step, height }: { x: number; y: number; count: number; step: number; height: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, index) => {
        const h = height * (0.3 + ((index * 37) % 26) / 37);
        return (
          <rect
            key={index}
            x={x + index * step}
            y={y - h}
            width={Math.max(3, step * 0.5)}
            height={h}
            rx={1}
            className={index % 6 === 2 ? 'v-fill-amber v-bar' : 'v-fill-mid v-bar'}
            style={{ animationDelay: `${(index % 7) * -0.2}s` }}
          />
        );
      })}
    </>
  );
}

function Road({
  top,
  bottom,
  centerX,
  horizonY,
  gradient,
}: {
  top: [number, number];
  bottom: [number, number];
  centerX: number;
  horizonY: number;
  gradient: string;
}) {
  const yBottom = 480;
  return (
    <>
      <polygon
        points={`${bottom[0]},${yBottom} ${top[0]},${horizonY} ${top[1]},${horizonY} ${bottom[1]},${yBottom}`}
        fill={`url(#${gradient})`}
      />
      <line x1={bottom[0]} y1={yBottom} x2={top[0]} y2={horizonY} className="v-line v-line--strong v-draw" pathLength={1} />
      <line x1={bottom[1]} y1={yBottom} x2={top[1]} y2={horizonY} className="v-line v-line--strong v-draw" pathLength={1} />
      <line x1={centerX} y1={horizonY + 4} x2={centerX} y2={yBottom} className="v-line v-line--strong v-dashmove" />
    </>
  );
}

function Checkpoint({
  cx,
  cy,
  r,
  labelX,
  index,
}: {
  cx: number;
  cy: number;
  r: number;
  labelX: number;
  index: number;
}) {
  const state = STATES[index] ?? 'next';
  const fill = state === 'done' ? 'v-fill-strong' : state === 'current' ? 'v-fill-amber' : 'v-node';
  return (
    <g className="v-pop" style={delay(0.3 + (4 - index) * 0.1)}>
      <line x1={cx + r + 4} y1={cy} x2={labelX - 10} y2={cy} className="v-line" />
      <circle cx={cx} cy={cy} r={r} className={state === 'next' ? fill : `${fill} v-ring`} />
      {state === 'current' ? <circle cx={cx} cy={cy} r={r} className="v-pulse v-line v-line--amber" /> : null}
      <Label x={labelX} y={cy + 4} strong={state !== 'next'} small>
        {`0${index + 1} ${CHECKPOINTS[index] ?? ''}`}
      </Label>
    </g>
  );
}

function LearningIllustration({ layout }: { layout: IllustrationLayout }) {
  const road = useId();
  const label =
    'Diagram: a road leading to the horizon with learning checkpoints (assessment, calibration, AI scenario, lesson and progress) beside a voice tutor waveform.';
  const defs = (
    <defs>
      <linearGradient id={road} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#c8ccd2" stopOpacity="0.02" />
        <stop offset="1" stopColor="#c8ccd2" stopOpacity="0.12" />
      </linearGradient>
    </defs>
  );

  if (layout === 'compact') {
    const ys = [356, 290, 236, 192, 156];
    const rs = [11, 9, 7.5, 6, 5];
    return (
      <svg viewBox="0 0 360 480" role="img" aria-label={label}>
        {defs}
        <Label x={16} y={28}>
          Personalised path
        </Label>
        <line x1={16} y1={110} x2={344} y2={110} className="v-line" />
        <Road top={[100, 120]} bottom={[16, 204]} centerX={110} horizonY={110} gradient={road} />
        {ys.map((cy, index) => (
          <Checkpoint key={cy} cx={110} cy={cy} r={rs[index] ?? 5} labelX={214} index={index} />
        ))}
        <g className="v-pop" style={delay(0.2)}>
          <rect x={206} y={384} width={138} height={84} rx={2} className="v-panel" />
          <Label x={216} y={402} strong small>
            Voice tutor
          </Label>
          <Label x={216} y={416} small>
            ElevenLabs
          </Label>
        </g>
        <Waveform x={216} y={456} count={14} step={8.6} height={30} />
      </svg>
    );
  }

  const ys = [392, 316, 252, 198, 150];
  const rs = [11, 9, 7.5, 6, 5];
  return (
    <svg viewBox="0 0 640 440" role="img" aria-label={label}>
      {defs}
      <Label x={20} y={44}>
        Personalised path
      </Label>
      <Swatch x={452} y={44} />
      <Label x={620} y={44} anchor="end">
        Awareness · learning
      </Label>
      <line x1={20} y1={100} x2={620} y2={100} className="v-line" />
      <Road top={[322, 358]} bottom={[180, 500]} centerX={340} horizonY={100} gradient={road} />
      {ys.map((cy, index) => (
        <Checkpoint key={cy} cx={340} cy={cy} r={rs[index] ?? 5} labelX={500} index={index} />
      ))}
      <g className="v-pop" style={delay(0.2)}>
        <rect x={20} y={312} width={168} height={108} rx={2} className="v-panel" />
        <Label x={32} y={332} strong small>
          Voice tutor
        </Label>
        <Label x={32} y={348} small>
          ElevenLabs
        </Label>
      </g>
      <Waveform x={32} y={406} count={18} step={8.4} height={44} />
    </svg>
  );
}

const ILLUSTRATIONS: Record<VisualKind, (props: { layout: IllustrationLayout }) => ReactNode> = {
  audit: AuditIllustration,
  threat: ThreatIllustration,
  cloud: CloudIllustration,
  learning: LearningIllustration,
};

export default function ProjectIllustration({ kind, layout }: { kind: VisualKind; layout: IllustrationLayout }) {
  const Illustration = ILLUSTRATIONS[kind];
  return <Illustration layout={layout} />;
}
