import { mcpManifest } from "@/lib/docs/agents";

export function GET() {
  return Response.json(mcpManifest());
}
