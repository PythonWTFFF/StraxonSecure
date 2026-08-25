import { useEffect, useRef } from "react";
import * as THREE from "three";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
export interface AttackEvent {
  id: string;
  lat: number;
  lng: number;
  intensity: number;
  ip?: string;
  country?: string;
  type?: string;
  severity?: "low" | "medium" | "high" | "critical";
}

export interface GlobeProps {
  attacks?: AttackEvent[];
  selectedEvent?: AttackEvent | null;
  paused?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
const RADIUS = 1.6;

const MAJOR_HUBS = [
  { lat: 38.9, lng: -77.0 },
  { lat: 37.3, lng: -121.9 },
  { lat: 51.5, lng: -0.1 },
  { lat: 50.1, lng: 8.6 },
  { lat: 1.3, lng: 103.8 },
  { lat: 35.6, lng: 139.6 },
  { lat: -23.5, lng: -46.6 },
  { lat: 25.2, lng: 55.3 },
  { lat: -26.2, lng: 28.0 },
];

const SEVERITY_HEX: Record<string, number> = {
  critical: 0xff0033,
  high: 0xff6b35,
  medium: 0xff9900,
  low: 0x00d4ff,
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function ll2v3(lat: number, lng: number, r: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta),
  );
}

function disposeMesh(obj: THREE.Object3D) {
  if (obj instanceof THREE.Mesh || obj instanceof THREE.Line || obj instanceof THREE.Points) {
    obj.geometry?.dispose();
    if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
    else (obj.material as THREE.Material)?.dispose();
  }
}

function arcColor(a: AttackEvent): number {
  if (a.severity) return SEVERITY_HEX[a.severity] ?? 0x00d4ff;
  return a.intensity > 0.8 ? 0xff0033 : a.intensity > 0.5 ? 0xff9900 : 0x00d4ff;
}

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL STATE TYPE
// ─────────────────────────────────────────────────────────────────────────────
interface ArcEntry {
  id: string;
  line: THREE.Line;
  packet: THREE.Mesh;
  trail: THREE.Points;
  curve: THREE.QuadraticBezierCurve3;
  created: number;
  lifespan: number;
  baseColor: number;
  trailPos: Float32Array;
}

interface RippleEntry {
  mesh: THREE.Mesh;
  created: number;
  lifespan: number;
}

interface SceneState {
  arcs: ArcEntry[];
  ripples: RippleEntry[];
  pulseRings: RippleEntry[];
  hubRings: { mesh: THREE.Mesh; phase: number }[];
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  globeGroup: THREE.Group;
  shieldMesh: THREE.Mesh;
  radarRing: THREE.Mesh;
  radarSweep: THREE.Mesh;
  targetMarker: THREE.Mesh;
  hudAnchor: THREE.Object3D;
  mouseX: number;
  mouseY: number;
  isPaused: boolean;
  raf: number;
  tick: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// GLOBE COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export function AttackGlobe({ attacks = [], selectedEvent = null, paused = false }: GlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const hudRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<SceneState | null>(null);

  // ── INIT ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const W = container.clientWidth || 600;
    const H = container.clientHeight || 400;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, W / H, 0.1, 1000);
    camera.position.set(0, 0, 5.5);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // Globe group
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    // Dark core sphere
    globeGroup.add(
      new THREE.Mesh(
        new THREE.SphereGeometry(RADIUS * 0.986, 64, 64),
        new THREE.MeshBasicMaterial({ color: 0x020617, transparent: true, opacity: 0.97 }),
      ),
    );

    // Primary wire grid
    globeGroup.add(
      new THREE.Mesh(
        new THREE.SphereGeometry(RADIUS, 52, 52),
        new THREE.MeshBasicMaterial({
          color: 0x00d4ff,
          wireframe: true,
          transparent: true,
          opacity: 0.11,
          blending: THREE.AdditiveBlending,
        }),
      ),
    );

    // Fine equatorial overlay (counter-rotates)
    const equatorialMesh = new THREE.Mesh(
      new THREE.SphereGeometry(RADIUS * 1.001, 24, 12),
      new THREE.MeshBasicMaterial({
        color: 0x0055ff,
        wireframe: true,
        transparent: true,
        opacity: 0.055,
        blending: THREE.AdditiveBlending,
      }),
    );
    globeGroup.add(equatorialMesh);

    // Icosahedron shield (scene-level so it stays fixed while globe rotates)
    const shieldMesh = new THREE.Mesh(
      new THREE.IcosahedronGeometry(RADIUS * 1.18, 2),
      new THREE.MeshBasicMaterial({
        color: 0x00d4ff,
        wireframe: true,
        transparent: true,
        opacity: 0.03,
        blending: THREE.AdditiveBlending,
      }),
    );
    scene.add(shieldMesh);

    // Inner atmosphere
    scene.add(
      new THREE.Mesh(
        new THREE.SphereGeometry(RADIUS * 1.065, 32, 32),
        new THREE.MeshBasicMaterial({
          color: 0x0033bb,
          transparent: true,
          opacity: 0.04,
          side: THREE.BackSide,
          blending: THREE.AdditiveBlending,
        }),
      ),
    );
    // Outer atmosphere halo
    scene.add(
      new THREE.Mesh(
        new THREE.SphereGeometry(RADIUS * 1.13, 32, 32),
        new THREE.MeshBasicMaterial({
          color: 0x001155,
          transparent: true,
          opacity: 0.025,
          side: THREE.BackSide,
          blending: THREE.AdditiveBlending,
        }),
      ),
    );

    // Radar ring (scans north-south)
    const radarRing = new THREE.Mesh(
      new THREE.TorusGeometry(RADIUS * 1.01, 0.0035, 16, 120),
      new THREE.MeshBasicMaterial({
        color: 0x00ff88,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending,
      }),
    );
    radarRing.rotation.x = Math.PI / 2;
    scene.add(radarRing);

    // Radar sweep sector
    const sweepVerts: number[] = [0, 0, 0];
    for (let i = 0; i <= 32; i++) {
      const a = (i / 32) * Math.PI * 0.32;
      sweepVerts.push(Math.cos(a) * RADIUS * 1.01, 0, Math.sin(a) * RADIUS * 1.01);
    }
    const sweepGeo = new THREE.BufferGeometry();
    sweepGeo.setAttribute("position", new THREE.Float32BufferAttribute(sweepVerts, 3));
    const sweepIdx: number[] = [];
    for (let i = 1; i < 33; i++) sweepIdx.push(0, i, i + 1);
    sweepGeo.setIndex(sweepIdx);
    const radarSweep = new THREE.Mesh(
      sweepGeo,
      new THREE.MeshBasicMaterial({
        color: 0x00ff88,
        transparent: true,
        opacity: 0.06,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      }),
    );
    scene.add(radarSweep);

    // Infrastructure hub dots + rings
    const hubRings: { mesh: THREE.Mesh; phase: number }[] = [];
    MAJOR_HUBS.forEach((hub, i) => {
      const pos = ll2v3(hub.lat, hub.lng, RADIUS);

      const dot = new THREE.Mesh(
        new THREE.SphereGeometry(0.012, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0x00d4ff, blending: THREE.AdditiveBlending }),
      );
      dot.position.copy(pos);
      globeGroup.add(dot);

      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.02, 0.033, 32),
        new THREE.MeshBasicMaterial({
          color: 0x00d4ff,
          transparent: true,
          opacity: 0.35,
          side: THREE.DoubleSide,
        }),
      );
      ring.position.copy(pos);
      ring.lookAt(new THREE.Vector3(0, 0, 0));
      globeGroup.add(ring);
      hubRings.push({ mesh: ring, phase: i * 0.65 });
    });

    // Target marker (Paris HQ)
    const targetPos = ll2v3(48.8, 2.3, RADIUS);
    const targetMarker = new THREE.Mesh(
      new THREE.SphereGeometry(0.038, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0x00ff88, blending: THREE.AdditiveBlending }),
    );
    targetMarker.position.copy(targetPos);
    globeGroup.add(targetMarker);

    [0.055, 0.08, 0.115].forEach((r, ri) => {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(r, r + 0.007, 48),
        new THREE.MeshBasicMaterial({
          color: 0x00ff88,
          transparent: true,
          opacity: 0.25 - ri * 0.06,
          side: THREE.DoubleSide,
        }),
      );
      ring.position.copy(targetPos);
      ring.lookAt(new THREE.Vector3(0, 0, 0));
      globeGroup.add(ring);
    });

    // HUD anchor (follows globe rotation)
    const hudAnchor = new THREE.Object3D();
    hudAnchor.visible = false;
    globeGroup.add(hudAnchor);

    // Starfield
    const starPos = new Float32Array(2200 * 3);
    for (let i = 0; i < 2200 * 3; i++) starPos[i] = (Math.random() - 0.5) * 28;
    const starsGeo = new THREE.BufferGeometry();
    starsGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
    const starField = new THREE.Points(
      starsGeo,
      new THREE.PointsMaterial({
        color: 0x336688,
        size: 0.016,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending,
      }),
    );
    scene.add(starField);

    stateRef.current = {
      arcs: [],
      ripples: [],
      pulseRings: [],
      hubRings,
      scene,
      camera,
      renderer,
      globeGroup,
      shieldMesh,
      radarRing,
      radarSweep,
      targetMarker,
      hudAnchor,
      mouseX: 0,
      mouseY: 0,
      isPaused: false,
      raf: 0,
      tick: 0,
    };

    // Mouse parallax
    const onMouseMove = (e: MouseEvent) => {
      if (!stateRef.current) return;
      const rect = container.getBoundingClientRect();
      stateRef.current.mouseX = (((e.clientX - rect.left) / rect.width) * 2 - 1) * 0.4;
      stateRef.current.mouseY = ((-(e.clientY - rect.top) / rect.height) * 2 + 1) * 0.4;
    };
    container.addEventListener("mousemove", onMouseMove);

    // ── ANIMATION LOOP ──────────────────────────────────────────────────────
    const animate = (nowPerf: number) => {
      if (!stateRef.current) return;
      stateRef.current.raf = requestAnimationFrame(animate);
      const st = stateRef.current;

      if (!st.isPaused) {
        st.tick += 0.016;
        const t = st.tick;

        // Rotations
        globeGroup.rotation.y += 0.0013;
        equatorialMesh.rotation.y -= 0.0009;
        st.shieldMesh.rotation.y -= 0.0007;
        st.shieldMesh.rotation.x += 0.00022;
        starField.rotation.y += 0.00012;

        // Radar sweep (vertical sine wave)
        const ry = Math.sin(t * 0.55) * RADIUS * 0.94;
        const cosA = Math.cos(Math.asin(Math.max(-1, Math.min(1, ry / RADIUS))));
        const sc = Math.max(0.01, cosA);
        st.radarRing.position.y = ry;
        st.radarRing.scale.set(sc, sc, sc);
        st.radarSweep.rotation.y += 0.011;
        st.radarSweep.position.y = ry;
        st.radarSweep.scale.set(sc, 1, sc);

        // Hub pulse rings
        st.hubRings.forEach(({ mesh, phase }) => {
          (mesh.material as THREE.MeshBasicMaterial).opacity =
            0.18 + 0.22 * Math.sin(t * 2.3 + phase);
        });

        // Target marker pulse
        st.targetMarker.scale.setScalar(1 + 0.28 * Math.sin(t * 4.2));

        // Smooth camera parallax
        camera.position.x += (st.mouseX - camera.position.x) * 0.04;
        camera.position.y += (st.mouseY - camera.position.y) * 0.04;
        camera.lookAt(scene.position);
      }

      const now = performance.now();

      // ── Arcs ──────────────────────────────────────────────────────────────
      st.arcs = st.arcs.filter((a) => {
        const elapsed = now - a.created;
        const progress = Math.min(1, elapsed / a.lifespan);
        if (progress >= 1) {
          globeGroup.remove(a.line, a.packet, a.trail);
          disposeMesh(a.line);
          disposeMesh(a.packet);
          disposeMesh(a.trail);
          return false;
        }
        const fadeIn = Math.min(1, elapsed / 350);
        const fadeOut = Math.pow(1 - progress, 1.6);
        (a.line.material as THREE.LineBasicMaterial).opacity = fadeIn * fadeOut * 0.85;
        (a.packet.material as THREE.MeshBasicMaterial).opacity = fadeIn * (1 - progress);

        const pt = a.curve.getPoint(progress);
        a.packet.position.copy(pt);

        // Shift trail buffer (ring buffer – newest at index 0)
        a.trailPos.copyWithin(3, 0);
        a.trailPos[0] = pt.x;
        a.trailPos[1] = pt.y;
        a.trailPos[2] = pt.z;
        (a.trail.geometry as THREE.BufferGeometry).attributes.position.needsUpdate = true;
        return true;
      });

      // ── Ripples ────────────────────────────────────────────────────────────
      st.ripples = st.ripples.filter((r) => {
        const p = (now - r.created) / r.lifespan;
        if (p >= 1) {
          globeGroup.remove(r.mesh);
          disposeMesh(r.mesh);
          return false;
        }
        r.mesh.scale.setScalar(1 + p * 9);
        (r.mesh.material as THREE.MeshBasicMaterial).opacity = (1 - p) * 0.65;
        return true;
      });

      // ── Global pulse rings ─────────────────────────────────────────────────
      st.pulseRings = st.pulseRings.filter((r) => {
        const p = (now - r.created) / r.lifespan;
        if (p >= 1) {
          scene.remove(r.mesh);
          disposeMesh(r.mesh);
          return false;
        }
        r.mesh.scale.setScalar(1 + p * 2.5);
        (r.mesh.material as THREE.MeshBasicMaterial).opacity = (1 - p) * 0.35;
        return true;
      });

      // ── HUD positioning ────────────────────────────────────────────────────
      if (hudRef.current && st.hudAnchor.visible) {
        const v = new THREE.Vector3();
        v.setFromMatrixPosition(st.hudAnchor.matrixWorld);
        v.project(camera);
        if (v.z > 1) {
          hudRef.current.style.opacity = "0";
        } else {
          const px = (v.x * 0.5 + 0.5) * container.clientWidth;
          const py = (v.y * -0.5 + 0.5) * container.clientHeight;
          hudRef.current.style.opacity = "1";
          hudRef.current.style.transform = `translate(${px}px, ${py}px)`;
        }
      }

      renderer.render(scene, camera);
    };
    requestAnimationFrame(animate);

    // Resize observer
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      if (!width || !height || !stateRef.current) return;
      stateRef.current.camera.aspect = width / height;
      stateRef.current.camera.updateProjectionMatrix();
      stateRef.current.renderer.setSize(width, height);
    });
    ro.observe(container);

    return () => {
      cancelAnimationFrame(stateRef.current?.raf ?? 0);
      ro.disconnect();
      container.removeEventListener("mousemove", onMouseMove);
      scene.traverse(disposeMesh);
      renderer.dispose();
      renderer.forceContextLoss();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      stateRef.current = null;
    };
  }, []);

  // ── PAUSE SYNC ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (stateRef.current) stateRef.current.isPaused = paused;
  }, [paused]);

  // ── SELECTED EVENT HUD ────────────────────────────────────────────────────
  useEffect(() => {
    const st = stateRef.current;
    if (!st) return;

    if (selectedEvent) {
      st.hudAnchor.position.copy(ll2v3(selectedEvent.lat, selectedEvent.lng, RADIUS));
      st.hudAnchor.visible = true;

      // Brief flash on selection
      const pulseMesh = new THREE.Mesh(
        new THREE.SphereGeometry(RADIUS * 1.01, 32, 32),
        new THREE.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.07,
          side: THREE.BackSide,
        }),
      );
      st.scene.add(pulseMesh);
      st.pulseRings.push({ mesh: pulseMesh, created: performance.now(), lifespan: 700 });
    } else {
      st.hudAnchor.visible = false;
      if (hudRef.current) hudRef.current.style.opacity = "0";
    }
  }, [selectedEvent]);

  // ── HIGHLIGHT SELECTED ARC ────────────────────────────────────────────────
  useEffect(() => {
    const st = stateRef.current;
    if (!st) return;
    st.arcs.forEach((a) => {
      const mat = a.line.material as THREE.LineBasicMaterial;
      mat.color.setHex(selectedEvent && a.id === selectedEvent.id ? 0xffffff : a.baseColor);
    });
  }, [selectedEvent]);

  // ── SPAWN NEW ATTACK ARCS ─────────────────────────────────────────────────
  useEffect(() => {
    const st = stateRef.current;
    if (!st || attacks.length === 0) return;

    const existing = new Set(st.arcs.map((a) => a.id));
    const fresh = attacks.filter((a) => !existing.has(a.id)).slice(0, 6);

    fresh.forEach((a) => {
      const start = ll2v3(a.lat, a.lng, RADIUS);
      const target = st.targetMarker.position.clone();
      const mid = start.clone().add(target).multiplyScalar(0.5);
      mid.normalize().multiplyScalar(RADIUS * (1.15 + a.intensity * 0.7));

      const curve = new THREE.QuadraticBezierCurve3(start, mid, target);
      const points = curve.getPoints(50);
      const color = arcColor(a);

      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(points),
        new THREE.LineBasicMaterial({
          color,
          transparent: true,
          opacity: 0.9,
          blending: THREE.AdditiveBlending,
        }),
      );

      const packet = new THREE.Mesh(
        new THREE.SphereGeometry(0.024, 10, 10),
        new THREE.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          blending: THREE.AdditiveBlending,
        }),
      );

      const TRAIL = 24;
      const trailPos = new Float32Array(TRAIL * 3);
      const trailGeo = new THREE.BufferGeometry();
      trailGeo.setAttribute("position", new THREE.BufferAttribute(trailPos, 3));
      const trail = new THREE.Points(
        trailGeo,
        new THREE.PointsMaterial({
          color,
          size: 0.014,
          transparent: true,
          opacity: 0.55,
          blending: THREE.AdditiveBlending,
        }),
      );

      st.globeGroup.add(line, packet, trail);
      st.arcs.push({
        id: a.id,
        line,
        packet,
        trail,
        curve,
        created: performance.now(),
        lifespan: 2600 + a.intensity * 2200,
        baseColor: color,
        trailPos,
      });

      // Impact ripple at origin
      const ripple = new THREE.Mesh(
        new THREE.RingGeometry(0.007, 0.025, 32),
        new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0.9,
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending,
        }),
      );
      ripple.position.copy(start);
      ripple.lookAt(new THREE.Vector3(0, 0, 0));
      st.globeGroup.add(ripple);
      st.ripples.push({ mesh: ripple, created: performance.now(), lifespan: 1300 });
    });
  }, [attacks]);

  const sevColor = selectedEvent?.severity
    ? "#" + (SEVERITY_HEX[selectedEvent.severity] ?? 0x00d4ff).toString(16).padStart(6, "0")
    : "#00d4ff";

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#020617]">
      <div ref={containerRef} className="w-full h-full cursor-crosshair absolute inset-0 z-0" />

      {/* Dynamic HUD overlay */}
      <div
        ref={hudRef}
        className="absolute top-0 left-0 z-10 pointer-events-none opacity-0"
        style={{
          transform: "translate(-50%,-50%)",
          willChange: "transform",
          transition: "opacity 0.15s",
        }}
      >
        <div className="relative w-0 h-0">
          <div className="absolute -top-3 -left-3 w-6 h-6 border border-cyan-400 rounded-full animate-ping opacity-35" />
          <div className="absolute -top-1.5 -left-1.5 w-3 h-3 border border-cyan-300 rounded-full" />
          <div className="absolute top-0 left-0 w-1 h-1 bg-cyan-400 rounded-full shadow-[0_0_8px_#00d4ff]" />
          <div
            className="absolute top-2 left-2 w-20 h-px bg-cyan-400/50"
            style={{ transform: "rotate(38deg)", transformOrigin: "0 0" }}
          />
          <div className="absolute top-[58px] left-[64px] bg-slate-950/96 border border-cyan-900/60 p-2.5 backdrop-blur rounded min-w-[148px] shadow-2xl">
            <div className="text-[9px] font-mono text-cyan-400 uppercase tracking-widest mb-1.5 border-b border-cyan-900/40 pb-1 font-bold">
              ⚡ Target Acquired
            </div>
            {selectedEvent && (
              <div className="text-[10px] font-mono text-slate-300 space-y-0.5">
                <div>
                  <span className="text-slate-500">ORIGIN: </span>
                  {selectedEvent.country}
                </div>
                <div>
                  <span className="text-slate-500">IP: </span>
                  <span className="text-cyan-400">{selectedEvent.ip}</span>
                </div>
                <div>
                  <span className="text-slate-500">VECTOR: </span>
                  {selectedEvent.type}
                </div>
                <div>
                  <span className="text-slate-500">SEV: </span>
                  <span style={{ color: sevColor }}>{selectedEvent.severity?.toUpperCase()}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Corner HUD brackets */}
      {(
        [
          "top-0 left-0 border-t-2 border-l-2",
          "top-0 right-0 border-t-2 border-r-2",
          "bottom-0 left-0 border-b-2 border-l-2",
          "bottom-0 right-0 border-b-2 border-r-2",
        ] as const
      ).map((cls, idx) => (
        <div
          key={idx}
          className={`absolute z-10 w-10 h-10 border-cyan-500/25 pointer-events-none ${cls}`}
        />
      ))}

      {/* Live indicator */}
      <div className="absolute top-3 right-4 z-10 flex items-center gap-1.5 pointer-events-none">
        <div className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_5px_#00ff88] animate-pulse" />
        <span className="text-[9px] font-mono text-green-400 tracking-widest uppercase">Live</span>
      </div>

      {/* Arc count */}
      <div className="absolute bottom-3 left-4 z-10 pointer-events-none font-mono">
        <div className="text-[9px] text-cyan-600 uppercase tracking-widest">Active Arcs</div>
        <div className="text-lg font-bold text-cyan-400" style={{ textShadow: "0 0 10px #00d4ff" }}>
          {attacks.length}
        </div>
      </div>
    </div>
  );
}
