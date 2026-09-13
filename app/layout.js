import "./globals.css";
import ServiceWorkerRegister from "../components/ServiceWorkerRegister";

export const metadata = {
  title: "NoMo",
  description: "nothiing & more — shared inventory management",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "NoMo",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#790000",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
