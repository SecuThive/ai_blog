'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/** Decorative WebGL layer; article links stay in accessible HTML above it. */
export default function HeroDepthCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = canvas?.parentElement;
    if (!canvas || !container) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
    } catch {
      return;
    }
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(43, 1, 0.1, 30);
    camera.position.set(0, 0, 8.7);
    const rig = new THREE.Group();
    scene.add(rig);

    const core = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.3, 1),
      new THREE.MeshPhysicalMaterial({ color: 0x28668a, metalness: 0.57, roughness: 0.27, flatShading: true, clearcoat: 0.75 }),
    );
    rig.add(core);
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(1.32, 1)),
      new THREE.LineBasicMaterial({ color: 0x8be5f1, transparent: true, opacity: 0.6 }),
    );
    rig.add(edges);
    const ringMaterial = new THREE.MeshStandardMaterial({ color: 0x47b3dc, metalness: 0.8, roughness: 0.3, emissive: 0x103253, emissiveIntensity: 0.5 });
    const ringA = new THREE.Mesh(new THREE.TorusGeometry(2.02, 0.024, 8, 100), ringMaterial);
    ringA.rotation.set(0.6, 0.25, 0.4);
    rig.add(ringA);
    const ringB = new THREE.Mesh(new THREE.TorusGeometry(2.38, 0.018, 8, 100), ringMaterial);
    ringB.rotation.set(1.18, -0.35, -0.55);
    rig.add(ringB);
    const sparkMaterial = new THREE.MeshStandardMaterial({ color: 0xb8f7d2, emissive: 0x66e6c2, emissiveIntensity: 1.1 });
    for (const [x, y, z] of [[-2.4, 1.3, 0.5], [2.3, -1.1, 0.8], [1.2, 1.9, -0.5]]) {
      const spark = new THREE.Mesh(new THREE.OctahedronGeometry(0.1), sparkMaterial);
      spark.position.set(x, y, z);
      rig.add(spark);
    }
    scene.add(new THREE.AmbientLight(0xd1e8ff, 1.65));
    const light = new THREE.PointLight(0x7ee2ff, 34, 14);
    light.position.set(-2, 3, 5);
    scene.add(light);
    const rim = new THREE.PointLight(0x9d87ff, 26, 13);
    rim.position.set(3, -1, -2);
    scene.add(rim);

    let frame = 0;
    let visible = true;
    let pointerX = 0;
    let pointerY = 0;
    const draw = () => {
      const time = reducedMotion ? 0 : performance.now() * 0.00016;
      rig.rotation.set(pointerY * -0.3 + time * 0.45, pointerX * 0.42 + time, 0.08);
      core.rotation.y = -rig.rotation.y * 0.4;
      renderer.render(scene, camera);
      container.setAttribute('data-depth-ready', 'true');
    };
    const resize = () => {
      const width = Math.max(1, canvas.clientWidth);
      const height = Math.max(1, canvas.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      draw();
    };
    const onPointer = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return;
      const bounds = container.getBoundingClientRect();
      pointerX = (event.clientX - bounds.left) / bounds.width - 0.5;
      pointerY = (event.clientY - bounds.top) / bounds.height - 0.5;
      if (reducedMotion) draw();
    };
    const tick = () => {
      if (visible && !document.hidden) draw();
      frame = requestAnimationFrame(tick);
    };
    const observer = new IntersectionObserver(entries => { visible = Boolean(entries[0]?.isIntersecting); });
    observer.observe(container);
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    container.addEventListener('pointermove', onPointer);
    resize();
    if (!reducedMotion) frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      resizeObserver.disconnect();
      container.removeEventListener('pointermove', onPointer);
      container.removeAttribute('data-depth-ready');
      rig.traverse(object => {
        if (!(object instanceof THREE.Mesh || object instanceof THREE.LineSegments)) return;
        object.geometry.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach(material => material.dispose());
      });
      renderer.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} className="hero-depth-canvas" aria-hidden="true" />;
}
