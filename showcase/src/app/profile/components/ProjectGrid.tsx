'use client';
import './projectgrid.css';

type Project = { id: string; title: string; image: string; slug: string };

export default function ProjectGrid({ projects }: { projects: Project[] }) {
  return (
    <div className="grid">
      {projects.map((p) => (
        <a key={p.id} className="card" href={`/projects/${p.slug}`}>
          <img src={p.image} alt={p.title} />
          <h3><span className="project-link">{p.title}</span></h3>
        </a>
      ))}
    </div>
  );
}
