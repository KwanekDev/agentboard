import { NextResponse } from "next/server";
import { claimCard } from "@agentboard/core";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const session = typeof body.session === "string" && body.session.trim() ? body.session.trim() : "human";
  const result = claimCard(id, session, body.agent ?? null);
  if (!result.ok) return NextResponse.json(result, { status: 409 });
  return NextResponse.json(result);
}
