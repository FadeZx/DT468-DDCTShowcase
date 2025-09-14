'use client';
import { useEffect, useRef } from 'react';

export default function Hero() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

  useEffect(() => {
    // init once
    const init = () => {
      const cEl = canvasRef.current;
      if (!cEl) return;
      const ctx = cEl.getContext('2d', { alpha: true });
      if (!ctx) return;
      ctxRef.current = ctx;
    };
    init();

    let W = 0, H = 0, DPR = Math.min(window.devicePixelRatio || 1, 2);
    let particles: Array<{x:number;y:number;r:number;a:number;vx:number;vy:number;tw:number;t:number;d:number}> = [];

    const MAX = 90, BASE_SPEED = 0.15;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let mouseX = 0, mouseY = 0;
    let rafId = 0;

    function resize() {
      const cEl = canvasRef.current;
      const ctx = ctxRef.current;
      if (!cEl || !ctx) return;

      const parent = cEl.parentElement;
      if (!parent) return;

      const rect = parent.getBoundingClientRect();
      W = Math.floor(rect.width); H = Math.floor(rect.height);
      cEl.width = Math.floor(W * DPR); cEl.height = Math.floor(H * DPR);
      cEl.style.width = W + 'px'; cEl.style.height = H + 'px';
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }

    function rand(min:number, max:number){ return Math.random() * (max - min) + min; }

    function spawn(n = MAX) {
      particles.length = 0;
      for (let i = 0; i < n; i++) {
        particles.push({
          x: rand(0, W), y: rand(0, H),
          r: rand(1.2, 2.8), a: rand(0.35, 0.95),
          vx: rand(-BASE_SPEED, BASE_SPEED), vy: rand(-BASE_SPEED, BASE_SPEED),
          tw: rand(1, 2.5), t: rand(0, Math.PI * 2), d: rand(0.3, 1.4),
        });
      }
    }

    function draw() {
      const ctx = ctxRef.current;
      if (!ctx) return;

      ctx.clearRect(0, 0, W, H);
      for (const p of particles) {
        p.x += p.vx * (0.6 + p.d);
        p.y += p.vy * (0.6 + p.d);
        if (p.x < -10) p.x = W + 10;
        if (p.x > W + 10) p.x = -10;
        if (p.y < -10) p.y = H + 10;
        if (p.y > H + 10) p.y = -10;

        p.t += 0.02 * p.tw;
        const twinkle = 0.5 + Math.sin(p.t) * 0.5;
        const alpha = p.a * (0.6 + 0.4 * twinkle);

        const px = p.x + mouseX * 15 * p.d;
        const py = p.y + mouseY * 15 * p.d;

        const grad = ctx.createRadialGradient(px, py, 0, px, py, 12 * p.d);
        grad.addColorStop(0, `rgba(255,155,69,${alpha})`);
        grad.addColorStop(0.6, `rgba(213,69,27,${alpha*0.6})`);
        grad.addColorStop(1, `rgba(213,69,27,0)`);
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(px, py, 12 * p.d, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        ctx.beginPath(); ctx.arc(px, py, p.r, 0, Math.PI * 2); ctx.fill();
      }
      rafId = requestAnimationFrame(draw);
    }

    function start(){ resize(); spawn(prefersReduced ? 0 : MAX); if (!prefersReduced) draw(); }
    function stop(){ cancelAnimationFrame(rafId); }

    const onMove = (e: MouseEvent) => {
      const cEl = canvasRef.current;
      if (!cEl) return;
      const rect = cEl.getBoundingClientRect();
      mouseX = (e.clientX - rect.left)/W - 0.5;
      mouseY = (e.clientY - rect.top)/H - 0.5;
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('resize', () => { resize(); spawn(particles.length || MAX); }, { passive: true });

    const hero = canvasRef.current?.parentElement;
    let io: IntersectionObserver | null = null;
    if (hero && 'IntersectionObserver' in window) {
      io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !prefersReduced) start();
          else stop();
        });
      }, { threshold: 0.05 });
      io.observe(hero);
    } else {
      start();
    }

    return () => {
      stop();
      window.removeEventListener('mousemove', onMove);
      if (io) io.disconnect();
    };
  }, []);

  return (
    <section className="hero" aria-label="Intro">
      <canvas ref={canvasRef} className="hero-canvas" />
      <div className="hero-inner">
        <h1>✨ Showcase Creativity. Share Projects. Inspire Together. ✨</h1>
        <p>A platform for students, teachers, and admins to create, collaborate, and showcase works.</p>
        <button
          className="btn-primary"
          onClick={() => document.getElementById('tags')?.scrollIntoView({ behavior: 'smooth' })}
        >
          Explore Projects
        </button>
      </div>
    </section>
  );
}
