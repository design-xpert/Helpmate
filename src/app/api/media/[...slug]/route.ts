import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://helpmate-api.kvtmedia.com";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  try {
    const { slug } = await params;
    const path = slug.join("/");
    const search = request.nextUrl.search;
    const targetUrl = `${API_BASE}/api/media/${path}${search}`;

    const res = await fetch(targetUrl, {
      method: "GET",
      headers: {
        // Pass through accept headers
        accept: request.headers.get("accept") || "*/*",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return new NextResponse(null, { status: res.status });
    }

    const contentType = res.headers.get("content-type") || "application/octet-stream";
    const buffer = await res.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "no-cache, no-store, max-age=0, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
        "Cross-Origin-Resource-Policy": "cross-origin",
      },
    });
  } catch (error) {
    return new NextResponse(null, { status: 500 });
  }
}
