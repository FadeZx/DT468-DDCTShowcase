import ProfileHeader from './components/ProfileHeader';
import EditProfileForm from './components/EditProfileForm';
import ProjectGrid from './components/ProjectGrid';

const demoProfile = {
  id: 'u1',
  handle: 'student-one',
  name: 'Student One',
  email: 'student@example.com',
  bio: 'Game Engineering student, focusing on Unity & XR.',
  avatarUrl: 'https://placehold.co/160x160/ff9b45/ffffff?text=S1',
  tags: ['Unity', '3D', 'Year3'],
  links: [
    { label: 'Itch.io', url: 'https://itch.io' },
    { label: 'YouTube', url: 'https://youtube.com' },
  ],
  projects: [
    { id: 'p1', title: 'Project 1', image: 'https://placehold.co/600x300/f1d7c9/521c0d?text=Project+1', slug: 'project-1' },
    { id: 'p2', title: 'Project 2', image: 'https://placehold.co/600x300/ffd6b3/521c0d?text=Project+2', slug: 'project-2' },
  ],
};

export default function ProfilePage() {
  return (
    <main>
      <nav>
        <div className="logo">DDCT Showcase</div>
        <a className="profile-btn" href="#">Logout</a>
      </nav>

      <section className="p-6 max-w-6xl mx-auto">
        <ProfileHeader profile={demoProfile} />

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '2rem', marginTop: '2rem' }}>
          <EditProfileForm initial={demoProfile} />
          <div>
            <h2 style={{ marginBottom: 12, fontWeight: 800 }}>Projects</h2>
            <ProjectGrid projects={demoProfile.projects} />
          </div>
        </div>
      </section>

      <footer>
        © 2025 DDCT Portfolio Showcase | Digital Design & Creative Technology (KMUTT)
      </footer>
    </main>
  );
}
