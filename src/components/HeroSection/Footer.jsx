import { memo } from 'react';

const LABEL_CLS = "font-['Space_Grotesk',sans-serif] font-medium text-[#666] text-[18px] leading-6 whitespace-nowrap";

const LocationLabels = memo(function LocationLabels({ labelsRef }) {
  return (
    <div ref={labelsRef} className="flex items-center gap-5 w-full">
      <div className="flex-1"><span className={LABEL_CLS}>GFT</span></div>
      <div className="flex-1"><span className={LABEL_CLS}>CT</span></div>
      <div className="flex-1" aria-hidden="true" />
      <div className="flex-1" aria-hidden="true" />
      <div className="flex-1" aria-hidden="true" />
      <div className="flex-1 flex justify-end"><span className={`${LABEL_CLS} text-right`}>GNDHNGR</span></div>
    </div>
  );
});

const BottomContent = memo(function BottomContent({ bottomRef }) {
  return (
    <div
      ref={bottomRef}
      className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 pt-8 md:pt-10 border-t border-[#191919] w-full bg-[#08090a]"
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
  );
});

// Footer combines both — single export keeps the import surface small
const HeroFooter = memo(function HeroFooter({ labelsRef, bottomRef }) {
  return (
    <footer
      className="hero-footer relative z-10 flex flex-col gap-5 px-5 pb-10 md:px-20 md:pb-12"
      aria-label="Site footer"
    >
      <div className="hidden md:block">
        <LocationLabels labelsRef={labelsRef} />
      </div>
      <BottomContent bottomRef={bottomRef} />
    </footer>
  );
});

export default HeroFooter;
