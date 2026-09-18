import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  acceptAllPendingLegalDocuments,
  recordLegalAcceptance,
  getUserLegalState,
} from "@/lib/legal-acceptance";
import {
  getPendingLegalDocuments,
  CURRENT_LEGAL_VERSIONS,
  LEGAL_VERSIONS,
  type LegalDocumentKey,
} from "@/lib/legal-versions";

const VALID_DOCS: LegalDocumentKey[] = ["terms", "privacy", "guidelines"];

export async function POST(req: NextRequest) {
  const session = await getSessionUser();
  if (!session?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.id;
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    null;
  const userAgent = req.headers.get("user-agent");

  let body: { documents?: string[]; confirmAge?: boolean } = {};
  try {
    body = await req.json();
  } catch {
    // empty body → accept all pending
  }

  const confirmAge = body.confirmAge !== false;

  try {
    if (body.documents && Array.isArray(body.documents) && body.documents.length > 0) {
      const docs = body.documents.filter((d): d is LegalDocumentKey =>
        VALID_DOCS.includes(d as LegalDocumentKey)
      );
      if (docs.length === 0) {
        return NextResponse.json({ error: "No valid documents specified" }, { status: 400 });
      }
      await recordLegalAcceptance({
        userId,
        documents: docs,
        ipAddress: ip,
        userAgent,
        confirmAge,
      });
    } else {
      await acceptAllPendingLegalDocuments({
        userId,
        ipAddress: ip,
        userAgent,
        confirmAge,
      });
    }

    const state = await getUserLegalState(userId);
    return NextResponse.json({
      ok: true,
      state,
      message: "Legal documents accepted",
    });
  } catch (err) {
    console.error("[legal/accept]", err);
    return NextResponse.json(
      { error: "Failed to record acceptance" },
      { status: 500 }
    );
  }
}

export async function GET() {
  const session = await getSessionUser();
  if (!session?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const state = await getUserLegalState(session.id);
  if (!state) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const pending = getPendingLegalDocuments(state);

  return NextResponse.json({
    state,
    currentVersions: CURRENT_LEGAL_VERSIONS,
    pending,
    documents: pending.map((key) => ({
      key,
      ...LEGAL_VERSIONS[key],
    })),
  });
}
