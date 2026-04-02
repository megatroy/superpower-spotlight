import "./globals.css";

export const metadata = {
  title: "Superpower Spotlight ✦",
  description: "Discover your team's superpowers",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <div style={{
          position: "fixed",
          bottom: 8,
          right: 12,
          fontFamily: "var(--font-display)",
          fontSize: "0.85rem",
          color: "var(--text-dim)",
          opacity: 0.5,
          pointerEvents: "none",
          zIndex: 9999,
        }}>
          v0.2.0
        </div>
      </body>
    </html>
  );
}
