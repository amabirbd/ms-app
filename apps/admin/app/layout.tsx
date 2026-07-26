export default function Layout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily: "Inter, system-ui",
          background: "#f4f6f8",
          color: "#17212b",
        }}
      >
        {children}
      </body>
    </html>
  );
}
