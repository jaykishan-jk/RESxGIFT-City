import { useEffect, useRef, forwardRef } from 'react';
import * as THREE from 'three';
import GlobeDotsWorker from '../workers/globeDots.worker.js?worker';

// ── Config ────────────────────────────────────────────────────────────────────
const DOT_COUNT      = 20000;
const DOT_SIZE       = 2.5;
const ROT_Y          = -65 * Math.PI / 180;
const ROT_X          =  10 * Math.PI / 180;
const WAVE_LAT       =  12;
const WAVE_LON       =  14;
const WAVE_SPEED     = 0.35;
const WAVE_RINGS     = 7.0;
const WAVE_INTENSITY = 0.07;
const WAVE_SPREAD    = 1.3;

// ── Helpers ───────────────────────────────────────────────────────────────────
// Kept on main thread — still needed for wave origin + glow dot positions
function latLonToVec3(lat, lon) {
  const phi = lat * Math.PI / 180;
  const lam = lon * Math.PI / 180;
  return new THREE.Vector3(
    Math.cos(phi) * Math.sin(lam),
    Math.sin(phi),
    Math.cos(phi) * Math.cos(lam),
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
const GlobeCanvas = forwardRef(function GlobeCanvas(_props, ref) {
  const canvasRef    = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const canvas    = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    // ── Renderer ──────────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 2.65);

    const resize = () => {
      const w = container.clientWidth, h = container.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    // ── Globe group ───────────────────────────────────────────────────────────
    const group = new THREE.Group();
    group.rotation.y = ROT_Y;
    group.rotation.x = ROT_X;
    scene.add(group);

    group.add(new THREE.Mesh(
      new THREE.SphereGeometry(0.999, 64, 48),
      new THREE.MeshBasicMaterial({ color: 0x0a0a0a }),
    ));

    // ── Wave shader ───────────────────────────────────────────────────────────
    const waveU = {
      uTime:      { value: 0 },
      uSpeed:     { value: WAVE_SPEED },
      uRings:     { value: WAVE_RINGS },
      uIntensity: { value: WAVE_INTENSITY },
      uSpread:    { value: WAVE_SPREAD },
      uOrigin:    { value: latLonToVec3(WAVE_LAT, WAVE_LON) },
    };

    group.add(new THREE.Mesh(
      new THREE.SphereGeometry(1.003, 128, 96),
      new THREE.ShaderMaterial({
        uniforms: waveU,
        vertexShader: /* glsl */`
          varying vec3 vN, vW;
          void main() {
            vN = normalize(normalMatrix * normal);
            vW = normalize((modelMatrix * vec4(position, 1.0)).xyz);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }`,
        fragmentShader: /* glsl */`
          uniform float uTime, uSpeed, uRings, uIntensity, uSpread;
          uniform vec3  uOrigin;
          varying vec3  vN, vW;
          void main() {
            float d = acos(clamp(dot(vW, normalize(uOrigin)), -1.0, 1.0));
            float w = sin((d * uRings / uSpread - uTime * uSpeed) * 6.28318);
            w = max(0.0, w); w *= w;
            float a = w
              * exp(-d * d * 2.2)
              * smoothstep(-0.15, 0.35, dot(normalize(vN), vec3(0, 0, 1)))
              * uIntensity;
            gl_FragColor = vec4(1.0, 1.0, 1.0, a);
          }`,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    ));

    // ── Wave origin glow dot ──────────────────────────────────────────────────
    const oP = latLonToVec3(WAVE_LAT, WAVE_LON).multiplyScalar(1.005);

    const glowDot = new THREE.Mesh(
      new THREE.SphereGeometry(0.011, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xffffff }),
    );
    glowDot.position.copy(oP);
    group.add(glowDot);

    // Halo pulse — driven entirely by GPU via shared uTime uniform.
    // Previously: haloDot.material.opacity mutated every RAF frame (CPU→GPU upload).
    // Now: ShaderMaterial reads waveU.uTime directly; no per-frame JS involvement.
    const haloDot = new THREE.Mesh(
      new THREE.SphereGeometry(0.026, 16, 16),
      new THREE.ShaderMaterial({
        uniforms: { uTime: waveU.uTime }, // shared object ref — same value as wave shader
        vertexShader: /* glsl */`
          void main() {
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }`,
        fragmentShader: /* glsl */`
          uniform float uTime;
          void main() {
            float a = 0.08 + sin(uTime * 2.5) * 0.05;
            gl_FragColor = vec4(1.0, 1.0, 1.0, a);
          }`,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    haloDot.position.copy(oP);
    group.add(haloDot);

    // ── Render loop ───────────────────────────────────────────────────────────
    // Only uTime updated per frame — halo opacity now computed in GLSL, not here.
    let rafId;
    const clock = new THREE.Clock();

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      waveU.uTime.value = clock.getElapsedTime();
      renderer.render(scene, camera);
    };
    animate();

    // ── Dot placement via Web Worker ──────────────────────────────────────────
    // Offloads 20k point-in-polygon checks off the main thread (was 800ms–2s).
    // Worker posts back transferable Float32Arrays (zero-copy, no serialisation).
    let mounted = true;
    const worker = new GlobeDotsWorker();
    worker.postMessage({ dotCount: DOT_COUNT });
    worker.onmessage = ({ data }) => {
      if (!mounted) return;
      if (data.error) { console.error('GlobeCanvas worker error:', data.error); return; }
      const geo3 = new THREE.BufferGeometry();
      geo3.setAttribute('position', new THREE.Float32BufferAttribute(data.positions, 3));
      geo3.setAttribute('color',    new THREE.Float32BufferAttribute(data.colors, 3));
      group.add(new THREE.Points(geo3, new THREE.PointsMaterial({
        size: DOT_SIZE * 0.006, vertexColors: true, sizeAttenuation: true,
      })));
      worker.terminate();
    };

    // ── Cleanup ───────────────────────────────────────────────────────────────
    return () => {
      mounted = false;
      cancelAnimationFrame(rafId);
      ro.disconnect();
      renderer.dispose();
      worker.terminate();
    };
  }, []);

  return (
    <div
      ref={ref}
      // transform-gpu: upgrades Tailwind's transform stack to translate3d(),
      // preserving -translate-y-1/2 / lg:translate-y-0 variables while forcing
      // GPU layer promotion. Replaces the previous inline style={{ transform: 'translateZ(0)' }}
      // which silently overwrote all Tailwind transforms (breaking mobile positioning).
      className="absolute right-0 top-1/2 -translate-y-1/2 lg:right-auto lg:left-[14%] lg:top-auto lg:bottom-0 lg:translate-y-0 transform-gpu w-[min(50.5vw,89.81vh)] aspect-square pointer-events-none select-none"
      aria-hidden="true"
    >
      {/* DropShadow: 720×720 @ x=150,y=100 inside 970 frame.
          translateZ(0) promotes to its own compositor layer so the static blur
          never repaints when sibling canvas elements redraw. */}
      <div
        className="absolute rounded-full"
        style={{
          left: '15.46%', top: '10.31%', width: '74.23%',
          aspectRatio: '1',
          background: '#191919',
          filter: 'blur(80px)',
          transform: 'translateZ(0)',
        }}
      />

      {/* canvas container: 870×870 @ x=0,y=100.
          clip-path: circle(50%) replaces overflow-hidden + border-radius.
          overflow-hidden + border-radius creates a stacking context that forces
          paint-time clipping on every WebGL frame. clip-path is applied by the
          compositor at layer-merge time — no paint involvement. */}
      <div
        ref={containerRef}
        className="absolute"
        style={{ left: '0%', top: '10.31%', width: '89.69%', aspectRatio: '1', clipPath: 'circle(50%)' }}
      >
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Gradient overlay — translateZ(0) promotes it to its own compositor layer.
            As a static element it is cached once and never repainted, even as the
            WebGL canvas beneath redraws every frame. */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            transform: 'translateZ(0)',
            background: `
              radial-gradient(circle, rgba(8,8,8,0) 40%, rgba(8,8,8,0.4) 60%, rgba(8,8,8,0.8) 70%, rgba(8,8,8,0) 71%),
              radial-gradient(circle, rgba(16,16,16,0) 0%, rgba(16,16,16,0) 40%, rgba(16,16,16,0.6) 70%, rgba(16,16,16,0) 71%),
              linear-gradient(245deg, rgba(8,9,10,0) 20%, rgba(8,9,10,0.4) 60%, rgba(8,9,10,1) 80%, rgba(8,9,10,1) 100%)
            `,
          }}
        />
      </div>
    </div>
  );
});

export default GlobeCanvas;
