'use client';
export default function Tags() {
  const tags = ['All', 'Games', 'Art', 'Animation', 'Others'];
  return (
    <section className="tags" id="tags" aria-label="Filters">
      {tags.map((t) => (
        <span key={t} className="tag">{t}</span>
      ))}
    </section>
  );
}
