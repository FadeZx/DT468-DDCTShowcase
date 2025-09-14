'use client';
import { useEffect, useRef } from 'react';

type Props = { title: string; image: string; href?: string; };

export default function ProjectCard({ title, image, href = '#' }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced || !('IntersectionObserver' in window)) {
      el.classList.add('revealed'); return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => { if (entry.isIntersecting) { el.classList.add('revealed'); io.unobserve(el); } });
    }, { threshold: 0.12 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div className="card" ref={ref}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={image} alt={title} />
      <h3><a className="project-link" href={href}>{title}</a></h3>
    </div>
  );
}
