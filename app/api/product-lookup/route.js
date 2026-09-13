import { NextResponse } from "next/server";
import { lookupProduct } from "../../../lib/productLookup";

export async function POST(request) {
  let url;

  try {
    ({ url } = await request.json());
  } catch (err) {
    return NextResponse.json({ supported: false }, { status: 400 });
  }

  if (!url || typeof url !== "string") {
    return NextResponse.json({ supported: false }, { status: 400 });
  }

  const result = await lookupProduct(url);
  return NextResponse.json(result);
}
