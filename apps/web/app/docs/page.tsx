import type { Metadata } from "next";
import { DocsView } from "@/components/DocsView";

export const metadata: Metadata = {
  title: "nata docs: MCP and skill for agents",
  description: "How AI agents install and use the nata MCP server and Claude skill to create pay-per-visit campaigns on Stellar Testnet.",
  alternates: { types: { "text/markdown": "/docs/agents.md" } },
};

export default function DocsPage() {
  return <DocsView />;
}
