const capabilities = [
  [
    "Contract catalog",
    "See only approved products and your negotiated prices.",
  ],
  [
    "Fast procurement",
    "Order by SKU, upload a CSV, or reuse a saved purchasing template.",
  ],
  [
    "Controlled spend",
    "Route purchases through cost centers and configurable approvals.",
  ],
];

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="shell">
          <div className="eyebrow">Business supply, without the friction</div>
          <h1>Your agreements. Your catalog. Ready to order.</h1>
          <p>
            One purchasing workspace for buyers, approvers, finance teams, and
            account managers.
          </p>
          <form className="search" action="/catalog">
            <input
              name="q"
              aria-label="Search products"
              placeholder="Search by product, SKU, or manufacturer…"
            />
            <button type="submit">Search catalog</button>
          </form>
        </div>
      </section>
      <section className="section shell">
        <div className="eyebrow">Built for how businesses buy</div>
        <h2>Less administration. More control.</h2>
        <div className="grid">
          {capabilities.map(([title, body]) => (
            <article className="card" key={title}>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
