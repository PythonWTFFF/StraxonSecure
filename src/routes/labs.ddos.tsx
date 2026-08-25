import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { CyberCard } from "@/components/cyber/CyberCard";
import { CyberButton } from "@/components/cyber/CyberButton";
import { LabFrame } from "@/components/labs/LabFrame";
import { Waves, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/labs/ddos")({
  head: () => ({
    meta: [
      { title: "DDoS Lab — Straxon Secure" },
      {
        name: "description",
        content: "3D particle visualization of a DDoS attack and rate-limiting mitigation.",
      },
    ],
  }),
  component: DDoSGated,
});

import { PremiumGate } from "@/components/PremiumGate";
function DDoSGated() {
  return (
    <div className="px-4 lg:px-8 py-8 max-w-7xl mx-auto">
      <PremiumGate
        feature="DDoS Lab"
        description="Pro unlocks the 3D DDoS visualization with rate-limiting simulation."
      >
        <DDoSLab />
      </PremiumGate>
    </div>
  );
}

function DDoSLab() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [intensity, setIntensity] = useState(150);
  const [defended, setDefended] = useState(false);
  const stateRef = useRef<{ intensity: number; defended: boolean }>({
    intensity: 150,
    defended: false,
  });
  stateRef.current = { intensity, defended };

  const [load, setLoad] = useState(0);
  const [responseMs, setResponseMs] = useState(20);

  useEffect(() => {
    // simulate server load metrics
    const t = setInterval(() => {
      const eff = stateRef.current.defended
        ? Math.min(stateRef.current.intensity, 80)
        : stateRef.current.intensity;
      setLoad(Math.min(100, Math.round(eff / 5 + Math.random() * 5)));
      setResponseMs(
        stateRef.current.defended
          ? 30 + Math.round(Math.random() * 20)
          : 30 + Math.round(eff * 5 + Math.random() * 200),
      );
    }, 700);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const w = container.clientWidth;
    const h = container.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 100);
    camera.position.set(0, 0, 12);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // server cube at center
    const server = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 1.4, 1.4),
      new THREE.MeshBasicMaterial({ color: 0x00d4ff, wireframe: true }),
    );
    scene.add(server);

    const shield = new THREE.Mesh(
      new THREE.SphereGeometry(2.2, 24, 24),
      new THREE.MeshBasicMaterial({
        color: 0xff00aa,
        wireframe: true,
        transparent: true,
        opacity: 0.0,
      }),
    );
    scene.add(shield);

    const MAX = 1500;
    const positions = new Float32Array(MAX * 3);
    const velocities = new Float32Array(MAX * 3);
    const alive = new Uint8Array(MAX);

    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xff3366,
      size: 0.08,
      transparent: true,
      opacity: 0.85,
    });
    const points = new THREE.Points(geom, mat);
    scene.add(points);

    const spawn = (i: number) => {
      const r = 14;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
      // velocity toward center
      const len = Math.sqrt(
        positions[i * 3] ** 2 + positions[i * 3 + 1] ** 2 + positions[i * 3 + 2] ** 2,
      );
      const speed = 0.06 + Math.random() * 0.08;
      velocities[i * 3] = (-positions[i * 3] / len) * speed;
      velocities[i * 3 + 1] = (-positions[i * 3 + 1] / len) * speed;
      velocities[i * 3 + 2] = (-positions[i * 3 + 2] / len) * speed;
      alive[i] = 1;
    };

    let raf = 0;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      server.rotation.x += 0.005;
      server.rotation.y += 0.007;

      const target = stateRef.current.defended ? 0.5 : 0;
      shield.material.opacity += (target - shield.material.opacity) * 0.05;
      shield.rotation.y += 0.004;

      // spawn new particles based on intensity
      const toSpawn = Math.floor(stateRef.current.intensity / 20);
      let spawned = 0;
      for (let i = 0; i < MAX && spawned < toSpawn; i++) {
        if (!alive[i]) {
          spawn(i);
          spawned++;
        }
      }

      for (let i = 0; i < MAX; i++) {
        if (!alive[i]) {
          positions[i * 3] = 1000;
          positions[i * 3 + 1] = 1000;
          positions[i * 3 + 2] = 1000;
          continue;
        }
        positions[i * 3] += velocities[i * 3];
        positions[i * 3 + 1] += velocities[i * 3 + 1];
        positions[i * 3 + 2] += velocities[i * 3 + 2];
        const d = Math.sqrt(
          positions[i * 3] ** 2 + positions[i * 3 + 1] ** 2 + positions[i * 3 + 2] ** 2,
        );

        // shield blocks 80% if defended
        if (stateRef.current.defended && d < 2.2 && Math.random() < 0.8) {
          alive[i] = 0;
          continue;
        }
        if (d < 0.8) alive[i] = 0;
      }
      geom.attributes.position.needsUpdate = true;
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      const ww = container.clientWidth;
      const hh = container.clientHeight;
      camera.aspect = ww / hh;
      camera.updateProjectionMatrix();
      renderer.setSize(ww, hh);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      if (renderer.domElement.parentNode === container) container.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <LabFrame title="DDoS VISUALIZATION" badge="LAB-04" recorderLab="ddos">
      <p className="text-muted-foreground max-w-3xl">
        Particles = malicious requests flooding the server. Toggle the rate-limiting shield to watch
        load drop.
      </p>

      <div className="grid lg:grid-cols-3 gap-4">
        <CyberCard variant="cyan" className="lg:col-span-2 p-0 overflow-hidden">
          <div className="px-4 py-2 border-b border-border/50 flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-primary">// LIVE TRAFFIC</span>
            <span className="text-[10px] font-mono text-muted-foreground">
              {intensity} req/s — {defended ? "shield ON" : "shield OFF"}
            </span>
          </div>
          <div ref={containerRef} className="h-[440px]" />
        </CyberCard>

        <CyberCard variant="magenta">
          <div className="text-xs font-mono uppercase text-accent mb-3">Controls</div>
          <label className="text-[10px] font-mono uppercase text-muted-foreground">
            Intensity (req/s)
          </label>
          <input
            type="range"
            min={20}
            max={1500}
            value={intensity}
            onChange={(e) => setIntensity(Number(e.target.value))}
            className="w-full accent-accent mt-1"
          />
          <div className="text-right text-xs font-mono">{intensity}</div>

          <CyberButton
            onClick={() => setDefended((d) => !d)}
            variant={defended ? "cyan" : "magenta"}
            className="w-full mt-4"
          >
            <ShieldCheck className="h-4 w-4" />{" "}
            {defended ? "Disable shield" : "Enable rate limiting"}
          </CyberButton>

          <div className="mt-6 space-y-3">
            <Metric
              label="Server load"
              value={`${load}%`}
              bar={load}
              color={load > 80 ? "var(--destructive)" : "var(--neon-cyan)"}
            />
            <Metric
              label="Avg response"
              value={`${responseMs} ms`}
              bar={Math.min(100, responseMs / 10)}
              color={responseMs > 500 ? "var(--destructive)" : "var(--success)"}
            />
            <Metric
              label="Status"
              value={load > 90 && !defended ? "🔥 OVERLOADED" : "✓ NOMINAL"}
              bar={defended ? 30 : load}
              color={
                defended ? "var(--success)" : load > 80 ? "var(--destructive)" : "var(--warning)"
              }
            />
          </div>
        </CyberCard>
      </div>

      <CyberCard variant="magenta">
        <div className="text-xs font-mono uppercase tracking-wider text-accent mb-2">
          // MITIGATION
        </div>
        <ul className="text-sm text-muted-foreground space-y-1.5 list-disc pl-5">
          <li>Edge rate-limiting (Cloudflare, AWS Shield, fastly).</li>
          <li>WAF rules to drop malformed traffic.</li>
          <li>Anycast + autoscaling to distribute load.</li>
          <li>Per-IP and per-token quotas at the API gateway.</li>
        </ul>
      </CyberCard>
    </LabFrame>
  );
}

function Metric({
  label,
  value,
  bar,
  color,
}: {
  label: string;
  value: string;
  bar: number;
  color: string;
}) {
  return (
    <div>
      <div className="flex justify-between text-xs font-mono">
        <span className="text-muted-foreground uppercase">{label}</span>
        <span>
          <span style={{ color }}>{value}</span>
        </span>
      </div>
      <div className="h-1.5 bg-background/60 rounded-full mt-1 overflow-hidden">
        <div
          className="h-full transition-all duration-500"
          style={{ width: `${bar}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

declare module "three" {
  interface MeshBasicMaterial {
    opacity: number;
  }
}
