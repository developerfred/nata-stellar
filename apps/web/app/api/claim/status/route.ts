import { NextResponse } from "next/server";
import { rpcServer } from "@/lib/chain";
import { allow } from "@/lib/server/ratelimit";

/** Confirmation status of a submitted claim, polled by the client when /api/claim returned pending. */
export async function GET(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!(await allow(`status:${ip}`, 60, 60_000))) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  const hash = new URL(req.url).searchParams.get("hash") ?? "";
  if (!/^[0-9a-f]{64}$/i.test(hash)) return NextResponse.json({ error: "Bad hash" }, { status: 400 });
  try {
    const r = await rpcServer().getTransaction(hash);
    return NextResponse.json({ status: r.status });
  } catch {
    return NextResponse.json({ status: "NOT_FOUND" });
  }
}
