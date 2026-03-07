import { useEffect, useRef, lazy, Suspense } from 'react';
import gsap from 'gsap';

import Navbar     from './Navbar';
import Headline   from './Headline';
import ExploreCTA from './ExploreCTA';
import HeroFooter from './Footer';

import { dotsPromise } from '../../workers/globeDotsPreload';

const GlobeCanvas = lazy(() => import('../GlobeCanvas'));

const MIN_PRELOADER_MS = 600;

export default function HeroSection() {
  const sectionRef          = useRef(null);
  const globeRef            = useRef(null);
  const logoRef             = useRef(null);
  const navItemsRef         = useRef([]);
  const headlineGroupRef    = useRef(null);
  const linesRef            = useRef([]);
  const ctaRef              = useRef(null);
  const labelsRef           = useRef(null);
  const bottomRef           = useRef(null);
  const bottomWrapperRef    = useRef(null);
  const counterRef          = useRef(null);
  const counterContainerRef = useRef(null);
  const progressLineRef     = useRef(null);
  const progressBarRef      = useRef(null);
  const collapsibleCharsRef     = useRef([]);  // GIFT + GANDHINAGAR hidden chars
  const collapsibleCharsCityRef = useRef([]);  // CITY hidden chars — sequenced separately
  const cityRef             = useRef(null);   // CITY label — FLIP from flex to grid col-2
  const gndhngrRef          = useRef(null);
  const labelsRowRef        = useRef(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    let mounted     = true;
    const startTime = Date.now();
    const visibleNavItems = navItemsRef.current.filter(Boolean);

    // Initial states
    gsap.set(globeRef.current,  { scale: 0.9, transformOrigin: 'center center' });
    const logoOffset = window.innerWidth >= 768 ? 40 : 24;
    gsap.set(logoRef.current,   { y: logoOffset });
    gsap.set(visibleNavItems,   { opacity: 0, y: 16 });
    // Contact button: start with transparent border so the icon fades in first,
    // then the border ring is revealed separately after.
    if (navItemsRef.current[2]) {
      gsap.set(navItemsRef.current[2], { y: 16, borderColor: 'transparent' });
    }
    gsap.set(linesRef.current,  { opacity: 0, y: 40 });
    gsap.set(ctaRef.current,    { opacity: 0, y: 20 });
    gsap.set(bottomRef.current, { opacity: 0 });

    // Progress counter phase 1: 0 -> 90
    const progressObj = { val: 0 };
    const updateDisplay = () => {
      if (!mounted) return;
      const v = progressObj.val;
      const display = v >= 100 ? '100' : Math.floor(v).toString().padStart(2, '0');
      if (counterRef.current)      counterRef.current.textContent      = display;
      if (progressLineRef.current) progressLineRef.current.style.width = `${v}%`;
    };
    const phase1 = gsap.to(progressObj, {
      val: 65, duration: 3.8, ease: 'power1.out', onUpdate: updateDisplay,
    });

    // FLIP: CITY (col-2) and GNDHNGR (col-6) from flex positions to grid
    const applyGridAndFlip = () => {
      if (window.innerWidth < 768) return { dxGndhngr: 0, dxCity: 0 };
      const labelsRow = labelsRowRef.current;
      const gndhngr   = gndhngrRef.current;
      const city      = cityRef.current;
      if (!labelsRow || !gndhngr) return { dxGndhngr: 0, dxCity: 0 };

      const beforeGndhngr = gndhngr.getBoundingClientRect();
      const beforeCity    = city ? city.getBoundingClientRect() : null;

      labelsRow.style.display             = 'grid';
      labelsRow.style.gridTemplateColumns = 'repeat(6, 1fr)';
      labelsRow.style.gap                 = '20px';
      labelsRow.style.width               = '100%';
      gndhngr.style.gridColumn            = '6';
      gndhngr.style.textAlign             = 'right';

      const afterGndhngr = gndhngr.getBoundingClientRect();
      const dxGndhngr    = beforeGndhngr.left - afterGndhngr.left;
      gsap.set(gndhngr, { x: dxGndhngr });

      let dxCity = 0;
      if (city && beforeCity) {
        const afterCity = city.getBoundingClientRect();
        dxCity = beforeCity.left - afterCity.left;
        gsap.set(city, { x: dxCity });
      }

      return { dxGndhngr, dxCity };
    };

    // Transition timeline
    const fireTransition = () => {
      if (!mounted) return;

      const { dxGndhngr, dxCity } = applyGridAndFlip();

      const willChangeTargets = [
        globeRef.current,
        logoRef.current,
        ...visibleNavItems,
        headlineGroupRef.current,
        ctaRef.current,
        bottomRef.current,
        counterContainerRef.current,
        ...(dxGndhngr !== 0 && gndhngrRef.current ? [gndhngrRef.current] : []),
        ...(dxCity     !== 0 && cityRef.current    ? [cityRef.current]    : []),
      ].filter(Boolean);

      gsap.set(willChangeTargets, { willChange: 'transform, opacity' });

      const tl = gsap.timeline({
        defaults: { ease: 'power2.out' },
        onComplete: () => {
          if (mounted) gsap.set(willChangeTargets, { willChange: 'auto' });
        },
      });

      // [A] Counter exits — x + width collapse, labels expand naturally into freed space.
      // power2.inOut: eases in slowly, peak speed in middle, eases out — feels unhurried.
      tl.to(counterContainerRef.current, {
        x: 60, opacity: 0, width: 0, duration: 1.0, ease: 'power2.inOut',
        onComplete: () => {
          if (counterContainerRef.current)
            counterContainerRef.current.style.display = 'none';
        },
      }, 0);

      // [B] GIFT + GANDHINAGAR hidden chars collapse at t=0
      if (collapsibleCharsRef.current.length > 0) {
        tl.to(collapsibleCharsRef.current, {
          width: 0, duration: 0.8, ease: 'power2.inOut', stagger: 0.06,
        }, 0);
      }

      // [C] GNDHNGR FLIP to grid col-6 (desktop only)
      if (dxGndhngr !== 0 && gndhngrRef.current) {
        tl.to(gndhngrRef.current, { x: 0, duration: 1.1, ease: 'power2.inOut' }, 0.05);
      }

      // [C3] CITY FLIP to grid col-2 — slides right at same pace as GNDHNGR
      if (dxCity !== 0 && cityRef.current) {
        tl.to(cityRef.current, { x: 0, duration: 1.1, ease: 'power2.inOut' }, 0.05);
      }

      // [C2] CITY chars collapse after GNDHNGR starts moving.
      // Longer duration (1.3s vs 0.8s) slows each char collapse so it feels
      // proportional to GANDHINAGAR's longer travel distance.
      if (collapsibleCharsCityRef.current.length > 0) {
        tl.to(collapsibleCharsCityRef.current, {
          width: 0, duration: 1.3, ease: 'power2.inOut', stagger: 0.08,
        }, 0.2);
      }

      // [D] Logo slides up
      tl.to(logoRef.current, { y: 0, duration: 1.0 }, 0);

      // [E] Menu + Properties fade in from below
      // Contact button (index 2) is excluded here and animated separately below
      // with a longer duration to compensate for its hard-edged border snapping
      // into view perceptually faster than text.
      const navWithoutContact = visibleNavItems.filter((_, i) => i !== 2);
      const contactBtn        = visibleNavItems[2] ?? null;
      tl.to(navWithoutContact, { opacity: 1, y: 0, duration: 0.7, stagger: 0.12 }, 0.2);
      if (contactBtn) {
        // Stage 1: icon + background fade in and travel upward — matches Menu/Properties feel
        // Completes at t = 0.44 + 0.7 = 1.14s
        tl.to(contactBtn, { opacity: 1, y: 0, duration: 0.7, ease: 'linear' }, 0.38);
        // Stage 2: border fades in only after button has fully arrived (t=0.38 + 0.7 + 0.1 gap)
        tl.to(contactBtn, { borderColor: '#333333', duration: 0.7, ease: 'power2.out' }, 1.18);
      }

      // [F] Globe fades and scales in
      tl.to(globeRef.current, { opacity: 1, scale: 1, duration: 2.2 }, 0.15);

      // [G] Headline lines — start after counter width collapse finishes (t=1.0s)
      // so layout is fully settled before headline begins animating in.
      tl.to(linesRef.current, { opacity: 1, y: 0, duration: 0.85, stagger: 0.18 }, 1.1);

      // [H] CTA fades in after all headline lines have begun arriving
      tl.to(ctaRef.current, { opacity: 1, y: 0, duration: 0.7 }, 1.9);

      // [I] Progress bar gap shrinks 40px -> 20px
      tl.to(progressBarRef.current, { marginTop: 20, duration: 0.9 }, 0.5);

      // [J] BottomContent rises, pushing the border line upward
      tl.to(bottomWrapperRef.current, { height: 'auto', duration: 0.9 }, 0.5);
      tl.to(bottomRef.current,        { opacity: 1,     duration: 0.7 }, 0.7);
    };

    // Phase 2: 90 -> 100 then fire
    const runPhase2 = () => {
      if (!mounted) return;
      phase1.pause();
      gsap.to(progressObj, {
        val: 100, duration: 1.2, ease: 'power1.inOut',
        onUpdate:   updateDisplay,
        onComplete: () => gsap.delayedCall(0.2, fireTransition),
      });
    };

    dotsPromise
      .then(() => {
        const elapsed = Date.now() - startTime;
        setTimeout(runPhase2, Math.max(0, MIN_PRELOADER_MS - elapsed));
      })
      .catch(() => {
        const elapsed = Date.now() - startTime;
        setTimeout(runPhase2, Math.max(0, MIN_PRELOADER_MS - elapsed));
      });

    return () => {
      mounted = false;
      phase1.kill();
      gsap.killTweensOf(progressObj);
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

      <div className="relative z-10 flex flex-1 items-center px-5 md:px-20 pt-[80px] md:pt-[128px]">
        <div className="hidden lg:block shrink-0 w-[45.3vw] max-w-[870px]" aria-hidden="true" />
        <div className="flex flex-col gap-12 lg:gap-16 w-full lg:flex-1">
          <Headline groupRef={headlineGroupRef} linesRef={linesRef} />
          <ExploreCTA ctaRef={ctaRef} />
        </div>
      </div>

      <HeroFooter
        labelsRef={labelsRef}
        bottomRef={bottomRef}
        bottomWrapperRef={bottomWrapperRef}
        progressLineRef={progressLineRef}
        progressBarRef={progressBarRef}
        counterRef={counterRef}
        counterContainerRef={counterContainerRef}
        collapsibleCharsRef={collapsibleCharsRef}
        collapsibleCharsCityRef={collapsibleCharsCityRef}
        cityRef={cityRef}
        gndhngrRef={gndhngrRef}
        labelsRowRef={labelsRowRef}
      />
    </section>
  );
}
