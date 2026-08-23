import React, { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { supabase } from "@/integrations/supabase/client";

// ─────────────────────────────────────────────
// 1. 3D HOLOGRAPHIC BACKGROUND (Particle Swarm)
// ─────────────────────────────────────────────
export function ParticleSwarm() {
  const pointsRef = useRef<THREE.Points>(null);

  const [positions, colors] = useMemo(() => {
    const count = 3000;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const colorPrimary = new THREE.Color("#00f3ff");
    const colorAccent = new THREE.Color("#ff003c");

    for (let i = 0; i < count; i++) {
      const r = 12 * Math.cbrt(Math.random());
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);

      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);

      const mixedColor = colorPrimary.clone().lerp(colorAccent, Math.random() > 0.85 ? 1 : 0);
      col[i * 3] = mixedColor.r;
      col[i * 3 + 1] = mixedColor.g;
      col[i * 3 + 2] = mixedColor.b;
    }
    return [pos, col];
  }, []);

  useFrame((state) => {
    if (!pointsRef.current) return;
    const time = state.clock.getElapsedTime();
    pointsRef.current.rotation.y = time * 0.02;
    pointsRef.current.rotation.x = Math.sin(time * 0.01) * 0.05;

    const scale = 1 + Math.sin(time * 0.5) * 0.02;
    pointsRef.current.scale.set(scale, scale, scale);
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          count={colors.length / 3}
          array={colors}
          itemSize={3}
          args={[colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        vertexColors
        transparent
        opacity={0.3}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

export function BackgroundGlobe() {
  const globeRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (globeRef.current) {
      globeRef.current.rotation.y = clock.getElapsedTime() * 0.03;
      globeRef.current.rotation.x = clock.getElapsedTime() * 0.01;
      globeRef.current.rotation.z = clock.getElapsedTime() * 0.02;
    }
  });

  return (
    <mesh ref={globeRef} position={[5, 0, -10]} scale={[12, 12, 12]}>
      <icosahedronGeometry args={[1, 3]} />
      <meshBasicMaterial
        color="#00f3ff"
        wireframe
        transparent
        opacity={0.04}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}

// ─────────────────────────────────────────────
// 2. 3D CYBER EARTH (Hero Widget)
// ─────────────────────────────────────────────
export function CyberEarth() {
  const earthGroupRef = useRef<THREE.Group>(null);
  const ringGroupRef = useRef<THREE.Group>(null);

  const [activeNodes, setActiveNodes] = useState<
    Array<{ id: string; pos: [number, number, number]; color: string }>
  >([]);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimer: NodeJS.Timeout;
    let attempts = 0;

    const connect = async () => {
      // 1. Resolve URL with wss:// enforcement outside local dev
      let rawUrl = import.meta.env.VITE_THREAT_ENGINE_WS_URL || "ws://127.0.0.1:8082";
      if (!import.meta.env.DEV && rawUrl.startsWith("ws://")) {
        rawUrl = rawUrl.replace("ws://", "wss://");
      }

      // 2. JWT Handshake
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;

      // Only send 'supabase' as subprotocol since the backend doesn't check the token anymore
      const protocols = ["supabase"];
      ws = new WebSocket(`${rawUrl}/api/ml/edr-stream`, protocols);

      ws.onopen = () => {
        attempts = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const lat = data.lat;
          const lon = data.lon;

          let hash = 0;
          for (let i = 0; i < (data.agent_id || "random").length; i++)
            hash += (data.agent_id || "random").charCodeAt(i);

          const processNode = (finalLat: number, finalLon: number) => {
            const phi = (90 - finalLat) * (Math.PI / 180);
            const theta = (finalLon + 180) * (Math.PI / 180);

            const r = 2.05; // Slightly above surface
            const x = -(r * Math.sin(phi) * Math.cos(theta));
            const z = r * Math.sin(phi) * Math.sin(theta);
            const y = r * Math.cos(phi);

            setActiveNodes((prev) => {
              const exists = prev.find((n) => n.id === data.agent_id);
              if (exists) return prev;

              // Assign random neon color
              const colors = ["#10b981", "#ef4444", "#d946ef", "#00f3ff", "#f59e0b"];
              const color = colors[hash % colors.length];

              // Cap the number of active nodes to prevent React reconciliation from running out of memory
              return [
                ...prev,
                { id: data.agent_id, pos: [x, y, z] as [number, number, number], color },
              ].slice(-300);
            });
          };

          if (lat && lon) {
            processNode(lat, lon);
          } else if (data.ip) {
            // Free GeoIP lookup for real node location
            fetch(`https://ipapi.co/${data.ip}/json/`)
              .then((r) => r.json())
              .then((geo) => {
                if (geo.latitude && geo.longitude) {
                  processNode(geo.latitude, geo.longitude);
                } else {
                  // Fallback to random if rate limited
                  processNode(Math.random() * 180 - 90, Math.random() * 360 - 180);
                }
              })
              .catch(() => {
                processNode(Math.random() * 180 - 90, Math.random() * 360 - 180);
              });
          } else {
            // Fully random simulation for anonymous nodes
            processNode(Math.random() * 180 - 90, Math.random() * 360 - 180);
          }
        } catch (e) {
          console.error(e);
        }
      };

      ws.onclose = () => {
        // Exponential backoff
        const delay = Math.min(1000 * 2 ** attempts + Math.random() * 1000, 30000);
        attempts++;
        reconnectTimer = setTimeout(connect, delay);
      };
    };

    connect();
    return () => {
      clearTimeout(reconnectTimer);
      if (ws) ws.close();
    };
  }, []);

  useFrame(({ clock, pointer }) => {
    const t = clock.getElapsedTime();

    if (earthGroupRef.current) {
      earthGroupRef.current.rotation.y = t * 0.12;
      earthGroupRef.current.rotation.x = Math.sin(t * 0.1) * 0.05;

      earthGroupRef.current.position.x = THREE.MathUtils.lerp(
        earthGroupRef.current.position.x,
        pointer.x * 0.4,
        0.05,
      );
      earthGroupRef.current.position.y = THREE.MathUtils.lerp(
        earthGroupRef.current.position.y,
        pointer.y * 0.4,
        0.05,
      );
    }

    if (ringGroupRef.current) {
      ringGroupRef.current.rotation.x = t * 0.2;
      ringGroupRef.current.rotation.y = t * 0.3;
      ringGroupRef.current.rotation.z = Math.sin(t * 0.4) * 0.1;
    }
  });

  return (
    <group>
      <group ref={earthGroupRef}>
        <mesh>
          <sphereGeometry args={[2, 64, 64]} />
          <meshBasicMaterial color="#020617" transparent opacity={0.95} />
        </mesh>

        <mesh>
          <sphereGeometry args={[2.02, 32, 32]} />
          <meshBasicMaterial
            color="#00f3ff"
            wireframe
            transparent
            opacity={0.2}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        <mesh>
          <icosahedronGeometry args={[2.05, 2]} />
          <meshBasicMaterial
            color="#d946ef"
            wireframe
            transparent
            opacity={0.08}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        {activeNodes.map((node) => (
          <mesh key={node.id} position={node.pos}>
            <sphereGeometry args={[0.04, 16, 16]} />
            <meshBasicMaterial color={node.color} blending={THREE.AdditiveBlending} />
          </mesh>
        ))}
      </group>

      <group ref={ringGroupRef}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[2.4, 0.003, 32, 100]} />
          <meshBasicMaterial
            color="#00f3ff"
            transparent
            opacity={0.5}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
        <mesh rotation={[Math.PI / 3, Math.PI / 4, 0]}>
          <torusGeometry args={[2.5, 0.002, 32, 100]} />
          <meshBasicMaterial
            color="#d946ef"
            transparent
            opacity={0.4}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        <mesh position={[2.4, 0, 0]}>
          <sphereGeometry args={[0.04, 16, 16]} />
          <meshBasicMaterial color="#00f3ff" blending={THREE.AdditiveBlending} />
        </mesh>
        <mesh
          position={[-2.5 * Math.cos(Math.PI / 4), 2.5 * Math.sin(Math.PI / 4), 0]}
          rotation={[Math.PI / 3, Math.PI / 4, 0]}
        >
          <sphereGeometry args={[0.03, 16, 16]} />
          <meshBasicMaterial color="#d946ef" blending={THREE.AdditiveBlending} />
        </mesh>
      </group>
    </group>
  );
}

// ─────────────────────────────────────────────
// DATA & CONSTANTS
