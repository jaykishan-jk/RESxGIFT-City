import { memo } from 'react';
import logoSrc from '../../assets/RES Logo White.png';
import { IconMenu, IconPlus, IconCall } from './icons';

const Navbar = memo(function Navbar({ logoRef, navItemsRef }) {
  return (
    <header
      className="relative z-20 flex items-center gap-5 px-5 py-6 md:px-20 md:py-10"
      role="banner"
    >
      {/* Logo — ref and flex-1 moved directly onto <a>, removes one wrapper div.
          fetchpriority="high" tells the browser to fetch the image with high
          priority during initial load, eliminating the flash-of-missing-logo
          without needing a JS-injected <link rel="preload">. */}
      <a href="/" className="flex-1" ref={logoRef} aria-label="GIFT City home">
        <img
          src={logoSrc}
          alt="RES Management"
          className="w-auto object-contain"
          style={{ height: 'clamp(32px, 4.44vw, 48px)' }}
          fetchpriority="high"
        />
      </a>

      {/* Navigation */}
      <nav className="flex flex-1 items-center gap-5" aria-label="Primary navigation">

        {/* Menu — always visible, icon-only below lg */}
        <div className="flex flex-1 items-center justify-end gap-5">
          <button
            ref={el => { navItemsRef.current[0] = el; }}
            className="group flex items-center gap-2 text-[#ccc] text-[16px] leading-6 font-['Google_Sans',sans-serif] hover:text-white transition-colors p-[14px] lg:p-0"
            aria-label="Open menu"
          >
            <IconMenu className="w-5 h-5 shrink-0 text-[#ccc] lg:text-[#333] group-hover:text-[#fafafa] transition-colors" />
            <span className="hidden lg:inline">Menu</span>
          </button>
        </div>

        {/* Properties — hidden below lg */}
        <div className="hidden lg:flex flex-1 items-center justify-end gap-5">
          <button
            ref={el => { navItemsRef.current[1] = el; }}
            className="group flex items-center gap-2 text-[#ccc] text-[16px] leading-6 font-['Google_Sans',sans-serif] hover:text-white transition-colors"
            aria-label="View properties"
          >
            <span>Properties</span>
            <IconPlus className="w-5 h-5 shrink-0 text-[#333] group-hover:text-[#fafafa] transition-colors" />
          </button>
        </div>

        {/* Contact — hidden below lg */}
        <div className="hidden lg:flex flex-1 items-center justify-end">
          <button
            ref={el => { navItemsRef.current[2] = el; }}
            className="group flex items-center justify-center p-[14px] bg-[#08090a] border border-[#333] rounded-[40px] hover:bg-[#333] transition-all"
            aria-label="Contact us"
          >
            <IconCall className="w-5 h-5 text-[#ccc] group-hover:text-[#fafafa] transition-colors" />
          </button>
        </div>

      </nav>
    </header>
  );
});

export default Navbar;
