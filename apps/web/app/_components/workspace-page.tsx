export function WorkspacePage({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <section className="section shell">
      <div className="eyebrow">{eyebrow}</div>
      <h1>{title}</h1>
      <p>{description}</p>
      <div className="card">
        <strong>No items need your attention.</strong>
        <p>
          This server-rendered empty state will be replaced with tenant-scoped
          data once a session is established.
        </p>
      </div>
    </section>
  );
}
