import { NextResponse } from "next/server";
import { moveCard, updateCard } from "@agentboard/core";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  let result;
  if (typeof body.status === "string") {
    result = moveCard(id, body.status);
  } else {
    result = updateCard(id, {
      title: body.title !== undefined ? body.title : undefined,
      description: body.description !== undefined ? body.description : undefined,
      priority: typeof body.priority === "number" ? body.priority : undefined,
      error: body.error !== undefined ? body.error : undefined
    });
  }
  if (!result.ok) return NextResponse.json(result, { status: 409 });
  return NextResponse.json(result);
}
