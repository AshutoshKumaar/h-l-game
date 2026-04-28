import "./globals.css";

export const metadata = {
  title: "Higher Lower Game",
  description: "A split-screen higher lower game."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
