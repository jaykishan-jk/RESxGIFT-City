import { useEffect, useRef, lazy, Suspense } from 'react';
import gsap from 'gsap';

import Navbar     from './Navbar';
import Headline   from './Headline';
import ExploreCTA from './ExploreCTA';
import HeroFooter from './Footer';

// GlobeCanvas is Three.js (~600KB) — lazy-loaded so it never blocks initial paint.
const GlobeCanvas = lazy(() => import('../GlobeCanvas'));

export default function HeroSection() {
  const sectionRef       = useRef(null);
  const globeRef         = useRef(null);
  const logoRef          = useRef(null);
  const navItemsRef      = useRef([]);
  const headlineGroupRef = useRef(null); // <h1> — one compositor layer covers all 4 lines
  const linesRef         = useRef([]);   // individual <span>s — still stagger-animated
  const ctaRef           = useRef(null);
  const labelsRef        = useRef(null);
  const bottomRef        = useRef(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const visibleNavItems = navItemsRef.current.filter(Boolean);

    // will-change targets — headline lines collapsed to one group ref (h1 element).
    // Previously 4 individual line refs = 4 compositor layers for the headline.
    // Now headlineGroupRef = 1 layer; GSAP still staggers individual spans within it.
    const willChangeTargets = [
      globeRef.current,
      logoRef.current,
      ...visibleNavItems,
      headlineGroupRef.current,
      ctaRef.current,
      labelsRef.current,
      bottomRef.current,
    ].filter(Boolean);

    // Set initial invisible states before observer fires
    gsap.set(globeRef.current,       { opacity: 0, scale: 0.9, transformOrigin: 'center center' });
    gsap.set(logoRef.current,        { opacity: 0, y: -24 });
    gsap.set(linesRef.current,       { opacity: 0, y: 40 });
    gsap.set(ctaRef.current,         { opacity: 0, y: 20 });
    gsap.set(labelsRef.current,      { opacity: 0 });
    gsap.set(bottomRef.current,      { opacity: 0, y: 20 });
    gsap.set(visibleNavItems,        { opacity: 0, y: -16 });

    let ctx;

    // ── IntersectionObserver ──────────────────────────────────────────────────
    // Timeline fires only when section enters viewport. Disconnects after first
    // fire — hero entrance only plays once.
    const observer = new IntersectionObserver(
      (entries, obs) => {
        if (!entries[0].isIntersecting) return;
        obs.disconnect();

        ctx = gsap.context(() => {
          // Promote to compositor layers just before animation starts.
          // Cleaned up in onComplete so GPU memory is released after entrance.
          gsap.set(willChangeTargets, { willChange: 'transform, opacity' });

          const tl = gsap.timeline({
            defaults: { ease: 'power3.out' },
            onComplete: () => gsap.set(willChangeTargets, { willChange: 'auto' }),
          });

          tl
            .to(globeRef.current,    { opacity: 1, scale: 1, duration: 1.8 }, 0)
            .to(logoRef.current,     { opacity: 1, y: 0, duration: 0.7 }, 0.3)
            .to(visibleNavItems,     { opacity: 1, y: 0, duration: 0.5, stagger: 0.1 }, 0.5)
            .to(linesRef.current,    { opacity: 1, y: 0, duration: 0.65, stagger: 0.13 }, 0.85)
            .to(ctaRef.current,      { opacity: 1, y: 0, duration: 0.55 }, 1.45)
            .to(labelsRef.current,   { opacity: 1, duration: 0.5 }, 1.6)
            .to(bottomRef.current,   { opacity: 1, y: 0, duration: 0.6 }, 1.7);
        });
      },
      { threshold: 0.1 },
    );

    observer.observe(section);

    return () => {
      observer.disconnect();
      ctx?.revert();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen flex flex-col bg-[#08090a] overflow-hidden"
      aria-label="GIFT City Hero"
    >
      <Suspense fallback={null}>
        <GlobeCanvas ref={globeRef} />
      </Suspense>

      <Navbar logoRef={logoRef} navItemsRef={navItemsRef} />

      <div className="relative z-10 flex flex-1 items-center px-5 md:px-20">
        <div className="hidden lg:block shrink-0 w-[45.3vw] max-w-[870px]" aria-hidden="true" />
        <div className="flex flex-col gap-12 lg:gap-16 w-full lg:flex-1">
          <Headline groupRef={headlineGroupRef} linesRef={linesRef} />
          <ExploreCTA ctaRef={ctaRef} />
        </div>
      </div>

      <HeroFooter labelsRef={labelsRef} bottomRef={bottomRef} />
    </section>
  );
}
