import { NextResponse } from "next/server";

// Proxies an external product image server-side so the browser can turn it
// into a File for upload without hitting CORS restrictions on retailer CDNs.
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get("url");

  if (!imageUrl) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  try {
    const response = await fetch(imageUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Retailer image request failed (status ${response.status}).` },
        { status: 502 }
      );
    }

    const contentType = response.headers.get("content-type") || "";

    // A retailer that blocks non-browser requests often still returns 200
    // with an HTML bot-check page instead of the image. Catch that here
    // instead of silently uploading mislabeled HTML as an "image" later.
    if (!contentType.startsWith("image/")) {
      return NextResponse.json(
        {
          error: `That link didn't return an image (got "${contentType || "unknown type"}"). The retailer may be blocking automated requests.`,
        },
        { status: 502 }
      );
    }

    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      headers: { "Content-Type": contentType },
    });
  } catch (err) {
    return NextResponse.json({ error: "Could not fetch image" }, { status: 502 });
  }
}
