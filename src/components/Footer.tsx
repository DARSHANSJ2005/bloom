export function Footer() {
  return (
    <footer className="site-footer" id="footer">
      <div className="f-logo" aria-label="Bloom by Kavi logo">
        <svg viewBox="0 0 80 80" width="72" height="72" className="overflow-visible">
          <circle
            id="fRing"
            cx="40"
            cy="40"
            r="37"
            fill="none"
            stroke="#111"
            strokeWidth="2.4"
            strokeDasharray="233"
            strokeDashoffset="233"
            transform="rotate(-90 40 40)"
          />
          <circle className="fdot" cx="22" cy="40" r="4.5" fill="#111" />
          <circle className="fdot" cx="40" cy="40" r="4.5" fill="#111" />
          <circle className="fdot" cx="58" cy="40" r="4.5" fill="#111" />
          <path
            id="fMark"
            d="M33 53 43 31 56 53"
            fill="none"
            stroke="#111"
            strokeWidth="10"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="60"
            strokeDashoffset="60"
          />
        </svg>
      </div>

      <nav className="f-links" aria-label="Footer navigation">
        <a href="#studio">3D Craft Studio</a>
        <a href="#stats">Craft Highlights</a>
        <a href="#loop">Custom Process</a>
        <a href="#cta">Send Enquiry</a>
      </nav>

      <div className="f-social">
        <a
          href="https://instagram.com/bloom_by_kavi06"
          target="_blank"
          rel="noreferrer"
          aria-label="Bloom by Kavi on Instagram"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1d240c] hover:underline"
        >
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
          </svg>
          <span>@bloom_by_kavi06</span>
        </a>
      </div>

      <p className="f-copy">
        © 2026 Bloom by Kavi · Handmade Bangles, DIY Kits &amp; Pipe Cleaner Crafts.
      </p>
    </footer>
  );
}
