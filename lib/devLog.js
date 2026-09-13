// Development-only diagnostic logging for the image import/upload pipeline.
// process.env.NODE_ENV is inlined at build time by Next.js, so in a
// production build these calls compile away to a no-op check — nothing is
// logged and no diagnostic strings ship to users.
const isDevMode = process.env.NODE_ENV === "development";

export function devLog(label, detail) {
  if (!isDevMode) return;
  if (detail !== undefined) {
    // eslint-disable-next-line no-console
    console.log(`[image pipeline] ${label}`, detail);
  } else {
    // eslint-disable-next-line no-console
    console.log(`[image pipeline] ${label}`);
  }
}
