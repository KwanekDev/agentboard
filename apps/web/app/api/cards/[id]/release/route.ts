import { NextResponse } from "next/server";
import { releaseCard } from "@agentboard/core";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return NextResponse.json(releaseCard(id));
}
