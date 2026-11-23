'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const cameraStops = [
  [0, 0.2, 10],
  [-2.8, 0.5, 7.7],
  [2.6, -0.2, 7.5],
  [-1.5, 1.8, 8.2],
  [0, 0.1, 10.8],
] as const;

function collectFadeMaterials(group: THREE.Group) {
  const materials = new Map<THREE.Material, number>();
  group.traverse(object => {
    if (!(object instanceof THREE.Mesh || object instanceof THREE.LineSegments)) return;
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      material.transparent = true;
      material.depthWrite = false;
      materials.set(material, material.opacity);
    }
  });
  return materials;
}

export default function ThivelabScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const story = document.getElementById('thivelab-story');
    if (!canvas || !story) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
    } catch {
      canvas.setAttribute('data-unavailable', 'true');
      return;
    }

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x070b18, 0.018);
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    const rig = new THREE.Group();
    scene.add(rig);

    const coreMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x3b98ba, metalness: 0.28, roughness: 0.24,
      emissive: 0x0b3e59, emissiveIntensity: 0.65,
      clearcoat: 1, clearcoatRoughness: 0.08, flatShading: true,
    });
    const coreGeometry = new THREE.IcosahedronGeometry(1.42, 1);
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    rig.add(core);
    const innerCore = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.12, 1),
      new THREE.MeshBasicMaterial({ color: 0x46e4d6, transparent: true, opacity: 0.13, wireframe: true }),
    );
    rig.add(innerCore);
    const coreEdges = new THREE.LineSegments(
      new THREE.EdgesGeometry(coreGeometry, 12),
      new THREE.LineBasicMaterial({ color: 0xb0fff0, transparent: true, opacity: 0.85 }),
    );
    rig.add(coreEdges);

    const outerGeometry = new THREE.OctahedronGeometry(1.95, 0);
    const outerFrame = new THREE.LineSegments(
      new THREE.EdgesGeometry(outerGeometry),
      new THREE.LineBasicMaterial({ color: 0x72c9ec, transparent: true, opacity: 0.25 }),
    );
    rig.add(outerFrame);

    const ringMaterial = new THREE.MeshStandardMaterial({
      color: 0x70e8e8, metalness: 0.42, roughness: 0.23,
      emissive: 0x126d82, emissiveIntensity: 0.75, side: THREE.DoubleSide,
      transparent: true, depthWrite: false,
    });
    const rings = [
      { radius: 2.25, tube: 0.035, rotation: [0.3, 0.1, 0.55] },
      { radius: 2.68, tube: 0.025, rotation: [1.16, 0.38, -0.5] },
      { radius: 3.12, tube: 0.018, rotation: [0.74, -0.72, 0.33] },
    ];
    for (const ring of rings) {
      const mesh = new THREE.Mesh(new THREE.TorusGeometry(ring.radius, ring.tube, 10, 160), ringMaterial);
      mesh.rotation.set(ring.rotation[0], ring.rotation[1], ring.rotation[2]);
      rig.add(mesh);
    }

    const orbitMarkers = new THREE.Group();
    for (let i = 0; i < 12; i += 1) {
      const angle = (i / 12) * Math.PI * 2;
      const marker = new THREE.Mesh(
        new THREE.BoxGeometry(i % 3 === 0 ? 0.12 : 0.045, 0.045, 0.045),
        new THREE.MeshBasicMaterial({ color: i % 3 === 0 ? 0xb5ffe7 : 0x73bce0 }),
      );
      marker.position.set(Math.cos(angle) * 3.42, Math.sin(angle) * 3.42, 0);
      marker.rotation.z = angle;
      orbitMarkers.add(marker);
    }
    rig.add(orbitMarkers);

    const satellites = new THREE.Group();
    const satelliteColors = [0xa2ffdc, 0x9ae8ff, 0xc4a9ff, 0xffd89a];
    for (let i = 0; i < 4; i += 1) {
      const angle = (i / 4) * Math.PI * 2 + 0.38;
      const material = new THREE.MeshStandardMaterial({
        color: satelliteColors[i], emissive: satelliteColors[i], emissiveIntensity: 0.65,
        metalness: 0.5, roughness: 0.25, flatShading: true,
      });
      const node = new THREE.Mesh(new THREE.OctahedronGeometry(i === 0 ? 0.22 : 0.16, 0), material);
      node.position.set(Math.cos(angle) * 3.15, Math.sin(angle * 1.3) * 1.35, Math.sin(angle) * 2.15);
      satellites.add(node);
    }
    rig.add(satellites);

    // Each service has its own small spatial sculpture. They crossfade around
    // the chapter centres so the canvas stays continuous between sections.
    const knowledgeGroup = new THREE.Group();
    const panelGeometry = new THREE.BoxGeometry(1.12, 2.18, 0.07);
    const panelOutlineGeometry = new THREE.EdgesGeometry(panelGeometry);
    const panelMaterials = [0x287b9e, 0x315a9b].map(color => new THREE.MeshStandardMaterial({
      color, emissive: 0x102653, metalness: 0.25, roughness: 0.3,
      transparent: true, opacity: 0.28, side: THREE.DoubleSide,
    }));
    const panelOutlineMaterial = new THREE.LineBasicMaterial({ color: 0x9bdcff, transparent: true, opacity: 0.72 });
    const barGeometries = [0.65, 0.54, 0.66].map(width => new THREE.BoxGeometry(width, 0.025, 0.012));
    const barMaterials = [0xb9fff1, 0x8bb9e5].map(color => new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.72 }));
    for (let i = 0; i < 5; i += 1) {
      const panel = new THREE.Mesh(panelGeometry, panelMaterials[i % 2]);
      panel.position.set((i - 2) * 0.79, (i % 2 ? -0.12 : 0.12), -0.8 - Math.abs(i - 2) * 0.25);
      panel.rotation.y = (i - 2) * -0.18;
      knowledgeGroup.add(panel);
      const outline = new THREE.LineSegments(
        panelOutlineGeometry, panelOutlineMaterial,
      );
      outline.position.copy(panel.position);
      outline.rotation.copy(panel.rotation);
      knowledgeGroup.add(outline);
      for (let row = 0; row < 3; row += 1) {
        const bar = new THREE.Mesh(
          barGeometries[row], barMaterials[row === 0 ? 0 : 1],
        );
        bar.position.set(panel.position.x, panel.position.y + 0.6 - row * 0.21, panel.position.z + 0.05);
        knowledgeGroup.add(bar);
      }
    }
    rig.add(knowledgeGroup);

    const toolsGroup = new THREE.Group();
    const blockGeometry = new THREE.BoxGeometry(0.78, 0.78, 0.78);
    const blockOutlineGeometry = new THREE.EdgesGeometry(blockGeometry);
    const blockMaterials = [0x3c92b9, 0x3dd2bb].map(color => new THREE.MeshStandardMaterial({
      color, emissive: 0x0a4f58, metalness: 0.4, roughness: 0.25,
      transparent: true, opacity: 0.78, flatShading: true,
    }));
    const blockOutlineMaterial = new THREE.LineBasicMaterial({ color: 0xc2fff0, transparent: true, opacity: 0.65 });
    for (let i = 0; i < 6; i += 1) {
      const block = new THREE.Mesh(blockGeometry, blockMaterials[i % 2]);
      block.position.set((i % 3 - 1) * 1.16, (Math.floor(i / 3) ? -0.7 : 0.7), (i % 2 ? 0.45 : -0.35));
      block.rotation.set(i * 0.08, i * 0.12, i * -0.05);
      toolsGroup.add(block);
      const outline = new THREE.LineSegments(
        blockOutlineGeometry, blockOutlineMaterial,
      );
      outline.position.copy(block.position);
      outline.rotation.copy(block.rotation);
      toolsGroup.add(outline);
    }
    rig.add(toolsGroup);

    const exploreGroup = new THREE.Group();
    for (let i = 0; i < 2; i += 1) {
      const portal = new THREE.Group();
      const color = i ? 0xffaeac : 0xcaa5ff;
      const rim = new THREE.Mesh(
        new THREE.TorusGeometry(1.12, 0.08, 12, 72),
        new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.55, metalness: 0.25, roughness: 0.25 }),
      );
      portal.add(rim);
      const centre = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.53, 0),
        new THREE.MeshPhysicalMaterial({ color, emissive: color, emissiveIntensity: 0.18, metalness: 0.2, roughness: 0.22, flatShading: true }),
      );
      portal.add(centre);
      portal.position.set(i ? 1.18 : -1.18, i ? -0.26 : 0.26, i ? -0.65 : 0.55);
      portal.rotation.y = i ? -0.55 : 0.55;
      exploreGroup.add(portal);
    }
    rig.add(exploreGroup);

    const chapterSculptures = [
      { group: knowledgeGroup, materials: collectFadeMaterials(knowledgeGroup), centre: 0.25 },
      { group: toolsGroup, materials: collectFadeMaterials(toolsGroup), centre: 0.5 },
      { group: exploreGroup, materials: collectFadeMaterials(exploreGroup), centre: 0.75 },
    ];

    const floor = new THREE.GridHelper(32, 36, 0x286282, 0x1a3550);
    floor.position.y = -3.35;
    const floorMaterials = Array.isArray(floor.material) ? floor.material : [floor.material];
    floorMaterials.forEach(material => { material.transparent = true; material.opacity = 0.2; });
    scene.add(floor);

    const points = new Float32Array(270 * 3);
    for (let i = 0; i < 270; i += 1) {
      const angle = i * 2.399963;
      const radius = 4.2 + Math.sqrt(i / 270) * 8.5;
      points[i * 3] = Math.cos(angle) * radius;
      points[i * 3 + 1] = Math.sin(i * 1.37) * 3.8;
      points[i * 3 + 2] = Math.sin(angle) * radius - 2;
    }
    const pointGeometry = new THREE.BufferGeometry();
    pointGeometry.setAttribute('position', new THREE.BufferAttribute(points, 3));
    const stars = new THREE.Points(pointGeometry, new THREE.PointsMaterial({ color: 0x80b7d6, size: 0.035, transparent: true, opacity: 0.55 }));
    scene.add(stars);

    scene.add(new THREE.AmbientLight(0xc5eaff, 2.3));
    const keyLight = new THREE.PointLight(0xa2fff0, 100, 20);
    keyLight.position.set(-3, 3, 5);
    scene.add(keyLight);
    const rimLight = new THREE.PointLight(0xb08aff, 90, 20);
    rimLight.position.set(4, -1.5, -3);
    scene.add(rimLight);
    const faceLight = new THREE.DirectionalLight(0xe0f9ff, 2.4);
    faceLight.position.set(0, 1, 7);
    scene.add(faceLight);

    const palettes = [0x3b98ba, 0x5c87c2, 0x48bda3, 0x9a77c2, 0x63c6b7].map(color => new THREE.Color(color));
    const ringPalettes = [0x70e8e8, 0x82aeff, 0x9ff5c9, 0xc1a4ff, 0x90ddd0].map(color => new THREE.Color(color));

    let progress = 0;
    let pointerX = 0;
    let pointerY = 0;
    let frame = 0;
    let visible = true;
    let contextLost = false;

    const resize = () => {
      const width = Math.max(1, canvas.clientWidth);
      const height = Math.max(1, canvas.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      if (reducedMotion) draw();
    };

    const updateScroll = () => {
      const bounds = story.getBoundingClientRect();
      const travel = Math.max(1, story.offsetHeight - window.innerHeight);
      progress = THREE.MathUtils.clamp(-bounds.top / travel, 0, 1);
      story.style.setProperty('--scroll-progress', progress.toFixed(4));
      if (reducedMotion) draw();
    };

    const movePointer = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return;
      pointerX = event.clientX / window.innerWidth - 0.5;
      pointerY = event.clientY / window.innerHeight - 0.5;
    };

    function draw() {
      if (contextLost) return;
      const step = Math.min(3, Math.floor(progress * 4));
      const t = THREE.MathUtils.smoothstep(progress * 4 - step, 0, 1);
      const from = cameraStops[step];
      const to = cameraStops[step + 1];
      for (const sculpture of chapterSculptures) {
        const distance = Math.abs(progress - sculpture.centre);
        const opacity = 1 - THREE.MathUtils.smoothstep(distance, 0.055, 0.225);
        sculpture.group.visible = opacity > 0.01;
        sculpture.group.scale.setScalar(0.86 + opacity * 0.14);
        for (const [material, baseOpacity] of sculpture.materials) material.opacity = baseOpacity * opacity;
      }
      const centreWeight = Math.max(
        ...chapterSculptures.map(sculpture => 1 - THREE.MathUtils.smoothstep(Math.abs(progress - sculpture.centre), 0.04, 0.22)),
      );
      const coreScale = 1 - centreWeight * 0.56;
      core.scale.setScalar(coreScale);
      innerCore.scale.setScalar(coreScale);
      coreEdges.scale.setScalar(coreScale);
      outerFrame.scale.setScalar(1 - centreWeight * 0.25);
      ringMaterial.opacity = 1 - centreWeight * 0.64;
      orbitMarkers.scale.setScalar(1 - centreWeight * 0.18);
      satellites.scale.setScalar(1 - centreWeight * 0.2);
      coreMaterial.color.copy(palettes[step]).lerp(palettes[step + 1], t);
      ringMaterial.color.copy(ringPalettes[step]).lerp(ringPalettes[step + 1], t);
      const mobile = window.innerWidth < 700;
      camera.position.set(
        THREE.MathUtils.lerp(from[0], to[0], t) + (mobile ? 0 : pointerX * 0.6),
        THREE.MathUtils.lerp(from[1], to[1], t) - (mobile ? 0 : pointerY * 0.45),
        THREE.MathUtils.lerp(from[2], to[2], t) + (mobile ? 2.4 : 0),
      );
      camera.lookAt(0, 0, 0);
      rig.rotation.y = progress * Math.PI * 1.75 + (reducedMotion ? 0 : performance.now() * 0.00012);
      rig.rotation.x = progress * 0.45 - 0.15;
      satellites.rotation.y = -progress * Math.PI * 1.2;
      core.rotation.y = -rig.rotation.y * 0.35;
      innerCore.rotation.y = rig.rotation.y * 0.58;
      outerFrame.rotation.y = -rig.rotation.y * 0.22;
      orbitMarkers.rotation.z = -progress * Math.PI * 0.65;
      knowledgeGroup.rotation.y = 0.12 + progress * 0.75;
      toolsGroup.rotation.y = -0.15 + progress * 0.55;
      exploreGroup.rotation.y = progress * -0.48;
      stars.rotation.y = progress * 0.16;
      renderer.render(scene, camera);
      canvas?.parentElement?.setAttribute('data-scene-ready', 'true');
    }

    const tick = () => {
      if (visible && !document.hidden && !contextLost) draw();
      frame = requestAnimationFrame(tick);
    };
    const onContextLost = (event: Event) => {
      event.preventDefault();
      contextLost = true;
      canvas.setAttribute('data-unavailable', 'true');
      canvas.parentElement?.removeAttribute('data-scene-ready');
    };
    const onContextRestored = () => {
      contextLost = false;
      canvas.removeAttribute('data-unavailable');
      resize();
      draw();
    };
    const observer = new IntersectionObserver(entries => {
      visible = Boolean(entries[0]?.isIntersecting);
      if (visible && reducedMotion) draw();
    });
    observer.observe(story);
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    window.addEventListener('scroll', updateScroll, { passive: true });
    window.addEventListener('pointermove', movePointer, { passive: true });
    window.addEventListener('resize', resize, { passive: true });
    canvas.addEventListener('webglcontextlost', onContextLost);
    canvas.addEventListener('webglcontextrestored', onContextRestored);
    resize();
    updateScroll();
    draw();
    if (!reducedMotion) frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      resizeObserver.disconnect();
      window.removeEventListener('scroll', updateScroll);
      window.removeEventListener('pointermove', movePointer);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      canvas.removeEventListener('webglcontextrestored', onContextRestored);
      canvas?.parentElement?.removeAttribute('data-scene-ready');
      const geometries = new Set<THREE.BufferGeometry>();
      const materials = new Set<THREE.Material>();
      scene.traverse(object => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Points || object instanceof THREE.LineSegments) {
          geometries.add(object.geometry);
          for (const material of Array.isArray(object.material) ? object.material : [object.material]) materials.add(material);
        }
      });
      geometries.forEach(geometry => geometry.dispose());
      materials.forEach(material => material.dispose());
      outerGeometry.dispose();
      renderer.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} className="thive-scene-canvas" aria-hidden="true" />;
}
