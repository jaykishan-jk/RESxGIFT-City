import { memo, useRef, useCallback, useLayoutEffect, useState } from 'react';
import gsap from 'gsap';
import logoSrc from '../../assets/RES Logo White.png';
import { IconMenu, IconClose, IconArrowRedirect, IconCallFill } from './icons';
import NavOpenGroup from './NavOpenGroup';

// ── Shared marquee helper ─────────────────────────────────────────────────────
// Creates enter/leave handlers for a text-swap marquee.
// clipRef : ref to visible viewport container
// duration: seconds for one full pass
// gap     : px gap between copy A's start and copy B's start position
const makeMarqueeHandlers = (clipRef, textRef, scrollARef, scrollBRef, duration = 2.6, gap = 20) => {
  let FROM_X   = 0;
  let TO_X     = 0;
  let hovering = false;
  const anims  = [];

  const onEnter = () => {
    hovering = true;

    const clipW   = clipRef.current?.getBoundingClientRect().width || 0;
    const scrollW = scrollARef.current?.getBoundingClientRect().width || 0;

    FROM_X = clipW + 8;
    TO_X   = -[(scrollW-clipW)+clipW];

    // Derive offset from desired spatial gap:
    // When B fires, A should be exactly (scrollW + gap)px ahead of FROM_X.
    // speed = totalDistance / duration  →  offset = (scrollW + gap) / speed
    const totalDistance  = FROM_X - TO_X;
    const dynamicOffset  = (scrollW + gap) * duration / totalDistance;

    gsap.to(textRef.current, { opacity: 0, duration: 0.15 });
    gsap.set([scrollARef.current, scrollBRef.current], { x: FROM_X });

    // loopWait: how long A idles after finishing before the next cycle starts.
    // We want A(loop2) to appear exactly when B(loop1) is (scrollW + gap) px
    // behind it — i.e. the same spatial gap as between A and B within a cycle.
    // B(loop1) reaches that position at t = 2 × dynamicOffset from A's start,
    // so A must wait:  loopWait = 2 × dynamicOffset - duration
    const loopWait = 2 * dynamicOffset - duration;

    const runA = () => {
      if (!hovering) return;
      gsap.set(scrollARef.current, { x: FROM_X });
      anims.push(gsap.to(scrollARef.current, { x: TO_X, duration, ease: 'linear', onComplete: () => {
        anims.push(gsap.delayedCall(loopWait, () => {
          runA();
          anims.push(gsap.delayedCall(dynamicOffset, runB));
        }));
      }}));
    };
    const runB = () => {
      if (!hovering) return;
      gsap.set(scrollBRef.current, { x: FROM_X });
      anims.push(gsap.to(scrollBRef.current, { x: TO_X, duration, ease: 'linear' }));
    };

    // Initial launch
    runA();
    anims.push(gsap.delayedCall(dynamicOffset, runB));
  };

  const onLeave = () => {
    hovering = false;
    anims.forEach(a => a.kill());
    anims.length = 0;
    gsap.set([scrollARef.current, scrollBRef.current], { x: FROM_X });
    gsap.to(textRef.current, { opacity: 1, duration: 0.2 });
  };

  return { onEnter, onLeave };
};

// ── Dynamic text width helper ────────────────────────────────────────────────
// Uses the Range API on the text node to get the true rendered content width,
// independent of the element's own dimensions (works with absolute/inset-0).
const measureLabelWidth = (element) => {
  if (!element) return 0;
  const textNode = element.firstChild;
  if (!textNode) return 0;
  const range = document.createRange();
  range.selectNode(textNode);
  return range.getBoundingClientRect().width;
};

const SPAN_CLS = "absolute top-0 bottom-0 flex items-center pointer-events-none whitespace-nowrap text-white text-[16px] leading-6 font-['Google_Sans',sans-serif]";

const Navbar = memo(function Navbar({ logoRef, navItemsRef }) {
  const [isOpen, setIsOpen]       = useState(false);
  const [panelMounted, setPanelMounted] = useState(false); // stays true during exit anim
  const headerRef = useRef(null);
  const backdropRef = useRef(null);

  // ── Menu refs ──────────────────────────────────────────────────────────────
  const menuClipRef    = useRef(null);
  const menuTextRef    = useRef(null);
  const menuScrollARef = useRef(null);
  const menuScrollBRef = useRef(null);

  // ── RES Mngmnt refs ────────────────────────────────────────────────────────
  const resClipRef    = useRef(null);
  const resTextRef    = useRef(null);
  const resScrollARef = useRef(null);
  const resScrollBRef = useRef(null);

  // ── Contact refs ───────────────────────────────────────────────────────────
  const contactBtnRef     = useRef(null);
  const contactIconRef    = useRef(null);
  const contactClipRef    = useRef(null);
  const contactTextRef    = useRef(null);
  const contactScrollARef = useRef(null);
  const contactScrollBRef = useRef(null);

  // ── Dynamic width measurement ──────────────────────────────────────────────
  // useLayoutEffect fires synchronously after DOM mutations but before paint —
  // no flash. Re-runs after fonts.ready for custom-font accuracy.
  // Also re-runs on isOpen change so the menu clip width re-measures when the
  // label swaps between "Menu" and "Close".
  useLayoutEffect(() => {
    const applyLabelWidth = (clipRef, textRef, scrollARef, scrollBRef) => {
      const w = measureLabelWidth(textRef.current);
      if (!w || !clipRef.current) return;
      clipRef.current.style.width = `${w}px`;
      gsap.set([scrollARef.current, scrollBRef.current], { x: w });
    };

    const applyContactWidth = () => {
      if (!contactBtnRef.current || !contactClipRef.current) return;
      const w = contactBtnRef.current.getBoundingClientRect().width;
      contactClipRef.current.style.width = `${w}px`;
      gsap.set([contactScrollARef.current, contactScrollBRef.current], { x: w });
    };

    const measureAll = () => {
      applyLabelWidth(menuClipRef, menuTextRef, menuScrollARef, menuScrollBRef);
      applyLabelWidth(resClipRef, resTextRef, resScrollARef, resScrollBRef);
      applyContactWidth();
    };

    measureAll();
    // Re-measure once custom fonts (e.g. Google Sans) are fully loaded
    document.fonts?.ready.then(measureAll);
  }, [isOpen]);

  // ── Menu handlers ──────────────────────────────────────────────────────────
  const menuHandlers = makeMarqueeHandlers(
    menuClipRef, menuTextRef, menuScrollARef, menuScrollBRef, 2.5,
  );
  const handleMenuEnter = useCallback(menuHandlers.onEnter, []);
  const handleMenuLeave = useCallback(menuHandlers.onLeave, []);

  // ── RES Mngmnt handlers ────────────────────────────────────────────────────
  const resHandlers = makeMarqueeHandlers(
    resClipRef, resTextRef, resScrollARef, resScrollBRef, 3.2,
  );
  const handleResEnter = useCallback(resHandlers.onEnter, []);
  const handleResLeave = useCallback(resHandlers.onLeave, []);

  // ── Contact handlers ───────────────────────────────────────────────────────
  const contactHandlers = makeMarqueeHandlers(
    contactClipRef, contactTextRef, contactScrollARef, contactScrollBRef, 2.2,
  );

  const handleContactEnter = useCallback(() => {
    gsap.to(contactBtnRef.current,  { borderColor: '#ffffff', duration: 0.3 });
    gsap.to(contactIconRef.current, { opacity: 0, duration: 0.15 });
    contactHandlers.onEnter();
  }, []);

  const handleContactLeave = useCallback(() => {
    contactHandlers.onLeave();
    gsap.to(contactBtnRef.current,  { borderColor: '#333333', duration: 0.3 });
    gsap.to(contactIconRef.current, { opacity: 1, duration: 0.2 });
  }, []);

  // ── Toggle ─────────────────────────────────────────────────────────────────
  // Backdrop animation — driven by effect so it never re-fires on re-renders
  useLayoutEffect(() => {
    if (!backdropRef.current) return;
    if (isOpen) {
      gsap.fromTo(backdropRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.65, ease: 'power1.inOut' }
      );
    } else {
      gsap.to(backdropRef.current,
        { opacity: 0, duration: 0.45, ease: 'power1.inOut' }
      );
    }
  }, [isOpen]);

  // Called by NavOpenGroup when its exit animation finishes
  const handlePanelClosed = useCallback(() => {
    setPanelMounted(false);
  }, []);

  const handleMenuClick = useCallback(() => {
    handleMenuLeave();
    setIsOpen(prev => {
      const opening = !prev;
      if (opening) {
        // Mount panel first, then isOpen flip triggers entrance anim
        setPanelMounted(true);
        // Shadow fades in with the expansion
        if (headerRef.current) {
          gsap.fromTo(
            headerRef.current,
            { boxShadow: '0 12px 40px 0 rgba(250,250,250,0)' },
            { boxShadow: '0 12px 40px 0 rgba(250,250,250,0.10)', duration: 0.8, ease: 'power1.inOut' },
          );
        }
      } else {
        // Shadow fades out in sync with the collapse
        if (headerRef.current) {
          gsap.to(headerRef.current, {
            boxShadow: '0 12px 40px 0 rgba(250,250,250,0)',
            duration: 0.45, ease: 'power1.inOut',
          });
        }
      }
      return opening;
    });
  }, [handleMenuLeave]);

  return (
    <>
      {/* Backdrop — fades in on open, fades out on close */}
      {panelMounted && (
        <div
          ref={el => { backdropRef.current = el; }}
          className="fixed inset-0 z-[9998] bg-black/50"
          aria-hidden="true"
          onClick={handleMenuClick}
        />
      )}

      <header
        ref={headerRef}
        className={`absolute top-0 left-0 right-0 z-[9999] bg-[#08090a]/80 backdrop-blur-[12px] px-5 md:px-20 flex flex-col${panelMounted ? ' h-screen lg:h-auto' : ''}`}
        role="banner"
      >
      {/* ── NavDefaultGroup ── */}
      <div className="flex items-center gap-5 py-6 md:py-10">

        {/* Logo */}
        <div className="flex-1" ref={logoRef}>
          <a href="/" aria-label="GIFT City home">
            <img
              src={logoSrc}
              alt="RES Management"
              className="w-auto object-contain"
              style={{ height: 'clamp(32px, 4.44vw, 48px)' }}
              fetchpriority="high"
            />
          </a>
        </div>

        {/* Navigation */}
        <nav className="flex flex-1 items-center gap-5" aria-label="Primary navigation">

          {/* Menu — always visible, icon-only below lg */}
          <div className="flex flex-1 items-center justify-end lg:justify-start gap-5">
            <button
              ref={el => { navItemsRef.current[0] = el; }}
              className="group flex items-center gap-3 text-[#ccc] text-[16px] leading-6 font-['Google_Sans',sans-serif] p-[14px] lg:p-0"
              aria-label={isOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isOpen}
              onClick={handleMenuClick}
              onMouseEnter={isOpen ? undefined : handleMenuEnter}
              onMouseLeave={isOpen ? undefined : handleMenuLeave}
            >
              {/* Icon swaps between hamburger and close */}
              {isOpen
                ? <IconClose className="w-5 h-5 shrink-0 text-[#ccc] group-hover:text-white transition-colors" />
                : <IconMenu  className="w-5 h-5 shrink-0 text-[#ccc] lg:text-[#333] group-hover:text-[#fafafa] transition-colors" />
              }

              {/* Clip container — overflow-hidden to the width of "Menu"/"Close" text */}
              <div
                ref={menuClipRef}
                className="relative hidden lg:block overflow-hidden"
                style={{ height: '24px' }}
              >
                {/* Original text */}
                <span
                  ref={menuTextRef}
                  className={`absolute inset-0 flex items-center transition-colors whitespace-nowrap ${isOpen ? 'text-[#ccc] group-hover:text-white' : 'text-[#ccc] group-hover:text-white'}`}
                >
                  {isOpen ? 'Close' : 'Menu'}
                </span>

                {/* Scrolling copy A */}
                <span ref={menuScrollARef} className={SPAN_CLS} aria-hidden="true">
                  {isOpen ? 'click to close' : 'click to open'}
                </span>

                {/* Scrolling copy B */}
                <span ref={menuScrollBRef} className={SPAN_CLS} aria-hidden="true">
                  {isOpen ? 'click to close' : 'click to open'}
                </span>
              </div>
            </button>
          </div>

          {/* RES Mngmnt — hidden below lg */}
          <div className={`${isOpen ? 'hidden' : 'hidden lg:flex'} flex-1 items-center justify-start gap-5`}>
            <a
              ref={el => { navItemsRef.current[1] = el; }}
              href="https://www.resmanagement.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 text-[#ccc] text-[16px] leading-6 font-['Google_Sans',sans-serif]"
              aria-label="View RES Management website"
              onMouseEnter={handleResEnter}
              onMouseLeave={handleResLeave}
            >
              {/* Clip container — overflow-hidden to the width of "RES Mngmnt" text */}
              <div
                ref={resClipRef}
                className="relative overflow-hidden"
                style={{ height: '24px' }}
              >
                {/* Original text */}
                <span
                  ref={resTextRef}
                  className="absolute inset-0 flex items-center text-[#ccc] group-hover:text-white transition-colors whitespace-nowrap"
                >
                  RES Mngmnt
                </span>

                {/* Scrolling copy A */}
                <span ref={resScrollARef} className={SPAN_CLS} aria-hidden="true">
                  resmanagement.in
                </span>

                {/* Scrolling copy B */}
                <span ref={resScrollBRef} className={SPAN_CLS} aria-hidden="true">
                  resmanagement.in
                </span>
              </div>

              {/* Icon keeps existing hover effect via CSS group */}
              <IconArrowRedirect className="w-5 h-5 shrink-0 text-[#333] group-hover:text-[#fafafa] transition-colors" />
            </a>
          </div>

          {/* Contact — hidden below lg */}
          <div className="hidden lg:flex flex-1 items-center justify-end">
            <button
              ref={el => { navItemsRef.current[2] = el; contactBtnRef.current = el; }}
              className="relative flex items-center justify-center w-12 h-12 bg-[#08090a] border border-[#333] rounded-[40px] overflow-hidden"
              onMouseEnter={handleContactEnter}
              onMouseLeave={handleContactLeave}
              aria-label="Contact us"
            >
              {/* Icon — fades out on hover */}
              <div ref={contactIconRef} className="absolute inset-0 flex items-center justify-center">
                <IconCallFill className="w-5 h-5 text-[#ccc]" />
              </div>

              {/* Clip container for "contact us" marquee */}
              <div
                ref={contactClipRef}
                className="relative overflow-hidden"
                style={{ height: '24px' }}
              >
                {/* Scrolling copy A */}
                <span ref={contactScrollARef} className={SPAN_CLS} aria-hidden="true">
                  contact us
                </span>

                {/* Scrolling copy B */}
                <span ref={contactScrollBRef} className={SPAN_CLS} aria-hidden="true">
                  contact us
                </span>
              </div>
            </button>
          </div>

        </nav>
      </div>

      {/* ── NavOpenGroup — kept mounted during exit for reverse animation ── */}
      {panelMounted && (
        <div className="flex-1 lg:flex-none overflow-y-auto">
          <NavOpenGroup isOpen={isOpen} onClosed={handlePanelClosed} />
        </div>
      )}
    </header>
    </>
  );
});

export default Navbar;
