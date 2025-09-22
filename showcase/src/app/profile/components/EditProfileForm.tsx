'use client';
import { useState } from 'react';

type Profile = {
  name: string;
  email?: string;
  bio?: string;
  tags?: string[];
  links?: { label: string; url: string }[];
};

export default function EditProfileForm({ initial }: { initial: Profile }) {
  const [name, setName] = useState(initial.name);
  const [bio, setBio] = useState(initial.bio || '');
  const [email, setEmail] = useState(initial.email || '');

  const onSave = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Saved: ${name}, ${email}, ${bio}`);
  };

  return (
    <form onSubmit={onSave} className="section">
      <h2>Edit Profile</h2>
      <label>
        <div>Name</div>
        <input value={name} onChange={e => setName(e.target.value)} />
      </label>
      <label>
        <div>Email</div>
        <input value={email} onChange={e => setEmail(e.target.value)} />
      </label>
      <label>
        <div>Bio</div>
        <textarea value={bio} onChange={e => setBio(e.target.value)} />
      </label>
      <button type="submit" className="btn-primary">Save</button>
    </form>
  );
}
