'use client';

type Profile = {
  id: string;
  handle: string;
  name: string;
  email?: string;
  bio?: string;
  avatarUrl?: string;
  tags?: string[];
  links?: { label: string; url: string }[];
};

export default function ProfileHeader({ profile }: { profile: Profile }) {
  const exportProfile = () => {
    const blob = new Blob([JSON.stringify(profile, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${profile.handle}-profile.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'auto 1fr auto',
      gap: '1.5rem',
      background: 'var(--white)',
      padding: '1rem',
      borderRadius: '1rem',
      boxShadow: 'var(--card-shadow)'
    }}>
      <img
        src={profile.avatarUrl || 'https://placehold.co/160x160/cccccc/ffffff?text=Avatar'}
        alt={profile.name}
        style={{ width: 120, height: 120, borderRadius: 16, objectFit: 'cover' }}
      />

      <div>
        <h1>{profile.name}</h1>
        <div style={{ color: '#76412a' }}>@{profile.handle} · {profile.email}</div>
        {profile.bio && <p>{profile.bio}</p>}

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {(profile.tags || []).map(tag => (
            <span key={tag} className="tag">{tag}</span>
          ))}
        </div>

        <div style={{ marginTop: 10 }}>
          {(profile.links || []).map(link => (
            <a key={link.url} className="project-link" href={link.url} target="_blank">{link.label}</a>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button className="btn-primary" onClick={exportProfile}>Export Profile</button>
      </div>
    </div>
  );
}
