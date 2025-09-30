"use client";
import { useEffect } from "react";

export default function Hero() {
  useEffect(() => {
    const canvasEl = document.getElementById("hero-canvas") as HTMLCanvasElement | null;
    if (!canvasEl) return;
    const c = canvasEl;                  // 👈 alias, TS knows it's not null
    const ctx = c.getContext("2d");
    if (!ctx) return;

    // resize canvas
    const resize = () => {
      c.width = window.innerWidth;
      c.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // particle type
    type Particle = {
      x: number;
      y: number;
      d: number;            // size factor (1..3)
      symbolIndex: number;  // 0..3  (+ - × ÷)
      vx: number;           // velocity x
      vy: number;           // velocity y
      a: number;            // rotation angle
      av: number;           // angular velocity
      phase: number;        // for bobbing
    };

    const rand = (min: number, max: number) => Math.random() * (max - min) + min;

    // create particles
    const particles: Particle[] = [];
    const COUNT = 110;
    for (let i = 0; i < COUNT; i++) {
      const d = rand(1, 3);
      const speed = rand(0.1, 0.35) / d;
      const dir = Math.random() * Math.PI * 2;
      particles.push({
        x: Math.random() * c.width,
        y: Math.random() * c.height,
        d,
        symbolIndex: Math.floor(Math.random() * 4),
        vx: Math.cos(dir) * speed,
        vy: Math.sin(dir) * speed,
        a: Math.random() * Math.PI * 2,
        av: rand(-0.01, 0.01),
        phase: Math.random() * Math.PI * 2,
      });
    }

    // mouse parallax influence
    let mouseX = 0, mouseY = 0;
    const onMouse = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", onMouse);

    const symbols = ["+", "-", "×", "÷"];

    // get CSS variables dynamically
    const rootStyle = getComputedStyle(document.documentElement);
    const palette = [
      rootStyle.getPropertyValue("--red").trim(),
      rootStyle.getPropertyValue("--deepblue").trim(),
      rootStyle.getPropertyValue("--yellow").trim(),
      rootStyle.getPropertyValue("--teal").trim(),
    ];

    // draw loop
    function draw(t: number) {
       if (!ctx) return; // TS now knows ctx isn’t null

      ctx.clearRect(0, 0, c.width, c.height);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.a += p.av;

        const bob = Math.sin(t * 0.002 + p.phase) * 0.3;

        // edge wrap
        const margin = 24;
        if (p.x < -margin) p.x = c.width + margin;
        if (p.x > c.width + margin) p.x = -margin;
        if (p.y < -margin) p.y = c.height + margin;
        if (p.y > c.height + margin) p.y = -margin;

        const px = p.x + mouseX * 20 * (p.d * 0.5);
        const py = p.y + mouseY * 20 * (p.d * 0.5) + bob;

        if (!isFinite(px) || !isFinite(py)) continue;

        const symbol = symbols[p.symbolIndex];
        const color = palette[p.symbolIndex % palette.length] || "#fff";

        const baseSize = 16 * p.d;
        const pulse = 1 + Math.sin(t * 0.003 + p.phase) * 0.06;
        const fontPx = Math.max(10, baseSize * pulse);

        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(p.a);
        ctx.font = `${fontPx}px Poppins, system-ui, sans-serif`;
        ctx.fillStyle = color;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(symbol, 0, 0);
        ctx.restore();
      }

      requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouse);
    };
  }, []);

  return (
    <section className="hero">
      <canvas id="hero-canvas" className="hero-canvas"></canvas>
      <div className="hero-inner">
        <h1>DDCT Showcase</h1>
        <p>Digital Design & Creative Technology</p>
      </div>
    </section>
  );
}
