import { openApiSpec } from "@/lib/docs/openapi";

export function GET() {
  return Response.json(openApiSpec());
}
