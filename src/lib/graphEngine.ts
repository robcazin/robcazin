/**
 * Framework-agnostic morphing graph with Ricci-flow-inspired curvature.
 * Ported from graph-engine.js (Claude local session). No DOM, no audio, no three.js.
 *
 * Each preset carries its own node positions as well as its adjacency matrix,
 * so update() interpolates *both* — the layout itself reshapes during a morph,
 * not just which edges are lit. The five original presets share a plain circle
 * layout (indices 0-9) padded with parked Flower-of-Life coordinates for the
 * unused tail (indices 10-18), so they glide cleanly into the Flower preset
 * without any sudden jumps.
 */

export const GRAPH_N = 19;

export type GraphMatrix = number[][];

export interface GraphPreset {
  name: string;
  matrix: GraphMatrix;
  positions: GraphVec3[];
}

export interface GraphVec3 {
  x: number;
  y: number;
  z: number;
}

export interface GraphBeat {
  node: number;
  prev: number;
  curvature: number;
  degree: number;
  isCluster: boolean;
  neighbors: number[];
  position: GraphVec3;
  droneNode: number;
}

function makeMatrix(edges: Array<[number, number]>, n = GRAPH_N): GraphMatrix {
  const m = Array.from({ length: n }, () => new Array<number>(n).fill(0));
  edges.forEach(([a, b]) => {
    m[a][b] = 1;
    m[b][a] = 1;
  });
  return m;
}

export function circleLayout(radius = 1, n = GRAPH_N): GraphVec3[] {
  const pts: GraphVec3[] = [];
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (i * (2 * Math.PI)) / n;
    pts.push({ x: radius * Math.cos(a), y: radius * Math.sin(a), z: 0 });
  }
  return pts;
}

/**
 * The classic 19-circle Flower of Life: 1 center + 6 (ring 1) + 6 (ring 2,
 * straight continuation) + 6 (ring 2, between). Lattice unit `u` is the
 * circle radius; adjacent circle centers sit exactly `u` apart. Normalized
 * so the outermost points land at radius 1, matching the legacy circle scale.
 */
export function flowerOfLifePositions(): GraphVec3[] {
  const u = 0.5;
  const pts: GraphVec3[] = [{ x: 0, y: 0, z: 0 }];
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    pts.push({ x: u * Math.cos(a), y: u * Math.sin(a), z: 0 });
  }
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    pts.push({ x: 2 * u * Math.cos(a), y: 2 * u * Math.sin(a), z: 0 });
  }
  for (let i = 0; i < 6; i++) {
    const a = Math.PI / 6 + (i * Math.PI) / 3;
    pts.push({
      x: u * Math.sqrt(3) * Math.cos(a),
      y: u * Math.sqrt(3) * Math.sin(a),
      z: 0,
    });
  }
  return pts; // length 19
}

/** Connect every pair of points whose centers sit ~`unit` apart — the
 *  nearest-neighbor graph of a triangular/hex circle packing. */
function latticeEdges(
  pts: GraphVec3[],
  unit: number,
  tol = 0.06
): Array<[number, number]> {
  const edges: Array<[number, number]> = [];
  for (let i = 0; i < pts.length; i++) {
    for (let j = i + 1; j < pts.length; j++) {
      const dx = pts[i].x - pts[j].x;
      const dy = pts[i].y - pts[j].y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (Math.abs(d - unit) < tol) edges.push([i, j]);
    }
  }
  return edges;
}

const FLOWER_POSITIONS = flowerOfLifePositions();
const FLOWER_EDGES = latticeEdges(FLOWER_POSITIONS, 0.5);

/** Legacy layout used by the five original presets: their own 10-node circle
 *  (indices 0-9) plus the Flower's own tail coordinates (indices 10-18) so
 *  those nodes are already "parked" in place, invisible (degree 0), ready to
 *  fade straight in when morphing into the Flower preset. */
const LEGACY_POSITIONS: GraphVec3[] = [
  ...circleLayout(1, 10),
  ...FLOWER_POSITIONS.slice(10, 19),
];

export const GRAPH_PRESETS: GraphPreset[] = [
  {
    name: "Cycle (10-loop)",
    matrix: makeMatrix([[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,9],[9,0]]),
    positions: LEGACY_POSITIONS,
  },
  {
    name: "Star hub",
    matrix: makeMatrix([[0,1],[0,2],[0,3],[0,4],[0,5],[0,6],[0,7],[0,8],[0,9]]),
    positions: LEGACY_POSITIONS,
  },
  {
    name: "Petersen graph",
    matrix: makeMatrix([[0,1],[1,2],[2,3],[3,4],[4,0],[5,7],[7,9],[9,6],[6,8],[8,5],[0,5],[1,6],[2,7],[3,8],[4,9]]),
    positions: LEGACY_POSITIONS,
  },
  {
    name: "Two cliques + bridge",
    matrix: makeMatrix([[0,1],[0,2],[0,3],[1,2],[1,3],[2,3],[5,6],[5,7],[5,8],[6,7],[6,8],[7,8],[3,5]]),
    positions: LEGACY_POSITIONS,
  },
  {
    name: "Diamond graph",
    matrix: makeMatrix([[0,1],[1,2],[2,3],[3,0],[0,2]]),
    positions: LEGACY_POSITIONS,
  },
  {
    name: "Flower of Life",
    matrix: makeMatrix(FLOWER_EDGES, GRAPH_N),
    positions: FLOWER_POSITIONS,
  },
];

function zeros(n: number): GraphMatrix {
  return Array.from({ length: n }, () => new Array<number>(n).fill(0));
}

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

/** Simplified Forman-Ricci curvature: 4 - deg(i) - deg(j) + 3 * shared neighbors. */
function formanCurvature(mat: GraphMatrix, i: number, j: number, n: number): number {
  const wij = mat[i][j];
  if (wij < 0.05) return 0;
  let common = 0;
  for (let k = 0; k < n; k++) {
    if (k !== i && k !== j) common += mat[i][k] * mat[j][k];
  }
  let di = 0;
  let dj = 0;
  for (let k = 0; k < n; k++) {
    di += mat[i][k];
    dj += mat[j][k];
  }
  return 4 - di - dj + 3 * common;
}

export class GraphEngine {
  n: number;
  presets: GraphPreset[];
  morphDuration: number;
  flowAmount: number;
  positions: GraphVec3[];
  currentIdx: number;
  nextIdx: number;
  morphElapsed: number;
  morphT: number;
  W: GraphMatrix;
  Wflow: GraphMatrix;
  Fmat: GraphMatrix;
  meanCurvature: number;
  walkerNode: number;
  droneNode: number;
  private beatCount: number;

  constructor(
    opts: {
      presetList?: GraphPreset[];
      morphDuration?: number;
      flowAmount?: number;
    } = {}
  ) {
    this.n = GRAPH_N;
    this.presets = opts.presetList ?? GRAPH_PRESETS;
    this.morphDuration = opts.morphDuration ?? 10;
    this.flowAmount = opts.flowAmount ?? 0.55;
    this.currentIdx = 0;
    this.nextIdx = 1;
    this.morphElapsed = 0;
    this.morphT = 0;
    this.W = this.presets[0].matrix.map((r) => r.slice());
    this.Wflow = zeros(this.n);
    this.Fmat = zeros(this.n);
    this.positions = this.presets[0].positions.map((p) => ({ ...p }));
    this.meanCurvature = 0;
    this.walkerNode = 0;
    this.droneNode = -1;
    this.beatCount = 0;
  }

  update(dt: number): void {
    this.morphElapsed += dt;
    if (this.morphElapsed >= this.morphDuration) {
      this.currentIdx = this.nextIdx;
      this.nextIdx = (this.nextIdx + 1) % this.presets.length;
      this.morphElapsed = 0;
    }
    this.morphT = Math.max(0, Math.min(1, this.morphElapsed / this.morphDuration));

    const presetA = this.presets[this.currentIdx];
    const presetB = this.presets[this.nextIdx];
    const A = presetA.matrix, B = presetB.matrix;
    const posA = presetA.positions, posB = presetB.positions;
    const n = this.n;

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) continue;
        const base = A[i][j] + (B[i][j] - A[i][j]) * this.morphT;
        this.W[i][j] = clamp01(base + this.Wflow[i][j]);
      }
      const pa = posA[i], pb = posB[i];
      this.positions[i] = {
        x: pa.x + (pb.x - pa.x) * this.morphT,
        y: pa.y + (pb.y - pa.y) * this.morphT,
        z: pa.z + (pb.z - pa.z) * this.morphT,
      };
    }

    let sum = 0;
    let count = 0;
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const f = formanCurvature(this.W, i, j, n);
        this.Fmat[i][j] = f;
        this.Fmat[j][i] = f;
        if (this.W[i][j] > 0.05) {
          sum += f * this.W[i][j];
          count += this.W[i][j];
        }
      }
    }
    this.meanCurvature = count > 0 ? sum / count : 0;

    const k = 0.05 * this.flowAmount;
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        if (this.Fmat[i][j] === 0 && this.W[i][j] < 0.05) continue;
        let delta = this.Wflow[i][j] - k * this.Fmat[i][j] * dt;
        delta *= 1 - 0.25 * dt;
        delta = Math.max(-0.4, Math.min(0.4, delta));
        this.Wflow[i][j] = delta;
        this.Wflow[j][i] = delta;
      }
    }
  }

  step(): GraphBeat {
    const c = this.walkerNode;
    const nbrs: number[] = [];
    for (let j = 0; j < this.n; j++) {
      if (j !== c && this.W[c][j] > 0.5) nbrs.push(j);
    }
    const next = nbrs.length
      ? nbrs[Math.floor(Math.random() * nbrs.length)]
      : Math.floor(Math.random() * this.n);
    const curvature = this.Fmat[c][next] || 0;
    this.walkerNode = next;

    const neighbors: number[] = [];
    for (let j = 0; j < this.n; j++) {
      if (j !== next && this.W[next][j] > 0.5) neighbors.push(j);
    }
    let isCluster = false;
    if (neighbors.length >= 2) {
      let connected = 0;
      let total = 0;
      for (let a = 0; a < neighbors.length; a++) {
        for (let b = a + 1; b < neighbors.length; b++) {
          total++;
          if (this.W[neighbors[a]][neighbors[b]] > 0.5) connected++;
        }
      }
      isCluster = total > 0 && connected / total >= 0.5;
    }

    this.beatCount++;
    if (this.beatCount % 4 === 0) {
      let best = 0;
      let bestVal = -1;
      for (let i = 0; i < this.n; i++) {
        const d = this.degree(i);
        if (d > bestVal) {
          bestVal = d;
          best = i;
        }
      }
      this.droneNode = best;
    }

    return {
      node: next,
      prev: c,
      curvature,
      degree: this.degree(next),
      isCluster,
      neighbors,
      position: this.positions[next],
      droneNode: this.droneNode,
    };
  }

  degree(i: number): number {
    let s = 0;
    for (let j = 0; j < this.n; j++) s += this.W[i][j];
    return s;
  }

  getFlatMatrix(): Float32Array {
    const out = new Float32Array(this.n * this.n);
    for (let i = 0; i < this.n; i++) {
      for (let j = 0; j < this.n; j++) out[i * this.n + j] = this.W[i][j];
    }
    return out;
  }

  getFlatCurvature(): Float32Array {
    const out = new Float32Array(this.n * this.n);
    for (let i = 0; i < this.n; i++) {
      for (let j = 0; j < this.n; j++) out[i * this.n + j] = this.Fmat[i][j];
    }
    return out;
  }

  get currentName(): string {
    return this.presets[this.currentIdx].name;
  }

  get nextName(): string {
    return this.presets[this.nextIdx].name;
  }
}
