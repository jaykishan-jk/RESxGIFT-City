import { useEffect, useRef, useCallback, memo } from 'react';
import gsap from 'gsap';
import { IconDownArrow } from './icons';

const ExploreCTA = memo(function ExploreCTA({ ctaRef }) {
  const wrapARef  = useRef(null);
  const wrapBRef  = useRef(null);
  const whiteRef  = useRef(null); // static white overlay — only opacity animates on hover
  const loopTlRef = useRef(null);
  const activeRef = useRef('a');

  // ── Loop animation ────────────────────────────────────────────────────────
  // Only y (transform) is tweened — compositor-friendly, no repaints.
  useEffect(() => {
    const wA = wrapARef.current;
    const wB = wrapBRef.current;

    gsap.set(wA, { y: 0       });
    gsap.set(wB, { y: '-100%' });

    const tl = gsap.timeline({ repeat: -1 });
    tl
      .to({}, { duration: 0.9 })
      .to(wA, { y: '140%',  duration: 0.32, ease: 'power2.in' })
      .to(wB, { y: '0%',    duration: 0.32, ease: 'power2.out' }, '+=0.14')
      .add(() => { activeRef.current = 'b'; })
      .set(wA, { y: '-100%' })
      .to({}, { duration: 0.9 })
      .to(wB, { y: '140%',  duration: 0.32, ease: 'power2.in' })
      .to(wA, { y: '0%',    duration: 0.32, ease: 'power2.out' }, '+=0.14')
      .add(() => { activeRef.current = 'a'; })
      .set(wB, { y: '-100%' });

    loopTlRef.current = tl;
    return () => tl.kill();
  }, []);

  // ── Visibility observer — pause loop when CTA is off-screen ──────────────
  // Prevents wasted RAF frames when the element is scrolled out of view.
  useEffect(() => {
    const el = ctaRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const tl = loopTlRef.current;
        if (!tl) return;
        entry.isIntersecting ? tl.resume() : tl.pause();
      },
      { threshold: 0 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []); // ctaRef.current is stable after mount — no deps needed

  // ── Hover handlers — opacity only, zero SVG repaint ──────────────────────
  // Previously animated `color` on wrapper divs → SVG stroke repaint every frame.
  // Now: gray arrows are always gray (CSS class), a pre-colored white overlay
  // sits on top and is shown/hidden via opacity. Only opacity + y are animated,
  // both GPU-composited with no paint involvement.
  const handleEnter = useCallback(() => {
    loopTlRef.current?.pause();
    const active   = activeRef.current === 'a' ? wrapARef.current : wrapBRef.current;
    const inactive = activeRef.current === 'a' ? wrapBRef.current : wrapARef.current;
    gsap.to(active,         { y: 0,       duration: 0.2, ease: 'power2.out' });
    gsap.to(inactive,       { y: '-100%', duration: 0.15 });
    gsap.to(whiteRef.current, { opacity: 1, duration: 0.2, ease: 'power2.out' });
  }, []);

  const handleLeave = useCallback(() => {
    gsap.to(whiteRef.current, {
      opacity: 0,
      duration: 0.2,
      onComplete: () => loopTlRef.current?.resume(),
    });
  }, []);

  return (
    <div ref={ctaRef} className="flex items-center gap-3">
      <a
        href="#explore"
        className="flex flex-col items-stretch font-['Space_Grotesk',sans-serif] font-normal text-[#fafafa] text-[16px] md:text-[18px] leading-6"
        aria-label="Explore more about GIFT City"
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
      >
        <span>Explore More</span>
        <div className="mt-px h-px w-full bg-[#fafafa] opacity-60" aria-hidden="true" />
      </a>

      {/* Arrow clip container — overflow-hidden clips all three wrappers */}
      <div className="relative w-5 h-5 overflow-hidden shrink-0" aria-hidden="true">
        {/* Gray arrows — loop animation moves these via y transform only */}
        <div ref={wrapARef} className="absolute inset-0 text-[#666666]">
          <IconDownArrow className="w-5 h-5" />
        </div>
        <div ref={wrapBRef} className="absolute inset-0 text-[#666666]">
          <IconDownArrow className="w-5 h-5" />
        </div>
        {/* White overlay — always at y:0, only opacity changes on hover.
            Sits above gray arrows; compositor handles the fade with no repaint. */}
        <div ref={whiteRef} className="absolute inset-0 text-[#fafafa] opacity-0">
          <IconDownArrow className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
});

export default ExploreCTA;
