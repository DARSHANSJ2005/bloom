import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Check, Copy, Instagram, Send } from 'lucide-react';
import { ASSETS, CRAFT_PALETTES } from '../constants/assets';

export interface EnquiryRecord {
  id: string;
  createdAt: string;
  name: string;
  contact: string;
  email: string;
  category: string;
  palette: string;
  quantity: string;
  neededBy: string;
  notes: string;
}

interface EnquirySectionProps {
  preselectedCategory: string;
  preselectedPalette: string;
}

const STORAGE_KEY = 'bloom_by_kavi_enquiries_v1';

const CATEGORY_OPTIONS = [
  'Handmade Bangles',
  'Pipe Cleaner Crafts',
  'DIY Craft Kit',
  'Bridal / Event Favors',
];

const QUANTITY_OPTIONS = ['1 Piece / Single', 'Set of 2–4', 'Gift / Party Pack (5+)'];

export function EnquirySection({
  preselectedCategory,
  preselectedPalette,
}: EnquirySectionProps) {
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState(preselectedCategory || CATEGORY_OPTIONS[0]);
  const [palette, setPalette] = useState(preselectedPalette || CRAFT_PALETTES[0].label);
  const [quantity, setQuantity] = useState(QUANTITY_OPTIONS[1]);
  const [neededBy, setNeededBy] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submittedRecord, setSubmittedRecord] = useState<EnquiryRecord | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  const [savedEnquiries, setSavedEnquiries] = useState<EnquiryRecord[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as EnquiryRecord[]) : [];
    } catch {
      return [];
    }
  });

  // Sync whenever user clicks "Enquire This Piece" from the 3D Studio
  useEffect(() => {
    if (preselectedCategory) setCategory(preselectedCategory);
  }, [preselectedCategory]);

  useEffect(() => {
    if (preselectedPalette) setPalette(preselectedPalette);
  }, [preselectedPalette]);

  // Deterministic 18 falling petals matching the design blueprint
  const petals = useMemo(() => {
    return Array.from({ length: 18 }, (_, idx) => {
      const s = (idx * 37 + 13) % 100;
      const dx = ((idx * 53) % 160) - 80;
      const dur = 9 + ((idx * 19) % 9);
      const delay = -((idx * 23) % 15);
      const scale = 0.65 + ((idx * 17) % 75) / 100;
      return {
        left: `${s}%`,
        dx: `${dx}px`,
        duration: `${dur}s`,
        delay: `${delay}s`,
        transform: `scale(${scale})`,
      };
    });
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const trimmedName = name.trim();
    const trimmedContact = contact.trim();
    const trimmedEmail = email.trim();

    if (trimmedName.length < 2) {
      setErrorMsg('Please enter your name so Kavi knows who to address.');
      return;
    }
    if (!trimmedContact && !trimmedEmail) {
      setErrorMsg('Please provide your Instagram handle, phone number, or email.');
      return;
    }
    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    const refId = `BBK-${Math.floor(1000 + Math.random() * 9000)}`;
    const record: EnquiryRecord = {
      id: refId,
      createdAt: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      name: trimmedName,
      contact: trimmedContact || 'Not provided',
      email: trimmedEmail || 'Not provided',
      category,
      palette,
      quantity,
      neededBy: neededBy || 'Flexible',
      notes: notes.trim() || 'Standard handmade design',
    };

    const next = [record, ...savedEnquiries].slice(0, 5);
    setSavedEnquiries(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignore storage quota errors
    }

    setSubmittedRecord(record);
    setCopiedId(false);
  };

  const handleCopyBrief = async (rec: EnquiryRecord) => {
    const brief = [
      `Hi Bloom by Kavi (@bloom_by_kavi06)! Custom Enquiry #${rec.id}`,
      `Name: ${rec.name}`,
      `Craft: ${rec.category}`,
      `Colorway: ${rec.palette}`,
      `Quantity: ${rec.quantity}`,
      `Needed by: ${rec.neededBy}`,
      `Contact: ${rec.contact} | ${rec.email}`,
      `Design Notes: ${rec.notes}`,
    ].join('\n');

    try {
      await navigator.clipboard.writeText(brief);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2600);
    } catch {
      setCopiedId(false);
    }
  };

  return (
    <section className="cta" id="cta" aria-label="Custom order enquiry">
      <div className="sq-field" data-count="16" />

      <div className="cta-img">
        <img
          id="ctaImg"
          src={ASSETS.NIGHT}
          alt="Moonlit cherry blossom valley"
          referrerPolicy="no-referrer"
        />
      </div>

      <div className="petals" id="petals" aria-hidden="true">
        {petals.map((p, i) => (
          <span
            key={i}
            className="petal"
            style={
              {
                left: p.left,
                '--dx': p.dx,
                animationDuration: p.duration,
                animationDelay: p.delay,
                transform: p.transform,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      <div className="cta-card" id="ctaCard">
        <div className="text-center">
          <span className="kicker-text">Custom Order Enquiry · @bloom_by_kavi06</span>
          <h2 className="h2 split mt-3">
            Every handmade piece is crafted around{' '}
            <em className="font-serif-italic text-[#4d6a10]">your story.</em>
          </h2>
          <p className="reveal mt-2.5 text-sm text-[#2c3324] max-w-xl mx-auto">
            Share your preferred craft, color palette, wrist size, or event date. Receive an
            enquiry reference instantly and copy your brief straight to Instagram DM.
          </p>
        </div>

        {submittedRecord ? (
          <div className="mt-7 rounded-2xl bg-[#f7f9f2] border border-[#4d6a10]/20 p-6 text-left">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e2e8d4] pb-4">
              <div>
                <p className="text-xs font-medium text-[#4d6a10]">
                  Enquiry Saved · {submittedRecord.createdAt}
                </p>
                <h3 className="mt-0.5 text-xl font-semibold tracking-tight text-[#121410] tabular-nums">
                  Reference #{submittedRecord.id}
                </h3>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyBrief(submittedRecord)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#e7efcf] px-3.5 py-2 text-xs font-semibold text-[#2c3a10] hover:bg-[#dce8ba] transition-colors cursor-pointer"
                >
                  {copiedId ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span>Copied for DM</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy DM Brief</span>
                    </>
                  )}
                </button>
                <a
                  href="https://instagram.com/bloom_by_kavi06"
                  target="_blank"
                  rel="noreferrer"
                  className="btn h-9 px-4 text-xs"
                >
                  <Instagram className="h-3.5 w-3.5" />
                  <span>Open @bloom_by_kavi06</span>
                </a>
              </div>
            </div>

            <dl className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div>
                <dt className="text-xs text-[#545d48]">Customer</dt>
                <dd className="font-medium text-[#121410]">{submittedRecord.name}</dd>
              </div>
              <div>
                <dt className="text-xs text-[#545d48]">Contact</dt>
                <dd className="font-medium text-[#121410]">
                  {submittedRecord.contact} · {submittedRecord.email}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-[#545d48]">Craft &amp; Shade</dt>
                <dd className="font-medium text-[#121410]">
                  {submittedRecord.category} · {submittedRecord.palette}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-[#545d48]">Quantity &amp; Target Date</dt>
                <dd className="font-medium text-[#121410]">
                  {submittedRecord.quantity} · {submittedRecord.neededBy}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs text-[#545d48]">Design Notes</dt>
                <dd className="mt-0.5 text-[#23291d]">{submittedRecord.notes}</dd>
              </div>
            </dl>

            <div className="mt-5 flex items-center justify-between pt-4 border-t border-[#e2e8d4]">
              <span className="text-xs text-[#4f5843]">
                Want to request another set or custom gift box?
              </span>
              <button
                type="button"
                onClick={() => {
                  setSubmittedRecord(null);
                  setNotes('');
                }}
                className="text-xs font-semibold text-[#4d6a10] hover:underline cursor-pointer"
              >
                Create Another Enquiry
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-7 space-y-4 text-left" noValidate>
            {/* Craft Category Selector */}
            <div>
              <span className="block text-xs font-medium text-[#2c3324] mb-1.5">
                Craft Category
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {CATEGORY_OPTIONS.map((opt) => {
                  const active = category === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setCategory(opt)}
                      className={`px-3 py-2.5 rounded-xl text-xs font-medium border text-center transition-colors cursor-pointer ${
                        active
                          ? 'bg-[#4d6a10] border-[#4d6a10] text-[#f3f8e4]'
                          : 'bg-[#ffffff] border-[#121410]/12 text-[#2b3224] hover:border-[#4d6a10]/50'
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label
                  htmlFor="enq-palette"
                  className="block text-xs font-medium text-[#2c3324] mb-1"
                >
                  Color Palette
                </label>
                <select
                  id="enq-palette"
                  value={palette}
                  onChange={(e) => setPalette(e.target.value)}
                  className="w-full h-10 rounded-xl border border-[#121410]/15 bg-white px-3 text-sm text-[#121410] focus:outline-2 focus:outline-[#4d6a10]"
                >
                  {CRAFT_PALETTES.map((p) => (
                    <option key={p.id} value={p.label}>
                      {p.label}
                    </option>
                  ))}
                  <option value="Custom Shade Match">Custom Shade Match</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="enq-qty"
                  className="block text-xs font-medium text-[#2c3324] mb-1"
                >
                  Quantity / Set Size
                </label>
                <select
                  id="enq-qty"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full h-10 rounded-xl border border-[#121410]/15 bg-white px-3 text-sm text-[#121410] focus:outline-2 focus:outline-[#4d6a10]"
                >
                  {QUANTITY_OPTIONS.map((q) => (
                    <option key={q} value={q}>
                      {q}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="enq-date"
                  className="block text-xs font-medium text-[#2c3324] mb-1"
                >
                  Needed By (Optional)
                </label>
                <input
                  id="enq-date"
                  type="date"
                  value={neededBy}
                  onChange={(e) => setNeededBy(e.target.value)}
                  className="w-full h-10 rounded-xl border border-[#121410]/15 bg-white px-3 text-sm text-[#121410] focus:outline-2 focus:outline-[#4d6a10]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label
                  htmlFor="enq-name"
                  className="block text-xs font-medium text-[#2c3324] mb-1"
                >
                  Your Name *
                </label>
                <input
                  id="enq-name"
                  type="text"
                  required
                  placeholder="Ananya Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-10 rounded-xl border border-[#121410]/15 bg-white px-3 text-sm text-[#121410] placeholder:text-[#7e8772] focus:outline-2 focus:outline-[#4d6a10]"
                />
              </div>

              <div>
                <label
                  htmlFor="enq-contact"
                  className="block text-xs font-medium text-[#2c3324] mb-1"
                >
                  Instagram @ / WhatsApp *
                </label>
                <input
                  id="enq-contact"
                  type="text"
                  placeholder="@yourhandle or +91..."
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  className="w-full h-10 rounded-xl border border-[#121410]/15 bg-white px-3 text-sm text-[#121410] placeholder:text-[#7e8772] focus:outline-2 focus:outline-[#4d6a10]"
                />
              </div>

              <div>
                <label
                  htmlFor="enq-email"
                  className="block text-xs font-medium text-[#2c3324] mb-1"
                >
                  Email Address
                </label>
                <input
                  id="enq-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-10 rounded-xl border border-[#121410]/15 bg-white px-3 text-sm text-[#121410] placeholder:text-[#7e8772] focus:outline-2 focus:outline-[#4d6a10]"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="enq-notes"
                className="block text-xs font-medium text-[#2c3324] mb-1"
              >
                Custom Design Details (wrist size, flower mix, ribbon note)
              </label>
              <textarea
                id="enq-notes"
                rows={3}
                placeholder="e.g. Size 2.4 silk-thread bangle set in Blossom Pink with gold kundan border, or 5-stem pipe cleaner sunflower bouquet..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-xl border border-[#121410]/15 bg-white p-3 text-sm text-[#121410] placeholder:text-[#7e8772] focus:outline-2 focus:outline-[#4d6a10]"
              />
            </div>

            {errorMsg && (
              <p
                role="alert"
                className="text-xs font-medium text-[#9f2336] bg-[#fdf2f4] border border-[#9f2336]/20 rounded-xl px-3 py-2"
              >
                {errorMsg}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <span className="text-xs text-[#4a5240]">
                Custom pieces crafted to order · Direct follow-up via @bloom_by_kavi06
              </span>
              <button type="submit" className="btn px-6 h-11 text-sm">
                <Send className="h-3.5 w-3.5" />
                <span>Send Custom Enquiry</span>
              </button>
            </div>
          </form>
        )}

        {/* Saved enquiries log from current browser */}
        {savedEnquiries.length > 0 && !submittedRecord && (
          <div className="mt-6 border-t border-[#121410]/10 pt-4 text-left">
            <p className="text-xs font-medium text-[#4a5240] mb-2">
              Your Recent Enquiries
            </p>
            <div className="flex flex-wrap gap-2">
              {savedEnquiries.slice(0, 3).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSubmittedRecord(item)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-[#f3f6ec] border border-[#121410]/10 text-[#1d240c] hover:bg-[#e7efcf] transition-colors cursor-pointer tabular-nums"
                >
                  #{item.id} · {item.category} ({item.palette})
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
