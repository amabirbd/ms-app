const metrics = [
  ["Orders today", "1,284"],
  ["Revenue", "$428.6K"],
  ["Open quotes", "93"],
  ["Saga alerts", "4"],
];
export default function AdminHome() {
  return (
    <main style={{ maxWidth: 1200, margin: "auto", padding: 32 }}>
      <p
        style={{
          color: "#58697a",
          textTransform: "uppercase",
          letterSpacing: 2,
          fontSize: 12,
        }}
      >
        Operations workspace
      </p>
      <h1 style={{ fontSize: 40, marginTop: 0 }}>Good morning, operations</h1>
      <p>
        Every metric and action in this surface is permission-gated by the API;
        navigation visibility is convenience, not authorization.
      </p>
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))",
          gap: 16,
          marginTop: 32,
        }}
      >
        {metrics.map(([label, value]) => (
          <article
            key={label}
            style={{
              background: "white",
              border: "1px solid #dce1e7",
              padding: 22,
              borderRadius: 8,
            }}
          >
            <div style={{ color: "#647383" }}>{label}</div>
            <strong style={{ display: "block", fontSize: 30, marginTop: 10 }}>
              {value}
            </strong>
          </article>
        ))}
      </section>
    </main>
  );
}
