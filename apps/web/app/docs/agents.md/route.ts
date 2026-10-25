import { agentsGuide } from "@/lib/docs/agents";

export function GET() {
  return new Response(agentsGuide(), { headers: { "content-type": "text/markdown; charset=utf-8" } });
}
