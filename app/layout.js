import "./globals.css";

export const metadata = {
  title: "Atlas OS",
  description: "Market Intelligence Command Center"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
