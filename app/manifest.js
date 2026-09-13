export default function manifest() {
  return {
    name: "NoMo",
    short_name: "NoMo",
    description: "nothiing & more — shared inventory management",
    start_url: "/",
    display: "standalone",
    background_color: "#790000",
    theme_color: "#790000",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
