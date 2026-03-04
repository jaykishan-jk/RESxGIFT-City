import { memo } from 'react';

// Static — module-level allocation, never reconstructed on re-render.
const LINES = [
  <>Connecting <span className="underline underline-offset-4 decoration-[#fafafa]">Global Capital to India&#39;s</span></>,
  <><span className="underline underline-offset-4 decoration-[#fafafa]">Financial Gateway</span> &mdash; <span className="text-[#666]">where</span> sovereign</>,
  <>strength, global standards, <span className="text-[#666]">and</span> future</>,
  <>ready infrastructure converge.</>,
];

// groupRef → <h1>: one compositor layer for all 4 lines.
// linesRef → individual <span>s: GSAP staggers opacity/y within the group layer.
const Headline = memo(function Headline({ groupRef, linesRef }) {
  return (
    <h1
      ref={groupRef}
      className="headline-fluid font-['Google_Sans',sans-serif] font-normal text-[#fafafa]"
    >
      {LINES.map((line, i) => (
        <span
          key={i}
          ref={el => { linesRef.current[i] = el; }}
          className="block whitespace-nowrap"
        >
          {line}
        </span>
      ))}
    </h1>
  );
});

export default Headline;
