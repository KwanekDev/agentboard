import { NextResponse } from "next/server";
import { addCard } from "@agentboard/core";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  if (!body.title || typeof body.title !== "string" || !body.title.trim()) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }
  try {
    const card = addCard(id, {
      title: body.title,
      description: typeof body.description === "string" ? body.description : null,
      priority: typeof body.priority === "number" ? body.priority : 1
    });
    return NextResponse.json({ card }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 404 });
  }
}
