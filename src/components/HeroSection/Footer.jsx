import { memo, useMemo } from 'react';

// ── Char splitting ─────────────────────────────────────────────────────────────
function getCharParts(full, hero) {
  let hi = 0;
  return [...full].map((char, fi) => {
    if (hi < hero.length && char === hero[hi]) { hi++; return { char, hidden: false, key: fi }; }
    return { char, hidden: true, key: fi };
  });
}

const SplitLabel = memo(function SplitLabel({ full, hero, labelRef, collapsibleCharsRef, className }) {
  const parts = useMemo(() => getCharParts(full, hero), [full, hero]);
  return (
    <span ref={labelRef} className={className}>
      {parts.map(({ char, hidden, key }) =>
        hidden ? (
          <span
            key={key}
            ref={el => {
              if (el && collapsibleCharsRef?.current && !collapsibleCharsRef.current.includes(el))
                collapsibleCharsRef.current.push(el);
            }}
            style={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'bottom' }}
          >
            {char}
          </span>
        ) : char
      )}
    </span>
  );
});

// ── Progress counter ───────────────────────────────────────────────────────────
// Typography from Figma: Space Grotesk 500, #666666
// Web:    number 240px / 180lh / -4%ls,  % 40px/40lh
// Mobile: number 160px / 120lh / -4%ls,  % 28px/28lh
const ProgressCounter = memo(function ProgressCounter({ counterRef, counterContainerRef }) {
  return (
    <div
      ref={counterContainerRef}
      className="flex items-end shrink-0 ml-auto overflow-hidden whitespace-nowrap"
      aria-hidden="true"
    >
      <span
        ref={counterRef}
        className="font-['Space_Grotesk',sans-serif] font-medium text-[#666]"
        style={{
          fontSize:      'clamp(160px, 12.5vw, 240px)',
          lineHeight:    'clamp(120px, 9.375vw, 180px)',
          letterSpacing: '-0.04em',
          display:       'block',
        }}
      >
        00
      </span>
      <span
        className="font-['Space_Grotesk',sans-serif] font-medium text-[#666]"
        style={{
          fontSize:      'clamp(28px, 2.08vw, 40px)',
          lineHeight:    '1',
          paddingBottom: '4px',
          display:       'block',
        }}
      >
        %
      </span>
    </div>
  );
});

// ── Location labels row ────────────────────────────────────────────────────────
// Mobile (<768px): labels hidden, counter visible alone at bottom-right.
// Desktop (≥768px): GIFT / CITY / GANDHINAGAR on left, counter on right.
const LABEL_CLS = "font-['Space_Grotesk',sans-serif] font-medium text-[#666] text-[18px] leading-6 whitespace-nowrap";

const LocationLabels = memo(function LocationLabels({
  labelsRef, labelsRowRef, gndhngrRef, cityRef,
  collapsibleCharsRef, collapsibleCharsCityRef,
  counterRef, counterContainerRef,
}) {
  return (
    // overflow-hidden clips the counter as it slides+shrinks rightward,
    // so the labels naturally expand into the freed space.
    <div ref={labelsRef} className="w-full flex items-end justify-between overflow-hidden">
      {/* Labels — hidden on mobile; flex row on preloader, switches to 6-col grid on transition */}
      <div ref={labelsRowRef} className="hidden md:flex items-end gap-5">
        <SplitLabel
          full="GIFT"        hero="GFT"
          collapsibleCharsRef={collapsibleCharsRef}
          className={LABEL_CLS}
        />
        {/* CITY has its own labelRef for FLIP animation during transition */}
        <SplitLabel
          full="CITY"        hero="CT"
          labelRef={cityRef}
          collapsibleCharsRef={collapsibleCharsCityRef}
          className={LABEL_CLS}
        />
        <SplitLabel
          full="GANDHINAGAR" hero="GNDHNGR"
          labelRef={gndhngrRef}
          collapsibleCharsRef={collapsibleCharsRef}
          className={LABEL_CLS}
        />
      </div>
      <ProgressCounter counterRef={counterRef} counterContainerRef={counterContainerRef} />
    </div>
  );
});

// ── Option B progress bar ──────────────────────────────────────────────────────
// Preloader gap: 40px (mt-10). Hero gap: 20px (mt-5).
// progressBarRef is animated by index.jsx from marginTop:40 → 20 during transition.
const ProgressBar = memo(function ProgressBar({ progressLineRef, progressBarRef }) {
  return (
    <div ref={progressBarRef} className="relative w-full h-px" style={{ marginTop: '40px' }}>
      <div className="absolute inset-0 bg-[#666666]" />
      <div
        ref={progressLineRef}
        className="absolute inset-y-0 left-0 bg-[#333333]"
        style={{ width: '0%' }}
      />
    </div>
  );
});

// ── Bottom content ─────────────────────────────────────────────────────────────
// Wrapped in a height:0 collapsible div (bottomWrapperRef) so it occupies NO
// vertical space during preloader. This keeps the progress bar at the true
// bottom and prevents headline/CTA from being pushed upward.
// GSAP animates the wrapper from height:0 → auto during the transition,
// creating the "content rising and pushing the border line up" effect.
const BottomContent = memo(function BottomContent({ bottomRef, bottomWrapperRef }) {
  return (
    <div ref={bottomWrapperRef} style={{ height: 0, overflow: 'hidden' }}>
      <div
        ref={bottomRef}
        className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 pt-8 md:pt-10 w-full bg-[#08090a]"
      >
        <p className="font-['Google_Sans',sans-serif] font-normal text-[#999] text-[14px] leading-6 md:text-[16px] max-w-full md:max-w-[722px]">
          India&#39;s first International Financial Services Centre, GIFT City is a sovereign financial
          jurisdiction uniting tax efficiency, regulatory clarity, and future-ready infrastructure to
          position global investors at the forefront of India&#39;s financial evolution.
        </p>
        <p className="font-['Space_Grotesk',sans-serif] font-normal text-[#999] text-[14px] leading-6 md:text-[16px] tracking-[0.64px] uppercase text-left md:text-right shrink-0 md:w-[277px]">
          Pioneer the<br />future of finance.
        </p>
      </div>
    </div>
  );
});

// ── HeroFooter ─────────────────────────────────────────────────────────────────
const HeroFooter = memo(function HeroFooter({
  labelsRef, bottomRef, bottomWrapperRef, progressLineRef, progressBarRef,
  counterRef, counterContainerRef,
  collapsibleCharsRef, collapsibleCharsCityRef, gndhngrRef, cityRef, labelsRowRef,
}) {
  return (
    <footer
      className="hero-footer relative z-10 flex flex-col px-5 pb-10 md:px-20 md:pb-12"
      aria-label="Site footer"
    >
      <LocationLabels
        labelsRef={labelsRef}
        labelsRowRef={labelsRowRef}
        gndhngrRef={gndhngrRef}
        collapsibleCharsRef={collapsibleCharsRef}
        collapsibleCharsCityRef={collapsibleCharsCityRef}
        cityRef={cityRef}
        counterRef={counterRef}
        counterContainerRef={counterContainerRef}
      />
      <ProgressBar progressLineRef={progressLineRef} progressBarRef={progressBarRef} />
      <BottomContent bottomRef={bottomRef} bottomWrapperRef={bottomWrapperRef} />
    </footer>
  );
});

export default HeroFooter;
