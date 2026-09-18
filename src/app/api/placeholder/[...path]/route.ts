import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { path: string[] } }
) {
  const resolvedParams = await params;
  const pathParts = resolvedParams.path || [];
  
  let width: number = 300;
  let height: number = 300;

  if (pathParts.length >= 2) {
    width = Number(pathParts[0]) || 300;
    height = Number(pathParts[1]) || 300;
  } else if (pathParts.length === 1) {
    width = Number(pathParts[0]) || 300;
    height = width;
  }

  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#f1f5f9;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#cbd5e1;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grad1)"/>
        <circle cx="${width/2}" cy="${height/3}" r="${Math.min(width, height)/8}" fill="white" opacity="0.9"/>
        <ellipse cx="${width/2}" cy="${height*2/3}" rx="${Math.min(width, height)/6}" ry="${Math.min(width, height)/4}" fill="white" opacity="0.9"/>
      </svg>`;

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
