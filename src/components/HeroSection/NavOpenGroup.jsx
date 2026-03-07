import { memo, useRef, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { IconArrowRedirect, IconArrowRight, IconWhatsApp, IconFacebook, IconInstagram, IconX, IconLinkedIn } from './icons';

// ── Data ──────────────────────────────────────────────────────────────────────
const NAV_LINKS = [
  { label: 'About GIFT City',         href: '#about'      },
  { label: 'Why Invest',              href: '#why-invest' },
  { label: 'Why Move Here',           href: '#why-move'   },
  { label: 'The Engineering Marvels', href: '#marvels'    },
  { label: 'By The Numbers',          href: '#numbers'    },
];

const MOBILE_ONLY_LINKS = [
  { label: 'Contact Us',     href: '#contact',                        external: false },
  { label: 'RES Management', href: 'https://www.resmanagement.in/',   external: true  },
];

const CONTACT_ITEMS = [
  { text: 'info@resmanagement.in', href: 'mailto:info@resmanagement.in' },
  { text: '+91-9316156656',        href: 'tel:+919316156656'            },
  { text: '+91-9375924708',        href: 'tel:+919375924708'            },
  { text: '079-35967392',          href: 'tel:07935967392'             },
];

const SOCIALS = [
  { Icon: IconWhatsApp,  href: '#', label: 'WhatsApp'    },
  { Icon: IconFacebook,  href: '#', label: 'Facebook'    },
  { Icon: IconInstagram, href: '#', label: 'Instagram'   },
  { Icon: IconX,         href: '#', label: 'X (Twitter)' },
  { Icon: IconLinkedIn,  href: '#', label: 'LinkedIn'    },
];

const FONT = "font-['Google_Sans',sans-serif]";

// ── Component ─────────────────────────────────────────────────────────────────
// isOpen  : true = play entrance, false = play exit
// onClosed: called after exit animation finishes so parent can unmount
const NavOpenGroup = memo(function NavOpenGroup({ isOpen, onClosed }) {
  const wrapperRef    = useRef(null);
  const navLinksRef   = useRef([]);
  const leftColRef    = useRef(null);
  const newsletterRef = useRef(null);
  const tlRef         = useRef(null);   // keep timeline ref so we can reverse it

  useLayoutEffect(() => {
    const wrapper    = wrapperRef.current;
    const navLinks   = navLinksRef.current.filter(Boolean);
    const leftCol    = leftColRef.current;
    const newsletter = newsletterRef.current;
    if (!wrapper) return;

    // Kill any running timeline before starting a new one
    if (tlRef.current) tlRef.current.kill();

    if (isOpen) {
      // ── Entrance ────────────────────────────────────────────────────────
      gsap.set(wrapper,    { height: 0, overflow: 'hidden' });
      gsap.set(navLinks,   { opacity: 0, y: 16 });
      gsap.set(newsletter, { opacity: 0, y: 16 });
      if (leftCol) gsap.set(leftCol, { opacity: 0, y: 16 });

      const tl = gsap.timeline({ defaults: { ease: 'power1.inOut' } });

      tl.to(wrapper, {
        height: 'auto',
        duration: 0.8,
        ease: 'power1.inOut',
        onComplete: () => gsap.set(wrapper, { overflow: 'visible' }),
      }, 0);

      tl.to(navLinks, {
        opacity: 1, y: 0,
        duration: 0.6,
        stagger: 0.07,
      }, 0.2);

      if (leftCol) {
        tl.to(leftCol, { opacity: 1, y: 0, duration: 0.65 }, 0.28);
      }

      tl.to(newsletter, { opacity: 1, y: 0, duration: 0.6 }, 0.5);

      tlRef.current = tl;

    } else {
      // ── Exit — reverse of entrance, notably faster ───────────────────────
      gsap.set(wrapper, { overflow: 'hidden' });

      const tl = gsap.timeline({
        defaults: { ease: 'power1.inOut' },
        onComplete: () => { onClosed?.(); },
      });

      tl.to(newsletter, { opacity: 0, y: 16, duration: 0.25 }, 0);

      if (leftCol) {
        tl.to(leftCol, { opacity: 0, y: 16, duration: 0.22 }, 0.03);
      }

      tl.to([...navLinks].reverse(), {
        opacity: 0, y: 16,
        duration: 0.25,
        stagger: 0.03,
      }, 0.08);

      tl.to(wrapper, {
        height: 0,
        duration: 0.55,
        ease: 'power1.inOut',
      }, 0.1);

      tlRef.current = tl;
    }

    return () => { tlRef.current?.kill(); };
  }, [isOpen]);

  return (
    <div ref={wrapperRef}>
      <div className="flex gap-5 lg:pb-20">

        {/* ── LeftBottomGroup — desktop only ─────────────────────────────── */}
        <div ref={leftColRef} className="hidden lg:flex flex-col justify-end flex-1 gap-10">

          <p className={`text-[#999] text-[16px] leading-6 ${FONT}`}>
            525,<br />
            5th Floor, Shivalik Shilp,<br />
            Iscon Cross Road,<br />
            S.G.Highway, Ahmedabad
          </p>

          <div className="flex flex-col gap-4">
            <span className={`text-[#666] text-[16px] leading-6 ${FONT}`}>Reach us out</span>
            <div className="flex flex-col gap-2">
              {CONTACT_ITEMS.map(({ text, href }) => (
                <a key={text} href={href}
                  className={`self-start text-[#999] text-[16px] leading-6 ${FONT} hover:text-white transition-colors duration-200`}
                >
                  {text}
                </a>
              ))}
            </div>
          </div>

          <div className="flex gap-5">
            {SOCIALS.map(({ Icon, href, label }) => (
              <a key={label} href={href} aria-label={label}
                className="text-[#999] hover:text-white transition-colors duration-200"
              >
                <Icon className="w-5 h-5" />
              </a>
            ))}
          </div>

        </div>

        {/* ── RightBottomGroup ───────────────────────────────────────────── */}
        <div className="flex flex-col flex-1 gap-10">

          <div className="flex flex-col">
            {NAV_LINKS.map(({ label, href }, i) => (
              <a key={label} href={href}
                ref={el => { navLinksRef.current[i] = el; }}
                className={`h-10 flex items-center lg:pl-8 text-[#999] text-[16px] leading-6 ${FONT} hover:text-white transition-colors duration-200`}
              >
                {label}
              </a>
            ))}

            {MOBILE_ONLY_LINKS.map(({ label, href, external }, i) => (
              <a key={label} href={href}
                ref={el => { navLinksRef.current[NAV_LINKS.length + i] = el; }}
                target={external ? '_blank' : undefined}
                rel={external ? 'noopener noreferrer' : undefined}
                className={`lg:hidden h-10 flex items-center justify-between text-[#999] text-[16px] leading-6 ${FONT} hover:text-white transition-colors duration-200`}
              >
                {label}
                {external && <IconArrowRedirect className="w-5 h-5 shrink-0" />}
              </a>
            ))}
          </div>

          <div ref={newsletterRef} className="border-t border-[#333] lg:pl-8 pt-10 flex flex-col gap-5">
            <div>
              <p className={`text-[#fafafa] text-[24px] lg:text-[40px] leading-8 lg:leading-[56px] ${FONT}`}>
                Subscribe to
              </p>
              <p className={`text-[#fafafa] text-[24px] lg:text-[40px] leading-8 lg:leading-[56px] ${FONT}`}>
                our newsletter
              </p>
            </div>

            <div className="w-full lg:w-[560px] h-16 bg-[#08090a] border border-[#1c1c1c] rounded-xl px-5 flex items-center gap-2.5">
              <input type="email" placeholder="Your Email"
                className={`flex-1 bg-transparent text-[#666] text-[16px] leading-6 ${FONT} outline-none placeholder:text-[#666]`}
              />
              <button aria-label="Subscribe" className="shrink-0 text-white hover:opacity-70 transition-opacity">
                <IconArrowRight className="w-6 h-6" />
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
});

export default NavOpenGroup;
