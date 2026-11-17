import { NextResponse } from "next/server";
import { getBoard } from "@agentboard/core";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const board = getBoard(id);
  if (!board) return NextResponse.json({ error: "project not found" }, { status: 404 });
  return NextResponse.json(board);
}
