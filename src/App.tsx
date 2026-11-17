import { useCallback, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import {
  ACCORDION_STEPS,
  ASSETS,
  BRAND_STATS,
  CRAFT_CATEGORIES,
  CRAFT_PALETTES,
  type CraftCategoryId,
  type CraftPalette,
} from './constants/assets';
import { CraftStudio3D } from './components/CraftStudio3D';
import { EnquirySection } from './components/EnquirySection';
import { Footer } from './components/Footer';

gsap.registerPlugin(ScrollTrigger);

const HERO_GLASS_COORDS: Array<[number, number]> = [
  [3, 64],
  [3, 71],
  [6.5, 71],
  [10, 71],
  [3, 78],
  [-1, 70],
  [45.5, 76],
  [49, 80],
  [49, 76],
  [52.5, 76],
  [86, 58],
  [86, 67],
  [82, 76],
  [89.5, 76],
  [86, 84],
];

function splitWordsIntoSpans(root: HTMLElement) {
  if (root.dataset.splitDone === '1') return;
  root.dataset.splitDone = '1';

  const walk = (node: Node) => {
    const children = Array.from(node.childNodes);
    children.forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const text = child.textContent ?? '';
        const parts = text.split(/(\s+)/);
        const frag = document.createDocumentFragment();
        parts.forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) {
            frag.appendChild(document.createTextNode(part));
          } else {
            const span = document.createElement('span');
            span.className = 'w';
            span.textContent = part;
            frag.appendChild(span);
          }
        });
        node.replaceChild(frag, child);
      } else if (
        child.nodeType === Node.ELEMENT_NODE &&
        (child as HTMLElement).tagName !== 'BR'
      ) {
        walk(child);
      }
    });
  };

  walk(root);
}

export default function App() {
  const [showBackdrop, setShowBackdrop] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<CraftCategoryId>('bangles');
  const [selectedPalette, setSelectedPalette] = useState<CraftPalette>(CRAFT_PALETTES[0]);
  const [enquiryCategory, setEnquiryCategory] = useState<string>(
    CRAFT_CATEGORIES[0].formValue,
  );
  const [enquiryPalette, setEnquiryPalette] = useState<string>(CRAFT_PALETTES[0].label);
  const [activePanel, setActivePanel] = useState<number>(0);

  const lenisRef = useRef<Lenis | null>(null);
  const heroGlassRef = useRef<HTMLDivElement | null>(null);

  const scrollToSection = useCallback((selector: string) => {
    const target = document.querySelector(selector);
    if (!target) return;
    if (lenisRef.current) {
      lenisRef.current.scrollTo(target as HTMLElement, { duration: 1.4 });
    } else {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  const handleEnquirePiece = useCallback(
    (catId: CraftCategoryId, pal: CraftPalette) => {
      const cat = CRAFT_CATEGORIES.find((c) => c.id === catId);
      if (cat) setEnquiryCategory(cat.formValue);
      setEnquiryPalette(pal.label);
      scrollToSection('#cta');
    },
    [scrollToSection],
  );

  // Initialize split words, grid squares, glass squares, Lenis, intro timeline, and ScrollTriggers
  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = window.innerWidth <= 760;

    // 1. Split all .split headings into .w spans
    document.querySelectorAll<HTMLElement>('.split').forEach((el) => {
      splitWordsIntoSpans(el);
    });

    // 2. Generate twinkling .sq-field grid squares
    const sqAnimations: gsap.core.Tween[] = [];
    document.querySelectorAll<HTMLElement>('.sq-field').forEach((field) => {
      if (field.dataset.built === '1') return;
      field.dataset.built = '1';
      const count = parseInt(field.dataset.count || '16', 10);
      for (let i = 0; i < count; i++) {
        const sq = document.createElement('div');
        sq.className = 'grid-sq';
        const col = Math.floor(Math.random() * 30);
        const row = Math.floor(Math.random() * 6);
        sq.style.left = `${col * 48 - 10}px`;
        sq.style.top = `${row * 48 + 6}px`;
        field.appendChild(sq);

        if (!reduceMotion) {
          sqAnimations.push(
            gsap.fromTo(
              sq,
              { opacity: 0 },
              {
                opacity: 1,
                duration: 1.2,
                yoyo: true,
                repeat: -1,
                delay: Math.random() * 4,
                repeatDelay: Math.random() * 3,
                ease: 'sine.inOut',
              },
            ),
          );
        }
      }
    });

    // 3. Populate Hero frosted glass squares
    const heroGlass = heroGlassRef.current;
    if (heroGlass && heroGlass.dataset.built !== '1') {
      heroGlass.dataset.built = '1';
      HERO_GLASS_COORDS.forEach(([x, y], idx) => {
        if (isMobile && idx % 2 === 1) return;
        const sq = document.createElement('div');
        sq.className = 'glass';
        const isCenter = x > 40 && x < 60;
        const sz = isCenter ? 'clamp(28px, 3.4vw, 44px)' : 'clamp(36px, 5.4vw, 74px)';
        sq.style.left = `${x}%`;
        sq.style.top = `${y}%`;
        sq.style.width = sz;
        sq.style.height = sz;
        heroGlass.appendChild(sq);

        if (!reduceMotion) {
          sqAnimations.push(
            gsap.to(sq, {
              opacity: 0.15,
              duration: 0.9,
              yoyo: true,
              repeat: -1,
              ease: 'sine.inOut',
              delay: Math.random() * 3,
              repeatDelay: 1 + Math.random() * 3,
            }),
          );
        }
      });
    }

    // 4. Lenis smooth scroll
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    lenisRef.current = lenis;
    lenis.on('scroll', ScrollTrigger.update);

    const tickerFn = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(tickerFn);
    gsap.ticker.lagSmoothing(0);

    // Anchor navigation via Lenis
    const anchorHandler = (e: Event) => {
      const anchor = (e.currentTarget as HTMLAnchorElement).getAttribute('href');
      if (anchor && anchor.startsWith('#')) {
        const el = document.querySelector(anchor);
        if (el) {
          e.preventDefault();
          lenis.scrollTo(el as HTMLElement, { duration: 1.4 });
        }
      }
    };
    const anchors = Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]'));
    anchors.forEach((a) => a.addEventListener('click', anchorHandler));

    // 5. Setup ScrollTriggers after intro finishes
    let ctx: gsap.Context | null = null;
    const setupScroll = () => {
      ctx = gsap.context(() => {
        // Hero parallax
        if (!reduceMotion) {
          gsap.to('#heroTitle', {
            yPercent: -60,
            ease: 'none',
            scrollTrigger: {
              trigger: '#hero',
              start: 'top top',
              end: 'bottom top',
              scrub: true,
            },
          });

          document.querySelectorAll<HTMLElement>('.hero [data-par]').forEach((el) => {
            const par = parseFloat(el.dataset.par || '0');
            gsap.to(el, {
              y: par * 2,
              ease: 'none',
              scrollTrigger: {
                trigger: '#hero',
                start: 'top top',
                end: 'bottom top',
                scrub: true,
              },
            });
          });

          gsap.to('.hero-media', {
            yPercent: 8,
            ease: 'none',
            scrollTrigger: {
              trigger: '#hero',
              start: 'top top',
              end: 'bottom top',
              scrub: true,
            },
          });
        }

        // Reveal paragraphs & buttons
        gsap.utils.toArray<HTMLElement>('.reveal').forEach((el) => {
          gsap.from(el, {
            opacity: 0,
            y: 16,
            duration: 0.75,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: el,
              start: 'top 86%',
              once: true,
            },
          });
        });

        // Word reveal on stats, loop, cta
        document
          .querySelectorAll<HTMLElement>('#stats .split, #loop .split, #cta .split')
          .forEach((el) => {
            const words = el.querySelectorAll('.w');
            if (!words.length) return;
            gsap.from(words, {
              opacity: 0,
              y: 22,
              filter: 'blur(8px)',
              duration: 0.85,
              stagger: 0.05,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: el,
                start: 'top 82%',
                once: true,
              },
            });
          });

        // Counters helper
        const setCounters = (p: number) => {
          document.querySelectorAll<HTMLElement>('.card b[data-to]').forEach((b) => {
            const to = parseFloat(b.dataset.to || '0');
            const dec = parseInt(b.dataset.dec || '0', 10);
            const suf = b.dataset.suf || '';
            b.textContent = `${(to * p).toFixed(dec)}${suf}`;
          });
        };

        const mm = gsap.matchMedia();

        mm.add('(min-width: 901px)', () => {
          gsap.from('.card', {
            y: 40,
            opacity: 0,
            stagger: 0.08,
            duration: 0.8,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: '#stats',
              start: 'top 70%',
              once: true,
            },
          });

          const proxy = { p: 0 };
          const statsTl = gsap.timeline({
            scrollTrigger: {
              trigger: '#stats',
              start: 'top top',
              end: '+=110%',
              pin: true,
              scrub: 1,
            },
          });
          statsTl.to(
            proxy,
            {
              p: 1,
              ease: 'none',
              onUpdate: () => setCounters(proxy.p),
            },
            0,
          );
          statsTl.fromTo(
            '#tree',
            { yPercent: 75 },
            { yPercent: 6, ease: 'none' },
            0,
          );
        });

        mm.add('(max-width: 900px)', () => {
          gsap.from('.card', {
            y: 30,
            opacity: 0,
            stagger: 0.08,
            duration: 0.7,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: '.cards',
              start: 'top 85%',
              once: true,
            },
          });

          const proxy = { p: 0 };
          gsap.to(proxy, {
            p: 1,
            duration: 1.8,
            ease: 'power2.out',
            onUpdate: () => setCounters(proxy.p),
            scrollTrigger: {
              trigger: '.cards',
              start: 'top 80%',
              once: true,
            },
          });

          gsap.fromTo(
            '#tree',
            { yPercent: 40 },
            {
              yPercent: 0,
              ease: 'none',
              scrollTrigger: {
                trigger: '#stats',
                start: 'top bottom',
                end: 'bottom bottom',
                scrub: true,
              },
            },
          );
        });

        mm.add('(min-width: 761px)', () => {
          gsap.from('.panel-in', {
            y: 100,
            opacity: 0,
            duration: 1,
            stagger: 0.12,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: '#loop',
              start: 'top 65%',
              once: true,
            },
          });

          gsap.to('.loop-cloud', {
            x: 60,
            ease: 'none',
            scrollTrigger: {
              trigger: '#loop',
              start: 'top bottom',
              end: 'bottom top',
              scrub: true,
            },
          });
        });

        mm.add('(max-width: 760px)', () => {
          gsap.utils.toArray<HTMLElement>('.panel').forEach((panel) => {
            gsap.from(panel.children, {
              y: 32,
              opacity: 0,
              duration: 0.8,
              stagger: 0.08,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: panel,
                start: 'top 85%',
                once: true,
              },
            });
          });
        });

        // CTA parallax + card arrival
        gsap.fromTo(
          '#ctaImg',
          { yPercent: -12 },
          {
            yPercent: 0,
            ease: 'none',
            scrollTrigger: {
              trigger: '#cta',
              start: 'top bottom',
              end: 'bottom bottom',
              scrub: true,
            },
          },
        );

        gsap.from('#ctaCard', {
          y: 60,
          scale: 0.96,
          opacity: 0,
          filter: 'blur(8px)',
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '#cta',
            start: 'top 65%',
            once: true,
          },
        });

        // Footer SVG mark animation
        const footerTl = gsap.timeline({
          scrollTrigger: {
            trigger: '#footer',
            start: 'top 92%',
            once: true,
          },
        });
        footerTl
          .to('.fdot', {
            y: -8,
            duration: 0.25,
            stagger: 0.08,
            yoyo: true,
            repeat: 3,
            ease: 'sine.inOut',
          })
          .to('.fdot', {
            attr: { cx: 27, cy: 50 },
            duration: 0.45,
            ease: 'power3.inOut',
          })
          .to('.fdot:nth-child(3), .fdot:nth-child(4)', {
            opacity: 0,
            duration: 0.1,
          })
          .to(
            '#fMark',
            {
              strokeDashoffset: 0,
              duration: 0.6,
              ease: 'power3.out',
            },
            '-=.05',
          )
          .to(
            '.fdot:nth-child(2)',
            {
              attr: { r: 5.5 },
              duration: 0.4,
              ease: 'back.out(3)',
            },
            '<',
          )
          .to(
            '#fRing',
            {
              strokeDashoffset: 0,
              duration: 0.9,
              ease: 'power2.inOut',
            },
            '-=.3',
          );

        ScrollTrigger.refresh();
      });
    };

    // 6. Intro sequence
    if (reduceMotion) {
      document.body.classList.remove('intro');
      setShowBackdrop(false);
      setupScroll();
    } else {
      lenis.stop();
      const heroWords = document.querySelectorAll('#heroTitle .w');
      gsap.set(heroWords, { opacity: 0, y: 24, filter: 'blur(10px)' });
      gsap.set('.nav-bar', { opacity: 0, y: -16 });

      const introTl = gsap.timeline({
        delay: 0.2,
        onComplete: () => {
          document.body.classList.remove('intro');
          gsap.set('#app', { clearProps: 'all' });
          setShowBackdrop(false);
          lenis.start();
          setupScroll();
        },
      });

      introTl
        .fromTo(
          '#app',
          { scale: 0.9, borderRadius: 28 },
          { scale: 1, borderRadius: 0, duration: 1.25, ease: 'expo.inOut' },
        )
        .to(
          '.nav-bar',
          { opacity: 1, y: 0, duration: 0.75, ease: 'power3.out' },
          '-=.45',
        )
        .to(
          heroWords,
          {
            opacity: 1,
            y: 0,
            filter: 'blur(0px)',
            duration: 0.9,
            stagger: 0.06,
            ease: 'power3.out',
          },
          '-=.65',
        )
        .from(
          '.cloud-l',
          { x: -120, opacity: 0, duration: 1.4, ease: 'power3.out' },
          0.35,
        )
        .from(
          '.cloud-r',
          { x: 120, opacity: 0, duration: 1.4, ease: 'power3.out' },
          0.35,
        )
        .from(
          '#heroGlass .glass',
          {
            opacity: 0,
            scale: 0.6,
            duration: 0.55,
            stagger: { each: 0.04, from: 'random' },
            ease: 'back.out(2)',
          },
          '-=.9',
        );
    }

    const onLoadRefresh = () => ScrollTrigger.refresh();
    window.addEventListener('load', onLoadRefresh);

    return () => {
      window.removeEventListener('load', onLoadRefresh);
      anchors.forEach((a) => a.removeEventListener('click', anchorHandler));
      gsap.ticker.remove(tickerFn);
      sqAnimations.forEach((t) => t.kill());
      ctx?.revert();
      lenis.destroy();
    };
  }, []);

  return (
    <>
      {showBackdrop && <div className="backdrop" aria-hidden="true" />}

      {/* Fixed 3-Zone Top Bar outside #app transform context */}
      <header className="nav-bar">
        <a href="#hero" className="brand-link" aria-label="Bloom by Kavi home">
          <svg viewBox="0 0 30 22" width="26" height="19" aria-hidden="true">
            <circle cx="4" cy="17" r="3.6" fill="currentColor" />
            <path
              d="M10.5 18.5 16.8 5.2 25.5 18.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="5.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>bloom by kavi</span>
        </a>

        <nav className="nav-links" aria-label="Primary navigation">
          <a href="#studio" className="nav-link">
            3D Studio
          </a>
          <a href="#stats" className="nav-link">
            Highlights
          </a>
          <a href="#loop" className="nav-link">
            Process
          </a>
          <a href="#cta" className="nav-link">
            Enquiry
          </a>
        </nav>

        <a href="#cta" className="btn h-9 px-4 text-xs">
          Order Enquiry
        </a>
      </header>

      <div id="app">
        {/* SECTION 1: HERO */}
        <section className="hero" id="hero">
          <div className="cloud cloud-l" data-par="-60">
            <img
              className="drift-a"
              src={ASSETS.CLOUD_A}
              alt=""
              aria-hidden="true"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="cloud cloud-r" data-par="-90">
            <img
              className="drift-b"
              src={ASSETS.CLOUD_B}
              alt=""
              aria-hidden="true"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="hero-head" id="heroTitle">
            <p className="text-xs font-medium text-[#4d6a10] tracking-wide">
              @bloom_by_kavi06 · Bangles · DIY Kits · Pipe Cleaner Crafts
            </p>
            <h1 className="hero-title split">
              Handmade bangles &amp; blooms,
              <br />
              crafted for <em>every story.</em>
            </h1>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <a href="#cta" className="btn">
                Send Custom Enquiry
              </a>
              <a
                href="#studio"
                className="inline-flex items-center justify-center h-10 px-5 rounded-full bg-white/90 border border-[#121410]/12 text-xs font-semibold text-[#121410] hover:bg-[#e7efcf] transition-colors whitespace-nowrap"
              >
                Explore 3D Craft Studio
              </a>
            </div>
          </div>

          <div className="hero-media">
            <video
              id="heroVideo"
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              poster={ASSETS.HERO_POSTER}
              src={ASSETS.HERO_VIDEO}
            />
          </div>

          <div className="hero-glass" id="heroGlass" ref={heroGlassRef} />
        </section>

        {/* SECTION 2: THREE.JS 3D CRAFT STUDIO */}
        <CraftStudio3D
          selectedCategory={selectedCategory}
          selectedPalette={selectedPalette}
          onSelectCategory={setSelectedCategory}
          onSelectPalette={setSelectedPalette}
          onEnquirePiece={handleEnquirePiece}
        />

        {/* SECTION 3: STATS & RISING CHERRY BLOSSOM TREE */}
        <section className="stats" id="stats">
          <div className="sq-field" data-count="22" />

          <div className="tree-wrap">
            <img
              id="tree"
              className="tree"
              src={ASSETS.TREE}
              alt="Cherry blossom trees"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="stats-inner">
            <span className="kicker-text reveal">
              Bloom by Kavi · Handmade · Creative · Aesthetic
            </span>

            <h2 className="h2 split mb-4">
              Crafted piece by piece,
              <br />
              styled to keep forever.
            </h2>

            <div className="cards">
              {BRAND_STATS.map((stat) => (
                <div className="card" key={stat.label}>
                  <small>{stat.label}</small>
                  <b
                    data-to={stat.target}
                    data-dec={stat.decimals}
                    data-suf={stat.suffix}
                  >
                    0{stat.suffix}
                  </b>
                </div>
              ))}
            </div>

            <div className="cards-shadow" />

            <div className="relative w-[min(860px,100%)] flex items-center justify-center">
              <div className="band" id="band" />
              <div className="logos">
                <span className="logo-item">Silk Thread Bangles</span>
                <span className="logo-item">Pipe Cleaner Florals</span>
                <span className="logo-item">DIY Gift Kits</span>
                <span className="logo-item">Bridal &amp; Festive Sets</span>
                <span className="logo-item">Custom Colorways</span>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4: 3-PANEL HOVER ACCORDION */}
        <section className="loop" id="loop">
          <div className="loop-cloud" data-par="-50">
            <img
              className="drift-a"
              src={ASSETS.CLOUD_A}
              alt=""
              aria-hidden="true"
              referrerPolicy="no-referrer"
            />
            <div className="glass" style={{ left: '6%', top: '30%', width: '15%', aspectRatio: '1' }} />
            <div className="glass" style={{ left: '23%', top: '58%', width: '13%', aspectRatio: '1' }} />
            <div className="glass" style={{ left: '38%', top: '24%', width: '13%', aspectRatio: '1' }} />
          </div>

          <div className="loop-head">
            <span className="kicker-text reveal">Custom Order Workflow</span>
            <h2 className="h2 split">
              From your idea to
              <br />a finished keepsake.
            </h2>
          </div>

          <div className="track" id="track">
            {ACCORDION_STEPS.map((step, idx) => {
              const isActive = activePanel === idx;
              return (
                <div
                  key={step.num}
                  tabIndex={0}
                  role="button"
                  aria-label={`Step ${step.num}: ${step.title}`}
                  aria-expanded={isActive}
                  className={`panel ${isActive ? 'is-active' : ''}`}
                  onMouseEnter={() => setActivePanel(idx)}
                  onFocus={() => setActivePanel(idx)}
                  onClick={() => setActivePanel(idx)}
                >
                  <div className="panel-in">
                    <span className={`num num-${step.num}`}>{step.num}</span>
                    <div className="step">
                      <img
                        className="mini-cloud"
                        src={step.cloud}
                        alt=""
                        aria-hidden="true"
                        referrerPolicy="no-referrer"
                      />
                      <h3>{step.title}</h3>
                      <p>{step.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* SECTION 5: MOONLIT VALLEY CUSTOM ENQUIRY */}
        <EnquirySection
          preselectedCategory={enquiryCategory}
          preselectedPalette={enquiryPalette}
        />

        {/* SECTION 6: ANIMATED LIME FOOTER */}
        <Footer />
      </div>
    </>
  );
}
