import './frontpage.css';

import Hero from './components/Hero';
import Tags from './components/Tags';
import ProjectGrid from './profile/components/ProjectGrid';

// Example project data (replace with real data or fetch from API)
const projects = [
  { id: '1', title: 'Project 1', image: 'https://placehold.co/600x300/f1d7c9/521c0d?text=Project+1', slug: 'project-1' },
  { id: '2', title: 'Project 2', image: 'https://placehold.co/600x300/ffd6b3/521c0d?text=Project+2', slug: 'project-2' },
  { id: '3', title: 'Project 3', image: 'https://placehold.co/600x300/ffc38f/521c0d?text=Project+3', slug: 'project-3' },
  { id: '4', title: 'Project 4', image: 'https://placehold.co/600x300/ffaf6a/521c0d?text=Project+4', slug: 'project-4' },
  { id: '5', title: 'Project 5', image: 'https://placehold.co/600x300/ffa251/521c0d?text=Project+5', slug: 'project-5' },
  { id: '6', title: 'Project 6', image: 'https://placehold.co/600x300/ff9b45/521c0d?text=Project+6', slug: 'project-6' },
  { id: '7', title: 'Project 7', image: 'https://placehold.co/600x300/f07e2b/ffffff?text=Project+7', slug: 'project-7' },
  { id: '8', title: 'Project 8', image: 'https://placehold.co/600x300/d5451b/ffffff?text=Project+8', slug: 'project-8' },
  { id: '9', title: 'Project 9', image: 'https://placehold.co/600x300/8f2e17/ffffff?text=Project+9', slug: 'project-9' },
  { id: '10', title: 'Project 10', image: 'https://placehold.co/600x300/521c0d/ffffff?text=Project+10', slug: 'project-10' },
];

export default function Page() {
  return (
    <main>
      <nav>
        <div className="logo">DDCT Showcase</div>
        <a className="profile-btn" href="/profile">Profile</a>
      </nav>

      <Hero />
      <Tags />

      <section id="projects" aria-label="Projects">
        <ProjectGrid projects={projects} />
      </section>

      <footer>
        © 2025 DDCT Portfolio Showcase | Digital Design & Creative Technology (KMUTT)
      </footer>
    </main>
  );
}
