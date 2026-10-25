"use client";

import { useEffect, useRef } from "react";
import {
  AmbientLight,
  BoxGeometry,
  CanvasTexture,
  DirectionalLight,
  Group,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Scene,
  SRGBColorSpace,
  WebGLRenderer,
} from "three";
import { TILE_BG, tileDataUri } from "@/lib/azulejo";

/** Plain three.js: a 3x3 cluster of azulejo tiles that drifts slowly and leans toward the pointer. */
export default function TileScene({ onReady }: { onReady: () => void }) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;

    let renderer: WebGLRenderer;
    try {
      renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
    } catch {
      return; // no WebGL: the static cluster stays
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.outputColorSpace = SRGBColorSpace;
    el.appendChild(renderer.domElement);
    renderer.domElement.className = "size-full";

    const scene = new Scene();
    const camera = new PerspectiveCamera(32, 1, 0.1, 50);
    camera.position.set(0, 0, 8.5);
    scene.add(new AmbientLight(0xffffff, 1.6));
    const sun = new DirectionalLight(0xfff3dd, 2.2);
    sun.position.set(-3, 4, 6);
    scene.add(sun);

    const geo = new BoxGeometry(1, 1, 0.14);
    const edge = new MeshStandardMaterial({ color: TILE_BG, roughness: 0.6 });
    const group = new Group();
    scene.add(group);
    const tiles: { mesh: Mesh; phase: number; tilt: number }[] = [];

    const img = new Image();
    let disposed = false;
    let face: MeshStandardMaterial | null = null;
    let tex: CanvasTexture | null = null;
    img.onload = () => {
      if (disposed) return;
      const c = document.createElement("canvas");
      c.width = c.height = 256;
      c.getContext("2d")!.drawImage(img, 0, 0, 256, 256);
      tex = new CanvasTexture(c);
      tex.colorSpace = SRGBColorSpace;
      tex.anisotropy = 4;
      // glossy glaze, like fired ceramic
      face = new MeshStandardMaterial({ map: tex, roughness: 0.28, metalness: 0.02 });
      const mats = [edge, edge, edge, edge, face, edge];
      for (let i = 0; i < 9; i++) {
        const mesh = new Mesh(geo, mats);
        const x = (i % 3) - 1;
        const y = 1 - Math.floor(i / 3);
        mesh.position.set(x * 1.06, y * 1.06, 0);
        tiles.push({ mesh, phase: Math.random() * 6.28, tilt: (Math.random() - 0.5) * 0.05 });
        group.add(mesh);
      }
      resize();
      onReady();
      start();
    };
    img.src = tileDataUri;

    const resize = () => {
      const { clientWidth: w, clientHeight: h } = el;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    const pointer = { x: 0, y: 0 };
    const onMove = (e: PointerEvent) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    // Only animate while visible on screen and the tab is in front.
    let onScreen = true;
    let raf = 0;
    const clock = performance.now();
    const frame = (now: number) => {
      raf = 0;
      if (!onScreen || document.hidden) return;
      const t = (now - clock) / 1000;
      group.rotation.y += ((Math.sin(t * 0.35) * 0.45 + pointer.x * 0.35) - group.rotation.y) * 0.05;
      group.rotation.x += ((pointer.y * 0.25 - 0.12) - group.rotation.x) * 0.05;
      for (const k of tiles) {
        k.mesh.position.z = Math.sin(t * 0.8 + k.phase) * 0.08;
        k.mesh.rotation.z = k.tilt;
      }
      renderer.render(scene, camera);
      raf = requestAnimationFrame(frame);
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };
    const io = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      if (onScreen) start();
    });
    io.observe(el);
    const onVis = () => !document.hidden && start();
    document.addEventListener("visibilitychange", onVis);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("visibilitychange", onVis);
      geo.dispose();
      edge.dispose();
      face?.dispose();
      tex?.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [onReady]);

  return <div ref={host} className="size-full" />;
}
