export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  return (
    <section className="section shell">
      <div className="eyebrow">Organization catalog</div>
      <h1>{q ? `Results for “${q}”` : "Browse products"}</h1>
      <p>
        Product results are filtered server-side by the authenticated
        organization’s catalog assignment.
      </p>
      <div className="card">
        <strong>Connect a catalog service to populate this view.</strong>
        <p>
          The empty state is intentional: catalog visibility is never inferred
          or broadened on the client.
        </p>
      </div>
    </section>
  );
}
