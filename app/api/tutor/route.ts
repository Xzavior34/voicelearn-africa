import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { processLearnerTurn } from "@/lib/tutor/session";
import { LearningSessionSchema, createInitialSession } from "@/lib/tutor/schema";

export const runtime = "nodejs";

const RequestSchema = z.object({
  transcript: z.string().min(1).max(2000),
  session: LearningSessionSchema.optional(),
});

/**
 * Runs one learner turn through the tutor pipeline. Accepts a
 * transcript (produced client-side by calling /api/speech first) plus
 * the current session state, and returns the updated session and
 * tutor response. Session state lives on the client between calls —
 * this route is stateless and validates every input/output through
 * the shared zod schemas so malformed data never reaches the UI.
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Expected JSON body." }, { status: 400 });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request.", details: parsed.error.issues }, { status: 400 });
  }

  const session = parsed.data.session ?? createInitialSession();

  try {
    const turn = processLearnerTurn(session, parsed.data.transcript);
    return NextResponse.json(turn);
  } catch {
    return NextResponse.json({ error: "Tutor reasoning failed unexpectedly." }, { status: 500 });
  }
}
