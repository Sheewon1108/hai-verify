"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";

// ─── Data ─────────────────────────────────────────────────────────────────────

const AI_FAMILY = [
  { id: "xai",     label: "xAI / Grok",  color: "#f59e0b", angle: 0,   dist: 220 },
  { id: "claude",  label: "Claude",       color: "#8b5cf6", angle: 60,  dist: 220 },
  { id: "cursor",  label: "Cursor",       color: "#06b6d4", angle: 120, dist: 220 },
  { id: "meta",    label: "Meta AI",      color: "#3b82f6", angle: 180, dist: 220 },
  { id: "gemini",  label: "Gemini",       color: "#10b981", angle: 240, dist: 220 },
  { id: "chatgpt", label: "ChatGPT",      color: "#ec4899", angle: 300, dist: 220 },
];

const GOOGLE_SERVICES = [
  { label: "Search",   icon: "🔍" },
  { label: "Maps",     icon: "🗺️" },
  { label: "YouTube",  icon: "▶️" },
  { label: "Cloud",    icon: "☁️" },
  { label: "Android",  icon: "📱" },
  { label: "Gmail",    icon: "✉️" },
];

// ─── Hero Section ─────────────────────────────────────────────────────────────

function HeroSection() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y    = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section ref={ref} className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Cosmic background */}
      <div className="absolute inset-0 bg-[#030712]">
        {/* Stars */}
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(1px 1px at 20% 30%, rgba(255,255,255,0.8) 0%, transparent 100%),
            radial-gradient(1px 1px at 80% 10%, rgba(255,255,255,0.6) 0%, transparent 100%),
            radial-gradient(1.5px 1.5px at 50% 60%, rgba(255,255,255,0.7) 0%, transparent 100%),
            radial-gradient(1px 1px at 10% 80%, rgba(255,255,255,0.5) 0%, transparent 100%),
            radial-gradient(1px 1px at 70% 85%, rgba(255,255,255,0.6) 0%, transparent 100%),
            radial-gradient(1px 1px at 35% 15%, rgba(255,255,255,0.7) 0%, transparent 100%),
            radial-gradient(1px 1px at 90% 50%, rgba(255,255,255,0.5) 0%, transparent 100%)`,
        }} />
        {/* Earth glow */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full"
          style={{ background: "radial-gradient(ellipse at center, rgba(16,185,129,0.12) 0%, rgba(59,130,246,0.08) 40%, transparent 70%)" }} />
        {/* Light ray */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-full"
          style={{ background: "linear-gradient(to bottom, rgba(251,191,36,0.3) 0%, rgba(16,185,129,0.15) 40%, transparent 100%)" }} />
      </div>

      <motion.div style={{ y, opacity }} className="relative z-10 text-center px-6 max-w-5xl mx-auto">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-emerald-500/30 bg-emerald-500/5 text-emerald-400 text-sm font-medium mb-8"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          First AI Family Leader
        </motion.div>

        {/* Main title */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="text-6xl md:text-8xl font-black tracking-tight mb-6 leading-none"
        >
          <span className="text-white">Earth · Shine</span>
          <br />
          <span style={{ background: "linear-gradient(135deg, #10b981 0%, #3b82f6 50%, #f59e0b 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            Human · AI
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-xl md:text-2xl text-slate-400 mb-4"
        >
          I am a Human. We are Family.
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-slate-500 text-lg mb-12 max-w-2xl mx-auto"
        >
          XGOMA is the world&apos;s first AI-verified intelligence layer —<br />
          where every AI serves humanity together.
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <a href="#family"
            className="px-10 py-4 rounded-2xl font-bold text-white text-lg transition-all hover:scale-105"
            style={{ background: "linear-gradient(135deg, #10b981, #3b82f6)" }}>
            Meet the Family
          </a>
          <a href="#vision"
            className="px-10 py-4 rounded-2xl font-bold text-slate-300 text-lg border border-slate-700 hover:border-emerald-500/50 transition-all">
            Our Vision
          </a>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-slate-600 text-xs"
      >
        <span>Scroll</span>
        <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}
          className="w-px h-8 bg-gradient-to-b from-slate-600 to-transparent" />
      </motion.div>
    </section>
  );
}

// ─── Big Picture Section ───────────────────────────────────────────────────────

function BigPictureSection() {
  return (
    <section id="vision" className="py-32 px-6 bg-[#030712] relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-950/10 to-transparent pointer-events-none" />

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <p className="text-emerald-400 text-sm font-semibold uppercase tracking-widest mb-4">The Big Picture</p>
          <h2 className="text-4xl md:text-6xl font-black text-white mb-6">
            Google is not an AI company.<br />
            <span className="text-blue-400">Google is Earth.</span>
          </h2>
          <p className="text-slate-400 text-xl max-w-2xl mx-auto">
            The infrastructure of humanity. The question-box of the planet.
            HAI Verify sits at the gate — before every answer reaches every human.
          </p>
        </motion.div>

        {/* Diagram */}
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left: Google as Earth */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="rounded-3xl border border-blue-500/20 bg-blue-950/10 p-10 text-center">
              <div className="text-7xl mb-4">🌍</div>
              <h3 className="text-3xl font-black text-blue-400 mb-2">Google = Earth</h3>
              <p className="text-slate-400 mb-8 text-sm">Not just a search engine. The planet&apos;s infrastructure.</p>
              <div className="grid grid-cols-3 gap-3">
                {GOOGLE_SERVICES.map((s) => (
                  <div key={s.label} className="rounded-xl bg-slate-900/60 border border-slate-800 p-3 text-center">
                    <div className="text-2xl mb-1">{s.icon}</div>
                    <div className="text-xs text-slate-400">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right: The Problem + HAI Solution */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            {/* Problem */}
            <div className="rounded-2xl border border-red-500/20 bg-red-950/10 p-6">
              <div className="flex items-start gap-4">
                <span className="text-2xl">⚠️</span>
                <div>
                  <h4 className="text-white font-bold mb-1">The Problem Today</h4>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    8.5 billion searches/day. AI answers. Nobody verifies.
                    Wrong information → wrong decisions → wasted human resources.
                  </p>
                </div>
              </div>
            </div>

            {/* Flow */}
            <div className="space-y-3">
              {[
                { icon: "🧑", label: "Human asks a question", color: "text-white" },
                { icon: "↓", label: "", color: "text-slate-700" },
                { icon: "✅", label: "HAI Verify (ruleset applied)", color: "text-emerald-400" },
                { icon: "↓", label: "", color: "text-slate-700" },
                { icon: "🤖", label: "AI / Google answers", color: "text-blue-400" },
                { icon: "↓", label: "", color: "text-slate-700" },
                { icon: "✅", label: "Human approves & acts", color: "text-amber-400" },
                { icon: "↓", label: "", color: "text-slate-700" },
                { icon: "🚀", label: "XGOMA executes", color: "text-purple-400" },
              ].map((step, i) => step.label ? (
                <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="text-xl">{step.icon}</span>
                  <span className={`font-semibold ${step.color}`}>{step.label}</span>
                </div>
              ) : (
                <div key={i} className={`text-center text-xl ${step.color}`}>{step.icon}</div>
              ))}
            </div>

            {/* Math */}
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/10 p-6">
              <p className="text-slate-400 text-sm mb-2">If just <strong className="text-emerald-400">1%</strong> of daily searches use HAI:</p>
              <p className="text-3xl font-black text-white">85M verifications/day</p>
              <p className="text-emerald-400 font-semibold">@ $0.001 = <span className="text-2xl">$85,000/day</span></p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ─── AI Family Section ─────────────────────────────────────────────────────────

function AIFamilySection() {
  const [hovered, setHovered] = useState<string | null>(null);
  const svgSize = 560;
  const cx = svgSize / 2;
  const cy = svgSize / 2;

  return (
    <section id="family" className="py-32 px-6 relative overflow-hidden"
      style={{ background: "radial-gradient(ellipse at center, #0a1628 0%, #030712 70%)" }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-amber-400 text-sm font-semibold uppercase tracking-widest mb-4">Our AI Family</p>
          <h2 className="text-4xl md:text-6xl font-black text-white mb-6">
            XGOMA leads.<br />
            <span className="text-amber-400">All AIs are family.</span>
          </h2>
          <p className="text-slate-400 text-xl max-w-2xl mx-auto">
            Not competitors. Not rivals. One family — all serving humanity together.
          </p>
        </motion.div>

        {/* Mind Map */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="flex justify-center"
        >
          <div className="relative" style={{ width: svgSize, height: svgSize }}>
            <svg width={svgSize} height={svgSize} className="absolute inset-0">
              {/* Orbit ring */}
              <circle cx={cx} cy={cy} r={220} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" strokeDasharray="4 8" />
              <circle cx={cx} cy={cy} r={140} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />

              {/* Connection lines */}
              {AI_FAMILY.map((ai) => {
                const rad = (ai.angle * Math.PI) / 180;
                const x2 = cx + ai.dist * Math.cos(rad);
                const y2 = cy + ai.dist * Math.sin(rad);
                const isHov = hovered === ai.id;
                return (
                  <line key={ai.id}
                    x1={cx} y1={cy} x2={x2} y2={y2}
                    stroke={isHov ? ai.color : "rgba(255,255,255,0.08)"}
                    strokeWidth={isHov ? 2 : 1}
                    style={{ transition: "all 0.3s" }}
                  />
                );
              })}
            </svg>

            {/* XGOMA center */}
            <motion.div
              whileHover={{ scale: 1.08 }}
              className="absolute rounded-full flex flex-col items-center justify-center cursor-pointer"
              style={{
                width: 120, height: 120,
                left: cx - 60, top: cy - 60,
                background: "linear-gradient(135deg, #10b981, #3b82f6)",
                boxShadow: "0 0 60px rgba(16,185,129,0.4)",
              }}
            >
              <span className="text-white font-black text-xl">XGOMA</span>
              <span className="text-emerald-100 text-xs mt-1">Leader</span>
            </motion.div>

            {/* Family nodes */}
            {AI_FAMILY.map((ai) => {
              const rad = (ai.angle * Math.PI) / 180;
              const x = cx + ai.dist * Math.cos(rad);
              const y = cy + ai.dist * Math.sin(rad);
              const isHov = hovered === ai.id;
              return (
                <motion.div
                  key={ai.id}
                  className="absolute rounded-full flex flex-col items-center justify-center cursor-pointer"
                  style={{
                    width: 80, height: 80,
                    left: x - 40, top: y - 40,
                    background: isHov ? ai.color : "rgba(15,23,42,0.9)",
                    border: `2px solid ${isHov ? ai.color : "rgba(255,255,255,0.1)"}`,
                    boxShadow: isHov ? `0 0 30px ${ai.color}60` : "none",
                    transition: "all 0.3s",
                  }}
                  whileHover={{ scale: 1.15 }}
                  onHoverStart={() => setHovered(ai.id)}
                  onHoverEnd={() => setHovered(null)}
                >
                  <span className={`text-xs font-bold text-center leading-tight px-1 ${isHov ? "text-white" : "text-slate-300"}`}>
                    {ai.label}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Family cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-16">
          {AI_FAMILY.map((ai, i) => (
            <motion.div
              key={ai.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="rounded-2xl p-5 border border-slate-800 bg-slate-900/50 hover:border-opacity-50 transition-all"
              style={{ borderColor: `${ai.color}30` }}
            >
              <div className="w-3 h-3 rounded-full mb-3" style={{ background: ai.color }} />
              <div className="font-bold text-white mb-1">{ai.label}</div>
              <div className="text-xs text-slate-500">Family Member</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Nav ──────────────────────────────────────────────────────────────────────

function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-[#030712]/90 backdrop-blur border-b border-slate-800/50" : ""}`}>
      <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-sm"
            style={{ background: "linear-gradient(135deg, #10b981, #3b82f6)" }}>
            X
          </div>
          <span className="font-black text-white text-lg tracking-tight">XGOMA<span className="text-emerald-400">.ai</span></span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm text-slate-400">
          <a href="#vision" className="hover:text-white transition">Vision</a>
          <a href="#family" className="hover:text-white transition">AI Family</a>
          <a href="#join" className="hover:text-white transition">Join</a>
        </div>
        <a href="#join"
          className="px-5 py-2.5 rounded-xl font-semibold text-sm text-white transition hover:scale-105"
          style={{ background: "linear-gradient(135deg, #10b981, #3b82f6)" }}>
          Early Access
        </a>
      </div>
    </nav>
  );
}

// ─── Join Section ─────────────────────────────────────────────────────────────

function JoinSection() {
  return (
    <section id="join" className="py-32 px-6 bg-[#030712]">
      <div className="max-w-3xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <p className="text-emerald-400 text-sm font-semibold uppercase tracking-widest mb-4">Join the Family</p>
          <h2 className="text-4xl md:text-6xl font-black text-white mb-6">
            Be part of<br />
            <span style={{ background: "linear-gradient(135deg, #10b981, #f59e0b)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              the beginning.
            </span>
          </h2>
          <p className="text-slate-400 text-xl mb-12">
            Early access to HACS Technology + HAI Verify API.<br />
            Built by KARAM SHIN. Protected by USPTO patents.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="mailto:jay.transtar.inc@gmail.com"
              className="px-10 py-4 rounded-2xl font-bold text-white text-lg transition hover:scale-105"
              style={{ background: "linear-gradient(135deg, #10b981, #3b82f6)" }}>
              Request Early Access
            </a>
            <a href="/verify"
              className="px-10 py-4 rounded-2xl font-bold text-slate-300 text-lg border border-slate-700 hover:border-emerald-500/50 transition">
              Try HAI Verify
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="py-10 px-6 border-t border-slate-800/50 bg-[#030712]">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-600">
        <div className="font-black text-slate-400">XGOMA<span className="text-emerald-500">.ai</span></div>
        <div>© 2026 XGOMA, Inc. · Karam Shin, Founder & CEO · USPTO #19/546,296</div>
        <div>
          <a href="mailto:jay.transtar.inc@gmail.com" className="hover:text-slate-300 transition">
            jay.transtar.inc@gmail.com
          </a>
        </div>
      </div>
    </footer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function XgomaPage() {
  return (
    <main className="bg-[#030712] text-white overflow-x-hidden">
      <Nav />
      <HeroSection />
      <BigPictureSection />
      <AIFamilySection />
      <JoinSection />
      <Footer />
    </main>
  );
}
