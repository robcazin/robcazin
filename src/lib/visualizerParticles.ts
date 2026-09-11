import {
  PARTICLE_CONFIG,
  parseParticleComposite,
  type ParticleConfig,
  type ParticleCompositeMode,
} from "@/lib/visualizerPresets";

export type ParticleKind = "burst" | "spark" | "drift";

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  kind: ParticleKind;
}

export interface RadialGeometry {
  cx: number;
  cy: number;
  innerRadius: number;
  maxRadius: number;
}

export interface ParticleDrawPalette {
  /** Caller resolves hue — id4 passes white spoke layer RGB here */
  accentRgb: [number, number, number];
  burstRgb: [number, number, number];
  accentComposite: ParticleCompositeMode;
  burstComposite: ParticleCompositeMode;
}

/** Average normalized magnitude (0..1) for log bands below bassMaxHz */
export function avgBandsBelow(
  bands: Float32Array,
  bassMaxHz: number,
  freqMin: number,
  freqMax: number
): number {
  const bandCount = bands.length;
  let sum = 0;
  let count = 0;
  for (let j = 0; j < bandCount; j++) {
    const fLow = freqMin * Math.pow(freqMax / freqMin, j / bandCount);
    if (fLow >= bassMaxHz) break;
    sum += bands[j] / 255;
    count++;
  }
  return count > 0 ? sum / count : 0;
}

function drawParticle(
  ctx: CanvasRenderingContext2D,
  p: Particle,
  rgb: [number, number, number],
  cfg: ParticleConfig
): void {
  const [r, g, b] = rgb;
  const a = Math.max(0, p.life / p.maxLife);

  if (cfg.streak) {
    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
    ctx.lineWidth = cfg.particleWidth;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x - p.vx * 0.03, p.y - p.vy * 0.03);
    ctx.stroke();
  } else {
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
    ctx.fillRect(p.x - 1, p.y - 1, 2, 2);
  }
}

export class ParticlePool {
  readonly particles: Particle[];
  prevBands: Float32Array;
  prevBassEnergy = 0;
  private ambientAccumulator = 0;

  constructor(
    readonly maxParticles: number,
    bandCount: number
  ) {
    this.particles = Array.from({ length: maxParticles }, () => ({
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      life: 0,
      maxLife: 0,
      kind: "drift" as ParticleKind,
    }));
    this.prevBands = new Float32Array(bandCount);
  }

  resizeBands(bandCount: number): void {
    if (this.prevBands.length === bandCount) return;
    this.prevBands = new Float32Array(bandCount);
    this.prevBassEnergy = 0;
    this.ambientAccumulator = 0;
  }

  reset(): void {
    for (const p of this.particles) p.life = 0;
    this.prevBands.fill(0);
    this.prevBassEnergy = 0;
    this.ambientAccumulator = 0;
  }

  private trySpawn(
    x: number,
    y: number,
    vx: number,
    vy: number,
    life: number,
    kind: ParticleKind
  ): boolean {
    for (const p of this.particles) {
      if (p.life > 0) continue;
      p.x = x;
      p.y = y;
      p.vx = vx;
      p.vy = vy;
      p.life = life;
      p.maxLife = life;
      p.kind = kind;
      return true;
    }
    return false;
  }

  /** Gentle continuous outward drift from the core (energy-driven, not timer-only) */
  spawnAmbientDrift(
    geom: RadialGeometry,
    bassEnergy: number,
    dt: number,
    cfg: ParticleConfig
  ): void {
    if (bassEnergy < cfg.ambientDriftFloor || dt <= 0) return;
    const rate = cfg.ambientDriftRate * bassEnergy * dt;
    this.ambientAccumulator += rate;
    while (this.ambientAccumulator >= 1) {
      this.ambientAccumulator -= 1;
      const a = Math.random() * Math.PI * 2;
      const sp = cfg.ambientDriftSpeed * (0.4 + bassEnergy * 0.6);
      this.trySpawn(
        geom.cx + Math.cos(a) * geom.innerRadius * 0.85,
        geom.cy + Math.sin(a) * geom.innerRadius * 0.85,
        Math.cos(a) * sp,
        Math.sin(a) * sp,
        cfg.life * 0.85,
        "drift"
      );
    }
  }

  spawnBassBurst(
    geom: RadialGeometry,
    bassEnergy: number,
    prevBassEnergy: number,
    cfg: ParticleConfig
  ): void {
    if (bassEnergy <= cfg.burstThreshold || bassEnergy <= prevBassEnergy) {
      return;
    }
    const strength =
      (bassEnergy - cfg.burstThreshold) / (1 - cfg.burstThreshold);
    const { cx, cy, innerRadius } = geom;
    for (let k = 0; k < cfg.burstCount; k++) {
      const a = Math.random() * Math.PI * 2;
      const sp = cfg.burstSpeed * (0.6 + strength);
      this.trySpawn(
        cx + Math.cos(a) * innerRadius,
        cy + Math.sin(a) * innerRadius,
        Math.cos(a) * sp,
        Math.sin(a) * sp,
        cfg.life,
        "burst"
      );
    }
  }

  spawnTipSparks(
    bands: Float32Array,
    geom: RadialGeometry,
    rotation: number,
    cfg: ParticleConfig
  ): void {
    const { cx, cy, innerRadius, maxRadius } = geom;
    const count = bands.length;
    let sparks = 0;

    for (let i = 0; i < count; i++) {
      const mag = bands[i] / 255;
      const jump = mag - this.prevBands[i];
      if (
        sparks < cfg.maxSparksPerFrame &&
        jump > cfg.sparkThreshold &&
        mag > cfg.sparkFloor
      ) {
        const ang = bandAngle(i, count) + rotation;
        const r1 = innerRadius + mag * (maxRadius - innerRadius);
        const tx = cx + Math.cos(ang) * r1;
        const ty = cy + Math.sin(ang) * r1;
        const j = (Math.random() - 0.5) * cfg.jitter;
        const sp = cfg.sparkSpeed * (0.5 + jump);
        if (
          this.trySpawn(
            tx,
            ty,
            Math.cos(ang + j) * sp,
            Math.sin(ang + j) * sp,
            cfg.life,
            "spark"
          )
        ) {
          sparks++;
        }
      }
      this.prevBands[i] = mag;
    }
  }

  updateAndDraw(
    ctx: CanvasRenderingContext2D,
    dt: number,
    w: number,
    h: number,
    geom: RadialGeometry,
    palette: ParticleDrawPalette,
    cfg: ParticleConfig
  ): void {
    const margin = 24;
    const dragFactor = Math.pow(cfg.drag, dt * 60);

    for (const p of this.particles) {
      if (p.life <= 0) continue;

      p.x += p.vx * dt;
      p.y += p.vy * dt;

      if (cfg.outwardAccel > 0) {
        const dx = p.x - geom.cx;
        const dy = p.y - geom.cy;
        const dist = Math.hypot(dx, dy) || 1;
        p.vx += (dx / dist) * cfg.outwardAccel * dt;
        p.vy += (dy / dist) * cfg.outwardAccel * dt;
      }

      p.vx *= dragFactor;
      p.vy *= dragFactor;
      p.life -= dt;

      if (
        p.life <= 0 ||
        p.x < -margin ||
        p.x > w + margin ||
        p.y < -margin ||
        p.y > h + margin
      ) {
        p.life = 0;
      }
    }

    const sameComposite =
      palette.accentComposite === palette.burstComposite;

    const drawPass = (
      composite: ParticleCompositeMode,
      filter: (kind: ParticleKind) => boolean,
      rgb: [number, number, number]
    ) => {
      ctx.globalCompositeOperation =
        composite as GlobalCompositeOperation;
      for (const p of this.particles) {
        if (p.life <= 0 || !filter(p.kind)) continue;
        drawParticle(ctx, p, rgb, cfg);
      }
    };

    if (sameComposite) {
      ctx.globalCompositeOperation =
        palette.accentComposite as GlobalCompositeOperation;
      for (const p of this.particles) {
        if (p.life <= 0) continue;
        const rgb = p.kind === "burst" ? palette.burstRgb : palette.accentRgb;
        drawParticle(ctx, p, rgb, cfg);
      }
    } else {
      drawPass(
        palette.accentComposite,
        (kind) => kind !== "burst",
        palette.accentRgb
      );
      drawPass(palette.burstComposite, (kind) => kind === "burst", palette.burstRgb);
    }
  }
}

function bandAngle(i: number, total: number): number {
  return (i / total) * Math.PI * 2 - Math.PI / 2;
}

/** Merge track-level particle overrides from meta.particleViz */
export function resolveParticleConfig(
  trackMeta?: Record<string, unknown>
): ParticleConfig {
  const raw = trackMeta?.particleViz;
  const merged =
    !raw || typeof raw !== "object"
      ? PARTICLE_CONFIG
      : { ...PARTICLE_CONFIG, ...(raw as Partial<ParticleConfig>) };
  const overrides =
    raw && typeof raw === "object" ? (raw as Partial<ParticleConfig>) : {};

  return {
    ...merged,
    accentParticleComposite: parseParticleComposite(
      overrides.accentParticleComposite,
      PARTICLE_CONFIG.accentParticleComposite
    ),
    burstComposite: parseParticleComposite(
      overrides.burstComposite,
      PARTICLE_CONFIG.burstComposite
    ),
  };
}

/** Particle + additive glow layer active (variant, size, motion, master switch) */
export function isParticleLayerActive(
  mode: string,
  reduced: boolean,
  canvasHeightPx: number,
  cfg: ParticleConfig
): boolean {
  return (
    mode === "radial-particles" &&
    !reduced &&
    cfg.enabled &&
    canvasHeightPx >= cfg.minHeightPx
  );
}
