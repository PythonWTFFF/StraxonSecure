import { useEffect, useRef } from "react";
import * as THREE from "three";

export const NetworkGlobe = () => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const container = ref.current;
    const w = container.clientWidth;
    const h = container.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 100);
    camera.position.z = 4.2;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(w, h);
      renderer.setClearColor(0x000000, 0);
      container.appendChild(renderer.domElement);
    } catch (e) {
      console.warn("WebGL not supported or context unavailable, falling back to CSS background effect:", e);
      return;
    }

    // Wireframe globe
    const sphere = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.5, 3),
      new THREE.MeshBasicMaterial({ color: 0x4ec3ff, wireframe: true, transparent: true, opacity: 0.35 })
    );
    scene.add(sphere);

    // Inner glow sphere
    const inner = new THREE.Mesh(
      new THREE.SphereGeometry(1.45, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0x0a1622, transparent: true, opacity: 0.5 })
    );
    scene.add(inner);

    // Orbiting nodes
    const nodes: THREE.Mesh[] = [];
    for (let i = 0; i < 40; i++) {
      const node = new THREE.Mesh(
        new THREE.SphereGeometry(0.025, 8, 8),
        new THREE.MeshBasicMaterial({ color: i % 3 === 0 ? 0xb066ff : 0x4ec3ff })
      );
      const phi = Math.acos(-1 + (2 * i) / 40);
      const theta = Math.sqrt(40 * Math.PI) * phi;
      node.position.setFromSphericalCoords(1.55, phi, theta);
      scene.add(node);
      nodes.push(node);
    }

    // Connecting lines
    const lineMat = new THREE.LineBasicMaterial({ color: 0x4ec3ff, transparent: true, opacity: 0.25 });
    for (let i = 0; i < 30; i++) {
      const a = nodes[Math.floor(Math.random() * nodes.length)];
      const b = nodes[Math.floor(Math.random() * nodes.length)];
      const geo = new THREE.BufferGeometry().setFromPoints([a.position, b.position]);
      scene.add(new THREE.Line(geo, lineMat));
    }

    let mouseX = 0, mouseY = 0;
    const onMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 0.4;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 0.4;
    };
    window.addEventListener("mousemove", onMove);

    let raf = 0;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      sphere.rotation.y += 0.002;
      sphere.rotation.x += 0.0008;
      inner.rotation.copy(sphere.rotation);
      nodes.forEach((n) => { n.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), 0.002); });
      scene.rotation.y += (mouseX - scene.rotation.y) * 0.05;
      scene.rotation.x += (-mouseY - scene.rotation.x) * 0.05;
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      const W = container.clientWidth, H = container.clientHeight;
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
      renderer.setSize(W, H);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={ref} className="absolute inset-0" aria-hidden />;
};
