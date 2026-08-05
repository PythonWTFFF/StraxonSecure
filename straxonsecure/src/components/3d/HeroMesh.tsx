import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

function ParticleSwarm() {
  const pointsRef = useRef<THREE.Points>(null);

  // Generate 2000 random nodes in a sphere
  const count = 2000;
  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const colorPrimary = new THREE.Color("#00d4ff");
    const colorAccent = new THREE.Color("#ff0066");

    for (let i = 0; i < count; i++) {
      const r = 10 * Math.cbrt(Math.random());
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);

      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);

      // Mix cyan and magenta based on position
      const mixedColor = colorPrimary.clone().lerp(colorAccent, Math.random() > 0.8 ? 1 : 0);
      col[i * 3] = mixedColor.r;
      col[i * 3 + 1] = mixedColor.g;
      col[i * 3 + 2] = mixedColor.b;
    }
    return [pos, col];
  }, [count]);

  useFrame((state) => {
    if (!pointsRef.current) return;
    const time = state.clock.getElapsedTime();
    pointsRef.current.rotation.y = time * 0.05;
    pointsRef.current.rotation.z = Math.sin(time * 0.02) * 0.1;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute attach="attributes-color" count={count} array={colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        vertexColors
        transparent
        opacity={0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

export function HeroMesh() {
  return (
    <div
      className="absolute inset-0 z-0 opacity-40 pointer-events-none mix-blend-screen"
      style={{
        maskImage: "linear-gradient(to bottom, black 40%, transparent 100%)",
        WebkitMaskImage: "linear-gradient(to bottom, black 40%, transparent 100%)",
      }}
    >
      <Canvas camera={{ position: [0, 0, 8], fov: 60 }}>
        <ParticleSwarm />
      </Canvas>
    </div>
  );
}
