import "./globals.css";
import { Inter, Mooli } from "next/font/google";

const mooli = Mooli({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display"
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body"
});

export const metadata = {
  title: "Higher Lower Game",
  description: "A split-screen higher lower game."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${mooli.variable} ${inter.variable}`}>{children}</body>
    </html>
  );
}
