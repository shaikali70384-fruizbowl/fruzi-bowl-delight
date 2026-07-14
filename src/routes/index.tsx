import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import emailjs from "@emailjs/browser";
import heroBowl from "@/assets/hero-bowl.png";
import { bowls, fruits, extras, offers, brand, emailConfig } from "@/data/menuData.js";
import { Logo } from "@/components/fruzi/Logo";

export const Route = createFileRoute("/")({
  component: Index,
});

// ------- Types -------
type CartItem = {
  id: string;
  kind: "bowl" | "platter" | "extra";
  name: string;
  price: number;
  qty: number;
  meta?: string;
  image?: string;
};

const money = (n: number) => `${brand.currency}${n}`;

function Index() {
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [extrasOpen, setExtrasOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [platter, setPlatter] = useState<Record<string, number>>({});
  const [lastOrder, setLastOrder] = useState<null | {
    name: string; phone: string; address: string; landmark: string; notes: string;
    items: CartItem[]; extras: CartItem[]; total: number; when: string;
  }>(null);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1400);
    return () => clearTimeout(t);
  }, []);

  const subtotal = useMemo(() => cart.reduce((s, i) => s + i.price * i.qty, 0), [cart]);
  const delivery = subtotal >= brand.freeDeliveryAbove || subtotal === 0 ? 0 : 25;
  const total = subtotal + delivery;
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  const addBowl = useCallback((b: (typeof bowls)[number]) => {
    setCart((c) => {
      const idx = c.findIndex((x) => x.id === `bowl-${b.id}`);
      if (idx >= 0) {
        const n = [...c]; n[idx] = { ...n[idx], qty: n[idx].qty + 1 }; return n;
      }
      return [...c, { id: `bowl-${b.id}`, kind: "bowl", name: b.name, price: b.price, qty: 1, meta: b.weight, image: b.image }];
    });
    setCartOpen(true);
  }, []);

  const updateQty = (id: string, d: number) =>
    setCart((c) =>
      c
        .map((i) => (i.id === id ? { ...i, qty: i.qty + d } : i))
        .filter((i) => i.qty > 0),
    );
  const removeItem = (id: string) => setCart((c) => c.filter((i) => i.id !== id));

  const platterGrams = Object.values(platter).reduce((s, n) => s + n * 100, 0);
  const platterPrice = Object.entries(platter).reduce((s, [id, n]) => {
    const f = fruits.find((f) => f.id === id); return s + (f ? f.price * n : 0);
  }, 0);
  const addPlatterToCart = () => {
    if (platterGrams === 0) return;
    const summary = Object.entries(platter)
      .filter(([, n]) => n > 0)
      .map(([id, n]) => `${fruits.find((f) => f.id === id)?.name} ${n * 100}g`)
      .join(", ");
    setCart((c) => [
      ...c,
      {
        id: `platter-${Date.now()}`,
        kind: "platter",
        name: `Custom Platter · ${platterGrams}g`,
        price: platterPrice,
        qty: 1,
        meta: summary,
      },
    ]);
    setPlatter({});
    setCartOpen(true);
  };

  const proceedToExtras = () => { setCartOpen(false); setExtrasOpen(true); };
  const proceedToCheckout = () => { setExtrasOpen(false); setCheckoutOpen(true); };

  const placeOrder = async (form: {
    name: string; phone: string; address: string; landmark: string; notes: string;
  }) => {
    const chosenExtras = cart.filter((i) => i.kind === "extra");
    const orderItems = cart.filter((i) => i.kind !== "extra");
    const when = new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
    const record = { ...form, items: orderItems, extras: chosenExtras, total, when };
    setLastOrder(record);

    const body = [
      `New Fruzi Bowl order — ${when}`,
      ``,
      `Name: ${form.name}`,
      `Phone: +91 ${form.phone}`,
      `Address: ${form.address}`,
      `Landmark: ${form.landmark || "-"}`,
      `Instructions: ${form.notes || "-"}`,
      ``,
      `Items:`,
      ...orderItems.map((i) => ` • ${i.name} x${i.qty} — ${money(i.price * i.qty)}${i.meta ? ` (${i.meta})` : ""}`),
      chosenExtras.length ? `\nExtras:` : "",
      ...chosenExtras.map((i) => ` • ${i.name} x${i.qty} — ${money(i.price * i.qty)}`),
      ``,
      `Delivery: ${delivery === 0 ? "FREE" : money(delivery)}`,
      `Grand Total: ${money(total)}`,
    ].filter(Boolean).join("\n");

    try {
      if (emailConfig.serviceId && emailConfig.templateId && emailConfig.publicKey) {
        await emailjs.send(
          emailConfig.serviceId,
          emailConfig.templateId,
          {
            to_email: brand.orderEmail,
            customer_name: form.name,
            customer_phone: `+91 ${form.phone}`,
            address: form.address,
            landmark: form.landmark,
            notes: form.notes,
            order_body: body,
            total: money(total),
            order_time: when,
          },
          { publicKey: emailConfig.publicKey },
        );
      } else {
        // Fallback: open the user's mail client with the order pre-filled.
        const url = `mailto:${brand.orderEmail}?subject=${encodeURIComponent(
          `New Fruzi Bowl order — ${form.name}`,
        )}&body=${encodeURIComponent(body)}`;
        window.open(url, "_blank");
      }
    } catch (e) {
      console.error("EmailJS failed", e);
    }

    setCheckoutOpen(false);
    setSuccessOpen(true);
    setCart([]);
    // confetti burst
    const shoot = (angle: number, x: number) =>
      confetti({ particleCount: 80, angle, spread: 60, origin: { x, y: 0.6 }, colors: ["#3FA34D", "#E91E63", "#FFC1D6", "#B7EFC5"] });
    shoot(60, 0.1); shoot(120, 0.9);
    setTimeout(() => confetti({ particleCount: 120, spread: 90, origin: { y: 0.6 } }), 300);
  };

  return (
    <>
      <LoadingScreen show={loading} />
      <div className="min-h-screen">
        <Nav cartCount={cartCount} onCartClick={() => setCartOpen(true)} />
        <Hero />
        <Offers />
        <Menu onAdd={addBowl} />
        <Builder
          platter={platter}
          setPlatter={setPlatter}
          grams={platterGrams}
          price={platterPrice}
          onAdd={addPlatterToCart}
        />
        <Contact />
        <Footer />
      </div>

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cart}
        subtotal={subtotal}
        delivery={delivery}
        total={total}
        onQty={updateQty}
        onRemove={removeItem}
        onCheckout={proceedToExtras}
      />
      <ExtrasModal
        open={extrasOpen}
        onClose={() => setExtrasOpen(false)}
        chosen={cart.filter((i) => i.kind === "extra").map((i) => i.id.replace("extra-", ""))}
        total={total}
        onToggle={(ex) => {
          const id = `extra-${ex.id}`;
          setCart((c) =>
            c.some((i) => i.id === id)
              ? c.filter((i) => i.id !== id)
              : [...c, { id, kind: "extra", name: ex.name, price: ex.price, qty: 1 }],
          );
        }}
        onContinue={proceedToCheckout}
      />
      <CheckoutModal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        total={total}
        onSubmit={placeOrder}
      />
      <SuccessModal open={successOpen} order={lastOrder} onClose={() => setSuccessOpen(false)} />

      {/* Floating cart button on mobile */}
      <button
        onClick={() => setCartOpen(true)}
        className="btn-pink fixed bottom-5 right-5 z-40 grid h-14 w-14 place-items-center rounded-full sm:hidden"
        aria-label="Open cart"
      >
        🛒
        {cartCount > 0 && (
          <span className="absolute -top-1 -right-1 grid h-6 min-w-6 place-items-center rounded-full bg-white px-1 text-xs font-bold" style={{ color: "var(--pink)" }}>
            {cartCount}
          </span>
        )}
      </button>
    </>
  );
}

/* ==================== Loading ==================== */
function LoadingScreen({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[100] grid place-items-center"
          style={{ background: "var(--gradient-hero)" }}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="flex flex-col items-center gap-6"
          >
            <Logo size={56} />
            <div className="relative h-1.5 w-48 overflow-hidden rounded-full bg-white/60">
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                className="h-full w-1/2 rounded-full"
                style={{ background: "linear-gradient(90deg, var(--fresh), var(--pink))" }}
              />
            </div>
            <p className="text-sm text-muted-foreground">Slicing something fresh…</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ==================== Nav ==================== */
function Nav({ cartCount, onCartClick }: { cartCount: number; onCartClick: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onS = () => setScrolled(window.scrollY > 20);
    onS(); window.addEventListener("scroll", onS);
    return () => window.removeEventListener("scroll", onS);
  }, []);
  const link = "text-sm font-medium text-foreground/80 hover:text-foreground transition-colors";
  return (
    <header className="sticky top-3 z-40 px-3 sm:px-6">
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className={`glass-card mx-auto flex max-w-6xl items-center justify-between rounded-full px-4 py-2.5 sm:px-6 ${scrolled ? "shadow-lg" : ""}`}
      >
        <a href="#home" aria-label="Fruzi Bowl home"><Logo /></a>
        <nav className="hidden items-center gap-7 md:flex">
          <a href="#menu" className={link}>Menu</a>
          <a href="#builder" className={link}>Build Your Own</a>
          <a href="#contact" className={link}>Contact</a>
        </nav>
        <button onClick={onCartClick} className="btn-pink relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold">
          <span aria-hidden>🛒</span>
          <span className="hidden sm:inline">Cart</span>
          <span className="grid h-6 min-w-6 place-items-center rounded-full bg-white/25 px-1.5 text-xs font-bold">{cartCount}</span>
        </button>
      </motion.div>
    </header>
  );
}

/* ==================== Hero ==================== */
function Hero() {
  return (
    <section id="home" className="relative overflow-hidden px-4 pt-14 pb-24 sm:pt-20">
      <div className="mx-auto max-w-4xl text-center">
        <motion.div
          initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
          className="glass-card mx-auto inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold"
          style={{ color: "var(--fresh)" }}
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--fresh)" }} />
          100% Fresh · Hand-cut daily
        </motion.div>

        <motion.h1
          initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3, duration: 0.6 }}
          className="mt-6 font-display text-5xl font-bold leading-[1.05] sm:text-7xl md:text-8xl"
        >
          <span style={{ color: "var(--pink)" }}>Fruzi</span>{" "}
          <span style={{ color: "var(--fresh)" }}>Bowl</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="mt-4 flex items-center justify-center gap-3 text-lg font-semibold"
        >
          <span style={{ color: "var(--fresh)" }}>Fresh</span>
          <span className="text-muted-foreground">·</span>
          <span style={{ color: "var(--pink)" }}>Healthy</span>
          <span className="text-muted-foreground">·</span>
          <span>Delivered</span>
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
          className="mx-auto mt-5 max-w-lg text-base text-muted-foreground"
        >
          {brand.description}
        </motion.p>

        <motion.div
          initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.9 }}
          className="mx-auto mt-12 flex max-w-md justify-center"
        >
          <div className="relative">
            <div
              className="absolute -inset-8 rounded-full blur-3xl"
              style={{ background: "radial-gradient(circle, oklch(0.62 0.24 356 / 0.35), transparent 70%)" }}
              aria-hidden
            />
            <img
              src={heroBowl}
              alt="Fresh fruit bowl"
              width={1024}
              height={1024}
              className="float-bowl relative z-10 h-64 w-64 object-contain sm:h-80 sm:w-80"
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1 }}
          className="mt-10"
        >
          <a
            href="#menu"
            className="btn-pink inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold"
          >
            Select Your Menu <span aria-hidden>→</span>
          </a>
        </motion.div>
      </div>
    </section>
  );
}

/* ==================== Offers ==================== */
function Offers() {
  return (
    <section className="px-4 py-10">
      <div className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-2">
        {offers.map((o, idx) => (
          <motion.div
            key={o.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ delay: idx * 0.1 }}
            className="glass-card flex items-center gap-4 rounded-3xl p-5"
          >
            <div
              className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-xl"
              style={{
                background: idx === 0 ? "var(--pink-soft)" : "var(--fresh-soft)",
                color: idx === 0 ? "var(--pink)" : "var(--fresh)",
              }}
            >
              {idx === 0 ? "🎁" : "🚚"}
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold">{o.title}</h3>
              <p className="text-sm text-muted-foreground">{o.subtitle}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ==================== Menu ==================== */
function SectionHead({ eyebrow, title, highlight, subtitle }: { eyebrow: string; title: string; highlight?: string; subtitle?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <div className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: "var(--fresh)" }}>
        {eyebrow}
      </div>
      <h2 className="mt-3 font-display text-4xl font-bold sm:text-5xl">
        {title} {highlight && <span style={{ color: "var(--pink)" }}>{highlight}</span>}
      </h2>
      {subtitle && <p className="mt-3 text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

function Menu({ onAdd }: { onAdd: (b: (typeof bowls)[number]) => void }) {
  return (
    <section id="menu" className="px-4 py-20">
      <SectionHead eyebrow="Our Menu" title="Pick your" highlight="perfect bowl" subtitle="Made fresh every morning with premium seasonal fruits. Choose a size that fits your craving." />
      <div className="mx-auto mt-12 grid max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {bowls.map((b, idx) => (
          <motion.article
            key={b.id}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ delay: idx * 0.08 }}
            className="glass-card group relative flex flex-col overflow-hidden rounded-3xl p-5 transition-transform hover:-translate-y-1"
          >
            {b.badge && (
              <span
                className="absolute right-4 top-4 z-10 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white"
                style={{ background: "var(--pink)" }}
              >
                {b.badge}
              </span>
            )}
            <div className="aspect-square overflow-hidden rounded-2xl bg-gradient-to-br from-white to-pink-50/40 p-4">
              <img src={b.image} alt={b.name} loading="lazy" width={768} height={768} className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105" />
            </div>
            <h3 className="mt-4 text-lg font-bold">{b.name}</h3>
            <p className="text-sm text-muted-foreground">{b.weight}</p>
            <div className="mt-3 flex items-center justify-between">
              <span className="font-display text-2xl font-bold" style={{ color: "var(--pink)" }}>{money(b.price)}</span>
              <button onClick={() => onAdd(b)} className="btn-green rounded-full px-4 py-2 text-sm font-semibold">
                Add to Cart
              </button>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
}

/* ==================== Builder ==================== */
function Builder({
  platter, setPlatter, grams, price, onAdd,
}: {
  platter: Record<string, number>;
  setPlatter: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  grams: number; price: number; onAdd: () => void;
}) {
  const bump = (id: string, d: number) =>
    setPlatter((p) => {
      const next = Math.max(0, (p[id] || 0) + d);
      const copy = { ...p };
      if (next === 0) delete copy[id]; else copy[id] = next;
      return copy;
    });
  return (
    <section id="builder" className="px-4 py-20">
      <SectionHead eyebrow="Build Your Own" title="Craft your" highlight="signature platter" subtitle="Handpick your favourite fruits. We slice them fresh and box them up for you." />
      <div className="mx-auto mt-12 grid max-w-6xl grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {fruits.map((f, idx) => {
          const n = platter[f.id] || 0;
          return (
            <motion.div
              key={f.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: (idx % 5) * 0.06 }}
              className="glass-card flex flex-col rounded-3xl p-3"
            >
              <div className="aspect-square overflow-hidden rounded-2xl bg-white/60 p-2">
                <img src={f.image} alt={f.name} loading="lazy" width={512} height={512} className="h-full w-full object-contain" />
              </div>
              <h4 className="mt-3 text-center text-base font-bold">{f.name}</h4>
              <p className="text-center text-xs text-muted-foreground">Fresh cubes in a serving cup</p>
              <p className="mt-1 text-center text-sm font-semibold" style={{ color: "var(--pink)" }}>
                {money(f.price)} / {f.serving}
              </p>
              <div className="mt-3 flex items-center justify-between gap-2">
                <button
                  onClick={() => bump(f.id, -1)}
                  disabled={n === 0}
                  className="grid h-8 w-8 place-items-center rounded-full border text-lg disabled:opacity-40"
                  aria-label={`Remove ${f.name}`}
                >
                  −
                </button>
                <span className="text-sm font-bold tabular-nums">{n * 100}g</span>
                <button
                  onClick={() => bump(f.id, +1)}
                  className="btn-green grid h-8 w-8 place-items-center rounded-full text-lg"
                  aria-label={`Add ${f.name}`}
                >
                  +
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="mx-auto mt-8 max-w-6xl">
        <div className="glass-card flex flex-col items-start justify-between gap-4 rounded-3xl p-5 sm:flex-row sm:items-center">
          <div className="min-w-0">
            <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Custom Platter</div>
            <div className="mt-1 font-display text-2xl font-bold">
              {grams === 0 ? "Add fruits to begin" : `${grams}g platter`} ·{" "}
              <span style={{ color: "var(--fresh)" }}>{money(price)}</span>
            </div>
          </div>
          <button
            onClick={onAdd}
            disabled={grams === 0}
            className="btn-pink rounded-full px-6 py-3 text-sm font-semibold disabled:opacity-50"
          >
            🧺 Add to Cart
          </button>
        </div>
      </div>
    </section>
  );
}

/* ==================== Contact ==================== */
function Contact() {
  return (
    <section id="contact" className="px-4 py-20">
      <SectionHead eyebrow="Need Help?" title="We're here" highlight="for you" />
      <div className="mx-auto mt-12 grid max-w-4xl gap-5 sm:grid-cols-2">
        <div className="glass-card rounded-3xl p-6">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-full" style={{ background: "var(--fresh-soft)", color: "var(--fresh)" }}>💬</div>
            <h3 className="text-lg font-bold">Fruit Bowl Support</h3>
          </div>
          <ul className="mt-4 space-y-2 text-sm">
            {brand.supportPhones.map((p) => (
              <li key={p} className="flex items-center gap-2 text-muted-foreground"><span style={{ color: "var(--pink)" }}>📞</span> {p}</li>
            ))}
            <li className="flex items-center gap-2 text-muted-foreground"><span style={{ color: "var(--pink)" }}>📷</span> {brand.supportInstagram}</li>
          </ul>
        </div>
        <div className="glass-card rounded-3xl p-6">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-full" style={{ background: "var(--pink-soft)", color: "var(--pink)" }}>⚙️</div>
            <h3 className="text-lg font-bold">Technical Support</h3>
          </div>
          <ul className="mt-4 space-y-2 text-sm">
            <li className="flex items-center gap-2 text-muted-foreground"><span style={{ color: "var(--pink)" }}>📞</span> {brand.techPhone}</li>
            <li className="flex items-center gap-2 text-muted-foreground"><span style={{ color: "var(--pink)" }}>✉️</span> {brand.techEmail}</li>
          </ul>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/50 px-4 py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 sm:flex-row">
        <Logo />
        <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} {brand.name}. Fresh every day.</p>
      </div>
    </footer>
  );
}

/* ==================== Cart Drawer ==================== */
function CartDrawer({
  open, onClose, items, subtotal, delivery, total, onQty, onRemove, onCheckout,
}: {
  open: boolean; onClose: () => void;
  items: CartItem[]; subtotal: number; delivery: number; total: number;
  onQty: (id: string, d: number) => void; onRemove: (id: string) => void;
  onCheckout: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          />
          <motion.aside
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white shadow-2xl"
          >
            <header className="flex items-center justify-between border-b p-5">
              <h2 className="font-display text-2xl font-bold">Your cart</h2>
              <button onClick={onClose} aria-label="Close cart" className="grid h-9 w-9 place-items-center rounded-full border" style={{ color: "var(--fresh)" }}>✕</button>
            </header>

            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              {items.length === 0 && (
                <p className="mt-16 text-center text-muted-foreground">Your cart is empty — go pick a bowl 🍓</p>
              )}
              {items.map((i) => (
                <div key={i.id} className="glass-card grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl p-3">
                  <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-pink-50">
                    {i.image ? <img src={i.image} alt="" className="h-full w-full object-contain" /> : <span className="text-xl">🥣</span>}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold">{i.name}</p>
                      <button onClick={() => onRemove(i.id)} aria-label="Remove" className="text-muted-foreground hover:text-foreground">🗑️</button>
                    </div>
                    {i.meta && <p className="truncate text-xs text-muted-foreground">{i.meta}</p>}
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button onClick={() => onQty(i.id, -1)} className="grid h-7 w-7 place-items-center rounded-full border">−</button>
                        <span className="w-5 text-center text-sm font-bold tabular-nums">{i.qty}</span>
                        <button onClick={() => onQty(i.id, +1)} className="btn-green grid h-7 w-7 place-items-center rounded-full">+</button>
                      </div>
                      <span className="text-sm font-bold" style={{ color: "var(--pink)" }}>{money(i.price * i.qty)}</span>
                    </div>
                  </div>
                  <span className="sr-only">row</span>
                </div>
              ))}
            </div>

            <footer className="border-t p-5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold">{money(subtotal)}</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Delivery</span>
                <span className="font-semibold" style={{ color: delivery === 0 ? "var(--fresh)" : undefined }}>
                  {delivery === 0 ? "FREE" : money(delivery)}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between border-t pt-3">
                <span className="font-display text-xl font-bold">Total</span>
                <span className="font-display text-2xl font-bold" style={{ color: "var(--pink)" }}>{money(total)}</span>
              </div>
              <button
                onClick={onCheckout}
                disabled={items.length === 0}
                className="btn-green mt-4 w-full rounded-full py-3.5 text-base font-semibold disabled:opacity-50"
              >
                Proceed to Checkout
              </button>
            </footer>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

/* ==================== Extras ==================== */
function ExtrasModal({
  open, onClose, chosen, total, onToggle, onContinue,
}: {
  open: boolean; onClose: () => void; chosen: string[]; total: number;
  onToggle: (e: (typeof extras)[number]) => void; onContinue: () => void;
}) {
  return (
    <Modal open={open} onClose={onClose}>
      <div className="p-6 sm:p-7">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-display text-2xl font-bold">Add toppings?</h3>
            <p className="mt-1 text-sm text-muted-foreground">Make it even better — pick as many as you like.</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-muted-foreground">✕</button>
        </div>
        <div className="mt-5 space-y-3">
          {extras.map((e) => {
            const active = chosen.includes(e.id);
            return (
              <button
                key={e.id}
                onClick={() => onToggle(e)}
                className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-all ${active ? "border-transparent ring-2" : "border-border hover:bg-pink-50/40"}`}
                style={active ? { boxShadow: "0 0 0 2px var(--pink) inset", background: "var(--pink-soft)" } : undefined}
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-xl">{e.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold">{e.name}</div>
                  <div className="text-sm font-bold" style={{ color: "var(--pink)" }}>{money(e.price)}</div>
                </div>
                <span className={`grid h-6 w-6 place-items-center rounded-full text-xs text-white ${active ? "" : "opacity-30"}`} style={{ background: "var(--fresh)" }}>✓</span>
              </button>
            );
          })}
        </div>
        <div className="mt-5 flex items-center justify-between rounded-2xl bg-muted p-3">
          <span className="text-sm text-muted-foreground">Updated total</span>
          <span className="font-display text-xl font-bold" style={{ color: "var(--pink)" }}>{money(total)}</span>
        </div>
        <button onClick={onContinue} className="btn-green mt-4 w-full rounded-full py-3.5 text-base font-semibold">
          Continue to Checkout
        </button>
      </div>
    </Modal>
  );
}

/* ==================== Checkout ==================== */
function CheckoutModal({
  open, onClose, total, onSubmit,
}: {
  open: boolean; onClose: () => void; total: number;
  onSubmit: (form: { name: string; phone: string; address: string; landmark: string; notes: string }) => void;
}) {
  const [form, setForm] = useState({ name: "", phone: "", address: "", landmark: "", notes: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const update = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    const e: Record<string, string> = {};
    if (form.name.trim().length < 2) e.name = "Name too short";
    if (!/^\d{10}$/.test(form.phone)) e.phone = "Enter a valid 10-digit mobile";
    if (form.address.trim().length < 6) e.address = "Address required";
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    await onSubmit(form);
    setBusy(false);
    setForm({ name: "", phone: "", address: "", landmark: "", notes: "" });
  };

  const field = "w-full rounded-2xl border bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-[oklch(0.62_0.24_356)] focus:ring-2 focus:ring-[oklch(0.62_0.24_356/0.15)]";
  const label = "text-sm font-semibold";
  const err = "mt-1 text-xs font-medium text-red-500";

  return (
    <Modal open={open} onClose={onClose}>
      <div className="max-h-[85vh] overflow-y-auto p-6 sm:p-7">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-display text-2xl font-bold">Delivery details</h3>
            <p className="mt-1 text-sm text-muted-foreground">We'll call you on this number to confirm delivery.</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-muted-foreground">✕</button>
        </div>
        <div className="mt-5 space-y-4">
          <div>
            <label className={label} htmlFor="cf-name">Full name</label>
            <input id="cf-name" className={field + " mt-1"} placeholder="Your name" value={form.name} onChange={(e) => update("name", e.target.value)} />
            {errors.name && <p className={err}>{errors.name}</p>}
          </div>
          <div>
            <label className={label} htmlFor="cf-phone">Mobile number</label>
            <div className="mt-1 flex items-stretch gap-2">
              <span className="grid place-items-center rounded-2xl border bg-muted px-3 text-sm font-semibold">+91</span>
              <input id="cf-phone" inputMode="numeric" maxLength={10} className={field} placeholder="10-digit mobile" value={form.phone} onChange={(e) => update("phone", e.target.value.replace(/\D/g, ""))} />
            </div>
            {errors.phone && <p className={err}>{errors.phone}</p>}
          </div>
          <div>
            <label className={label} htmlFor="cf-addr">Delivery address</label>
            <textarea id="cf-addr" rows={3} className={field + " mt-1 resize-none"} placeholder="House / flat, street, area" value={form.address} onChange={(e) => update("address", e.target.value)} />
            {errors.address && <p className={err}>{errors.address}</p>}
          </div>
          <div>
            <label className={label} htmlFor="cf-land">Nearby landmark</label>
            <input id="cf-land" className={field + " mt-1"} placeholder="Near…" value={form.landmark} onChange={(e) => update("landmark", e.target.value)} />
          </div>
          <div>
            <label className={label} htmlFor="cf-notes">Special instructions (optional)</label>
            <textarea id="cf-notes" rows={2} className={field + " mt-1 resize-none"} placeholder="Extra mint, less ice…" value={form.notes} onChange={(e) => update("notes", e.target.value)} />
          </div>
        </div>
        <div className="mt-5 flex items-center justify-between rounded-2xl bg-muted p-3">
          <span className="text-sm text-muted-foreground">Order total</span>
          <span className="font-display text-xl font-bold" style={{ color: "var(--pink)" }}>{money(total)}</span>
        </div>
        <button
          onClick={submit}
          disabled={busy}
          className="btn-green mt-4 w-full rounded-full py-3.5 text-base font-semibold disabled:opacity-60"
        >
          {busy ? "Placing order…" : `Place Order · ${money(total)}`}
        </button>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          A 6-digit delivery OTP will be shared with our delivery partner.
        </p>
      </div>
    </Modal>
  );
}

/* ==================== Success ==================== */
function SuccessModal({ open, order, onClose }: { open: boolean; order: any; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose}>
      <div className="p-6 sm:p-8">
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 18 }}
            className="mx-auto grid h-16 w-16 place-items-center rounded-full text-3xl text-white"
            style={{ background: "linear-gradient(135deg, var(--fresh), oklch(0.55 0.17 150))" }}
          >
            ✓
          </motion.div>
          <h3 className="mt-4 font-display text-2xl font-bold">Order placed!</h3>
          <p className="mt-1 text-sm text-muted-foreground">Thank you {order?.name?.split(" ")[0]} — we're slicing your bowl now.</p>
        </div>
        {order && (
          <div className="mt-6 space-y-3 rounded-2xl bg-muted p-4 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="font-semibold">{order.name}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span className="font-semibold">+91 {order.phone}</span></div>
            <div className="flex justify-between gap-3"><span className="text-muted-foreground">Address</span><span className="text-right font-semibold">{order.address}</span></div>
            {order.landmark && <div className="flex justify-between"><span className="text-muted-foreground">Landmark</span><span className="font-semibold">{order.landmark}</span></div>}
            <div className="border-t pt-3">
              <div className="mb-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">Items</div>
              {order.items.map((i: CartItem) => (
                <div key={i.id} className="flex justify-between py-0.5">
                  <span>{i.name} × {i.qty}</span><span className="font-semibold">{money(i.price * i.qty)}</span>
                </div>
              ))}
              {order.extras.length > 0 && (
                <>
                  <div className="mt-2 mb-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">Extras</div>
                  {order.extras.map((i: CartItem) => (
                    <div key={i.id} className="flex justify-between py-0.5"><span>{i.name}</span><span className="font-semibold">{money(i.price)}</span></div>
                  ))}
                </>
              )}
            </div>
            <div className="flex items-center justify-between border-t pt-3">
              <span className="font-display text-lg font-bold">Grand Total</span>
              <span className="font-display text-xl font-bold" style={{ color: "var(--pink)" }}>{money(order.total)}</span>
            </div>
            <div className="text-right text-xs text-muted-foreground">{order.when}</div>
          </div>
        )}
        <button onClick={onClose} className="btn-pink mt-5 w-full rounded-full py-3.5 text-base font-semibold">
          Continue shopping
        </button>
      </div>
    </Modal>
  );
}

/* ==================== Modal shell ==================== */
function Modal({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open, onClose]);
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] grid place-items-center px-4 py-8">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl"
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
