import { useEffect, useRef, forwardRef } from 'react';
import * as THREE from 'three';

// dotsPromise was started in globeDotsPreload.js, which is imported synchronously
// by HeroSection/index.jsx at page-load time — before this lazy chunk even
// downloads. By the time useEffect runs here, the world-atlas fetch and dot
// computation are already in flight (or done). Module cache means both files
// share the exact same promise instance — no second worker, no second fetch.
import { dotsPromise } from '../workers/globeDotsPreload';

// ── Config ────────────────────────────────────────────────────────────────────
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

    // Halo pulse — driven by GPU via shared uTime uniform.
    // No per-frame CPU→GPU opacity upload.
    const haloDot = new THREE.Mesh(
      new THREE.SphereGeometry(0.026, 16, 16),
      new THREE.ShaderMaterial({
        uniforms: { uTime: waveU.uTime },
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
    let rafId;
    const clock = new THREE.Clock();
    const animate = () => {
      rafId = requestAnimationFrame(animate);
      waveU.uTime.value = clock.getElapsedTime();
      renderer.render(scene, camera);
    };
    animate();

    // ── Consume dot data ──────────────────────────────────────────────────────
    // dotsPromise was started at page-load time (see globeDotsPreload.js).
    // If the worker finished before this useEffect ran, .then() resolves in
    // the next microtask and dots appear on the first rendered frame.
    let mounted = true;
    dotsPromise
      .then(({ positions, colors }) => {
        if (!mounted) return;
        const geo3 = new THREE.BufferGeometry();
        geo3.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geo3.setAttribute('color',    new THREE.Float32BufferAttribute(colors, 3));
        group.add(new THREE.Points(geo3, new THREE.PointsMaterial({
          size: DOT_SIZE * 0.006, vertexColors: true, sizeAttenuation: true,
        })));
      })
      .catch(err => console.error('GlobeCanvas: dot worker error', err));

    // ── Cleanup ───────────────────────────────────────────────────────────────
    return () => {
      mounted = false;
      cancelAnimationFrame(rafId);
      ro.disconnect();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={ref}
      className="absolute right-0 top-1/2 -translate-y-1/2 lg:right-auto lg:left-[14%] lg:top-auto lg:bottom-0 lg:translate-y-0 transform-gpu w-[min(50.5vw,89.81vh)] aspect-square pointer-events-none select-none"
      style={{ opacity: 0 }}
      aria-hidden="true"
    >
      {/* Drop shadow — .globe-shadow keeps will-change:filter permanent so the
          blur never needs to promote/demote mid-animation */}
      <div
        className="globe-shadow absolute rounded-full"
        style={{
          left: '15.46%', top: '10.31%', width: '74.23%',
          aspectRatio: '1',
          background: '#191919',
          filter: 'blur(80px)',
        }}
      />

      {/* Canvas container — .globe-canvas-clip uses clip-path:circle() which
          is GPU-clipped and doesn't force a stacking context or repaint on
          every WebGL frame unlike overflow-hidden + border-radius */}
      <div
        ref={containerRef}
        className="globe-canvas-clip absolute"
        style={{ left: '0%', top: '10.31%', width: '89.69%', aspectRatio: '1' }}
      >
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Gradient overlay — translateZ(0) promotes to its own compositor
            layer so it's cached and never repainted as WebGL redraws beneath */}
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
