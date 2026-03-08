import { memo, useRef, useLayoutEffect } from 'react';
import gsap from 'gsap';

// --- Menu / Close -------------------------------------------------------------
export const IconMenu = memo(function IconMenu({ className }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true" className={className}>
      <path d="M2 10H18" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M2 15H18" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M2 5H18"  stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  );
});

export const IconClose = memo(function IconClose({ className }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true" className={className}>
      <path d="M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M5 5L15 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
});

// Animated icon - morphs between IconMenu.svg and IconClose.svg shapes.
//
// TWO-LAYER APPROACH: position and rotation are on completely separate <g>
// elements so they never interfere with each other's transform origin.
//
//   Outer <g> (posRef)  -->  y translation ONLY  (slides line to its row)
//   Inner <g> (rotRef)  -->  rotation ONLY        (spins around own centre)
//
// All three lines are drawn at y=10 (SVG centre).
// Menu state: outer g offsets top to y=5, bot to y=15.
// Close state: outer y->0 (lines meet at centre), inner rotates +-45 deg.
//
// Because rotation lives on the inner g, svgOrigin:'10 10' always refers to
// the centre of that untranslated element - the pivot is always perfect.
export const IconMenuAnimated = memo(function IconMenuAnimated({ className, isOpen }) {
  const topPosRef  = useRef(null);
  const botPosRef  = useRef(null);
  const topRotRef  = useRef(null);
  const midRotRef  = useRef(null);
  const botRotRef  = useRef(null);
  const mountedRef = useRef(false);

  // On mount: offset top/bot lines to menu positions (no animation)
  useLayoutEffect(() => {
    if (!topPosRef.current || !botPosRef.current) return;
    gsap.set(topPosRef.current, { y: -5 });
    gsap.set(botPosRef.current, { y:  5 });
  }, []);

  // Animate on every isOpen toggle - skip the very first render
  useLayoutEffect(() => {
    const topPos = topPosRef.current;
    const botPos = botPosRef.current;
    const topRot = topRotRef.current;
    const midRot = midRotRef.current;
    const botRot = botRotRef.current;
    if (!topPos || !botPos || !topRot || !midRot || !botRot) return;
    if (!mountedRef.current) { mountedRef.current = true; return; }

    // Kill any running tweens so rapid clicks never leave a stale state
    gsap.killTweensOf([topPos, botPos, topRot, midRot, botRot]);

    if (isOpen) {
      // Menu -> Close
      // Outer: slide both lines to centre (y=10)
      gsap.to(topPos, { y: 0, duration: 0.55, ease: 'power1.inOut' });
      gsap.to(botPos, { y: 0, duration: 0.55, ease: 'power1.inOut' });
      // Inner: rotate around own midpoint - 360 over-spin + 45 deg landing
      gsap.to(topRot, { rotation:  -405, svgOrigin: '10 10', duration: 0.55, ease: 'power1.inOut' });
      gsap.to(midRot, { opacity: 0,                          duration: 0.18, ease: 'power1.in'   });
      gsap.to(botRot, { rotation:  -315, svgOrigin: '10 10', duration: 0.55, ease: 'power1.inOut' });
    } else {
      // Close -> Menu
      // Absolute values guarantee correct shape regardless of interruption
      gsap.to(topPos, { y: -5, duration: 0.35, ease: 'power1.inOut' });
      gsap.to(botPos, { y:  5, duration: 0.35, ease: 'power1.inOut' });
      gsap.to(topRot, { rotation: 0, svgOrigin: '10 10', duration: 0.35, ease: 'power1.inOut' });
      gsap.to(midRot, { opacity: 1,                       duration: 0.18, delay: 0.2, ease: 'power1.out' });
      gsap.to(botRot, { rotation: 0, svgOrigin: '10 10', duration: 0.35, ease: 'power1.inOut' });
    }
  }, [isOpen]);

  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true" className={className}>
      {/* Top line: outer=position, inner=rotation */}
      <g ref={topPosRef}>
        <g ref={topRotRef}><path d="M2 10H18" stroke="currentColor" strokeWidth="1.5"/></g>
      </g>
      {/* Mid line: fixed at y=10, only fades out */}
      <g ref={midRotRef}><path d="M2 10H18" stroke="currentColor" strokeWidth="1.5"/></g>
      {/* Bot line: outer=position, inner=rotation */}
      <g ref={botPosRef}>
        <g ref={botRotRef}><path d="M2 10H18" stroke="currentColor" strokeWidth="1.5"/></g>
      </g>
    </svg>
  );
});

// --- Utility ------------------------------------------------------------------
export const IconPlus = memo(function IconPlus({ className }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true" className={className}>
      <path d="M10 4V16M4 10H16" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  );
});

export const IconCall = memo(function IconCall({ className }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true" className={className}>
      <path d="M17.9995 15.064C17.9995 15.352 17.9354 15.648 17.7992 15.936C17.663 16.224 17.4867 16.496 17.2544 16.752C16.8618 17.184 16.4292 17.496 15.9404 17.696C15.4597 17.896 14.9389 18 14.3781 18C13.5609 18 12.6875 17.808 11.7662 17.416C10.8448 17.024 9.9234 16.496 9.01003 15.832C8.08865 15.16 7.21534 14.416 6.38209 13.592C5.55685 12.76 4.81173 11.888 4.14673 10.976C3.48975 10.064 2.96095 9.15204 2.57638 8.24804C2.1918 7.33604 1.99951 6.46404 1.99951 5.63204C1.99951 5.08804 2.09566 4.56804 2.28794 4.08804C2.48023 3.60004 2.78469 3.15204 3.20933 2.75204C3.7221 2.24804 4.28294 2.00004 4.87583 2.00004C5.10016 2.00004 5.3245 2.04804 5.5248 2.14404C5.73311 2.24004 5.91739 2.38404 6.06161 2.59204L7.92039 5.20804C8.06461 5.40804 8.16877 5.59204 8.24087 5.76804C8.31298 5.93604 8.35304 6.10404 8.35304 6.25604C8.35304 6.44804 8.29696 6.64004 8.18479 6.82404C8.08063 7.00804 7.92841 7.20004 7.73612 7.39204L7.1272 8.02404C7.03907 8.11204 6.99901 8.21604 6.99901 8.34404C6.99901 8.40804 7.00702 8.46404 7.02305 8.52804C7.04708 8.59204 7.07112 8.64004 7.08714 8.68804C7.23136 8.95204 7.47973 9.29604 7.83226 9.71204C8.1928 10.128 8.57738 10.552 8.994 10.976C9.42665 11.4 9.84328 11.792 10.2679 12.152C10.6845 12.504 11.0291 12.744 11.3015 12.888C11.3415 12.904 11.3896 12.928 11.4457 12.952C11.5098 12.976 11.5739 12.984 11.646 12.984C11.7822 12.984 11.8863 12.936 11.9745 12.848L12.5834 12.248C12.7837 12.048 12.976 11.896 13.1603 11.8C13.3445 11.688 13.5288 11.632 13.7291 11.632C13.8813 11.632 14.0416 11.664 14.2178 11.736C14.3941 11.808 14.5784 11.912 14.7787 12.048L17.4307 13.928C17.639 14.072 17.7832 14.24 17.8713 14.44C17.9514 14.64 17.9995 14.84 17.9995 15.064Z" stroke="currentColor" strokeMiterlimit="10"/>
    </svg>
  );
});

export const IconCallFill = memo(function IconCallFill({ className }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true" className={className}>
      <path d="M18 15.064C18 15.352 17.9359 15.648 17.7997 15.936C17.6635 16.224 17.4872 16.496 17.2549 16.752C16.8623 17.184 16.4296 17.496 15.9409 17.696C15.4602 17.896 14.9394 18 14.3786 18C13.5613 18 12.688 17.808 11.7666 17.416C10.8453 17.024 9.92389 16.496 9.01052 15.832C8.08913 15.16 7.21582 14.416 6.38257 13.592C5.55734 12.76 4.81222 11.888 4.14722 10.976C3.49024 10.064 2.96144 9.152 2.57687 8.248C2.19229 7.336 2 6.464 2 5.632C2 5.088 2.09614 4.568 2.28843 4.088C2.48072 3.6 2.78518 3.152 3.20981 2.752C3.72258 2.248 4.28343 2 4.87631 2C5.10065 2 5.32499 2.048 5.52529 2.144C5.7336 2.24 5.91788 2.384 6.06209 2.592L7.92088 5.208C8.0651 5.408 8.16925 5.592 8.24136 5.768C8.31347 5.936 8.35353 6.104 8.35353 6.256C8.35353 6.448 8.29745 6.64 8.18528 6.824C8.08112 7.008 7.92889 7.2 7.7366 7.392L7.12769 8.024C7.03956 8.112 6.9995 8.216 6.9995 8.344C6.9995 8.408 7.00751 8.464 7.02354 8.528C7.04757 8.592 7.07161 8.64 7.08763 8.688C7.23185 8.952 7.48022 9.296 7.83275 9.712C8.19329 10.128 8.57787 10.552 8.99449 10.976C9.42714 11.4 9.84377 11.792 10.2684 12.152C10.685 12.504 11.0295 12.744 11.302 12.888C11.342 12.904 11.3901 12.928 11.4462 12.952C11.5103 12.976 11.5744 12.984 11.6465 12.984C11.7827 12.984 11.8868 12.936 11.975 12.848L12.5839 12.248C12.7842 12.048 12.9765 11.896 13.1607 11.8C13.345 11.688 13.5293 11.632 13.7296 11.632C13.8818 11.632 14.0421 11.664 14.2183 11.736C14.3946 11.808 14.5789 11.912 14.7792 12.048L17.4311 13.928C17.6395 14.072 17.7837 14.24 17.8718 14.44C17.9519 14.64 18 14.84 18 15.064Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  );
});

export const IconArrowRedirect = memo(function IconArrowRedirect({ className }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true" className={className}>
      <path d="M5 15L15 5"    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M5 5L15 5V15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
});

export const IconArrowRight = memo(function IconArrowRight({ className }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M5 12H19"           stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 5L19 12L12 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
});

export const IconDownArrow = memo(function IconDownArrow({ className }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true" className={className}>
      <path d="M15.8926 9.89258L10 15.7851L4.10747 9.89258" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M10 6V15.7852"                                stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
});

// --- Social -------------------------------------------------------------------
export const IconWhatsApp = memo(function IconWhatsApp({ className }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true" className={className}>
      <path d="M10 18C14.4182 18 18 14.4182 18 10C18 5.58172 14.4182 2 10 2C5.58172 2 2 5.58172 2 10C2 11.1031 2.22326 12.1541 2.62706 13.1102C2.85022 13.6385 2.96181 13.9027 2.97562 14.1024C2.98944 14.3021 2.93067 14.5217 2.81314 14.961L2 18L5.03902 17.1869C5.4783 17.0694 5.69795 17.0106 5.89762 17.0244C6.09729 17.0382 6.36148 17.1498 6.88988 17.373C7.84596 17.7767 8.89688 18 10 18Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M7.27052 10.3018L7.96727 9.43649C8.26093 9.07177 8.62392 8.73224 8.6524 8.24661C8.65952 8.12396 8.57328 7.57326 8.40064 6.47189C8.33281 6.03905 7.92869 6 7.57866 6C7.12251 6 6.89444 6 6.66796 6.10345C6.38171 6.2342 6.08783 6.60185 6.02334 6.90987C5.97231 7.15357 6.01023 7.3215 6.08607 7.65735C6.40818 9.08384 7.16385 10.4926 8.33558 11.6644C9.50736 12.8362 10.9162 13.5919 12.3426 13.9139C12.6785 13.9898 12.8464 14.0277 13.0902 13.9767C13.3982 13.9122 13.7658 13.6183 13.8966 13.332C14 13.1055 14 12.8775 14 12.4214C14 12.0713 13.961 11.6672 13.5281 11.5994C12.4267 11.4267 11.8761 11.3405 11.7534 11.3476C11.2678 11.3761 10.9282 11.739 10.5635 12.0327L9.69816 12.7295" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  );
});

export const IconFacebook = memo(function IconFacebook({ className }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true" className={className}>
      <path fillRule="evenodd" clipRule="evenodd" d="M5.84416 8.66664C5.14576 8.66664 5 8.82016 5 9.55552V10.8889C5 11.6243 5.14576 11.7778 5.84416 11.7778H7.53246V17.1111C7.53246 17.8465 7.67822 18 8.37662 18H10.0649C10.7634 18 10.9091 17.8465 10.9091 17.1111V11.7778H12.8048C13.3345 11.7778 13.471 11.6694 13.6165 11.1331L13.9783 9.79976C14.2275 8.88112 14.0739 8.66664 13.1666 8.66664H10.9091V6.44445C10.9091 5.95353 11.287 5.55555 11.7532 5.55555H14.1559C14.8542 5.55555 15 5.40207 15 4.66666V2.88889C15 2.15348 14.8542 2 14.1559 2H11.7532C9.42214 2 7.53246 3.98985 7.53246 6.44445V8.66664H5.84416Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  );
});

export const IconInstagram = memo(function IconInstagram({ className }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true" className={className}>
      <path d="M2 10C2 6.22877 2 4.34315 3.17157 3.17157C4.34315 2 6.22877 2 10 2C13.7712 2 15.6568 2 16.8285 3.17157C18 4.34315 18 6.22877 18 10C18 13.7712 18 15.6568 16.8285 16.8285C15.6568 18 13.7712 18 10 18C6.22877 18 4.34315 18 3.17157 16.8285C2 15.6568 2 13.7712 2 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M14 10C14 12.2092 12.2092 14 10 14C7.79086 14 6 12.2092 6 10C6 7.79086 7.79086 6 10 6C12.2092 6 14 7.79086 14 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M15.5 5H14" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  );
});

export const IconX = memo(function IconX({ className }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true" className={className}>
      <path d="M2 18L8.70969 11.2903M8.70969 11.2903L2 2H6.44444L11.2903 8.70969M8.70969 11.2903L13.5556 18H18L11.2903 8.70969M18 2L11.2903 8.70969" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
});

export const IconLinkedIn = memo(function IconLinkedIn({ className }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true" className={className}>
      <path d="M13 7.08301C14.3261 7.08301 15.5979 7.56927 16.5355 8.43482C17.4732 9.30038 18 10.4743 18 11.6984V17.083H14.6667V11.6984C14.6667 11.2904 14.4911 10.8991 14.1785 10.6105C13.866 10.322 13.442 10.1599 13 10.1599C12.558 10.1599 12.134 10.322 11.8215 10.6105C11.5089 10.8991 11.3333 11.2904 11.3333 11.6984V17.083H8V11.6984C8 10.4743 8.52678 9.30038 9.46447 8.43482C10.4021 7.56927 11.6739 7.08301 13 7.08301Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M5 8.08301H2V17.083H5V8.08301Z"  stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M3.5 5.08301C4.32843 5.08301 5 4.41143 5 3.58301C5 2.75458 4.32843 2.08301 3.5 2.08301C2.67157 2.08301 2 2.75458 2 3.58301C2 4.41143 2.67157 5.08301 3.5 5.08301Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
});
