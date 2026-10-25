import type { Locale } from "@/lib/i18n/dictionaries";

/** Public, non-secret deployment facts. Same values as .env.example. */
export const FACTS = {
  network: "Stellar Testnet",
  campaignsContractId: "CBLE7UFHEZT7YCWABJN5JCH5V7O4BVUWRNCPYZ5HVTUKDGV3OIAVKSXV",
  tokenContractId: "CBR455EYJZ54MTAOGRKB6M2GCNFLENMVUOPEKXXDWVPODEZLRW7V2PRD",
  tokenSymbol: "vUSD",
  repo: "https://github.com/developerfred/nata-stellar",
} as const;

export const INSTALL_CMD = `cd packages/mcp && npm install && npm run build

claude mcp add nata \\
  -e NATA_AGENT_SECRET=<testnet S... secret of the agent account> \\
  -e NATA_CAMPAIGNS_CONTRACT_ID=${FACTS.campaignsContractId} \\
  -e NATA_TOKEN_CONTRACT_ID=${FACTS.tokenContractId} \\
  -e NATA_TOKEN_SYMBOL=${FACTS.tokenSymbol} \\
  -- node "$(pwd)/dist/index.js"`;

export const EXAMPLE = `get_agent_account {}
create_campaign {"title":"Cafe Nata","location":"Rua Augusta 10, Lisboa","kind":"Cafe","promo":"Free coffee visit reward","reward":"1.5","budget":"30","days":3,"dry_run":true}
create_campaign {...same input..., "dry_run":false}
get_claims {"campaign_id":"4"}
close_campaign {"campaign_id":"4"}`;

export const ENDPOINTS = [
  { path: "/docs", kind: "html" },
  { path: "/docs/agents.md", kind: "markdown" },
  { path: "/llms.txt", kind: "text" },
  { path: "/llms-full.txt", kind: "markdown" },
  { path: "/.well-known/mcp.json", kind: "json" },
] as const;

type ToolId = "get_agent_account" | "request_faucet" | "list_active_campaigns" | "get_campaign" | "get_claims" | "create_campaign" | "close_campaign";

export const TOOLS: { id: ToolId; inputs: string; write: boolean }[] = [
  { id: "get_agent_account", inputs: "none", write: false },
  { id: "request_faucet", inputs: "fund_xlm?: boolean (default true)", write: true },
  { id: "list_active_campaigns", inputs: "limit?: 1-100 (default 20)", write: false },
  { id: "get_campaign", inputs: "campaign_id: string", write: false },
  { id: "get_claims", inputs: "campaign_id: string, visitor?: G… or C… address", write: false },
  {
    id: "create_campaign",
    inputs: "title, location, reward, budget, kind?, description?, promo?, days? (1-90, default 7), signer_public_key?, dry_run?",
    write: true,
  },
  { id: "close_campaign", inputs: "campaign_id: string, dry_run?: boolean", write: true },
];

export const ENV_VARS: { name: string; note: Record<Locale, string> }[] = [
  { name: "NATA_AGENT_SECRET", note: { en: "Testnet secret key of the agent account. Without it the server is read-only.", pt: "Chave secreta testnet da conta do agente. Sem ela o servidor é só de leitura.", es: "Clave secreta testnet de la cuenta del agente. Sin ella el servidor es de solo lectura." } },
  { name: "NATA_CAMPAIGNS_CONTRACT_ID / NATA_TOKEN_CONTRACT_ID", note: { en: "Contracts to use. Required.", pt: "Contratos a usar. Obrigatórios.", es: "Contratos a usar. Obligatorios." } },
  { name: "NATA_MAX_BUDGET_PER_CALL", note: { en: "Cap for one create_campaign (default 100).", pt: "Limite por create_campaign (padrão 100).", es: "Límite por create_campaign (por defecto 100)." } },
  { name: "NATA_MAX_TOTAL_BUDGET", note: { en: "Cap for the whole session (default 500).", pt: "Limite da sessão inteira (padrão 500).", es: "Límite de toda la sesión (por defecto 500)." } },
  { name: "NATA_DRY_RUN", note: { en: "true turns every write into a preview.", pt: "true transforma toda escrita em prévia.", es: "true convierte toda escritura en vista previa." } },
  { name: "NATA_FAUCET_URL", note: { en: "Faucet endpoint of the web app, used by request_faucet.", pt: "Endpoint do faucet do app web, usado por request_faucet.", es: "Endpoint del faucet de la app web, usado por request_faucet." } },
];

type Tr = Record<Locale, string>;
type Rich = { title: Tr; body: Record<Locale, string[]> };

export const UI: Record<string, Tr> = {
  title: { en: "Docs for agents and humans", pt: "Documentação para agentes e pessoas", es: "Documentación para agentes y personas" },
  lead: {
    en: "nata has an MCP server and a Claude skill so AI agents can create and manage pay-per-visit campaigns on Stellar Testnet. Everything on this page is also available as plain text for agents.",
    pt: "O nata tem um servidor MCP e uma skill do Claude para que agentes de IA criem e gerenciem campanhas de pagamento por visita na Stellar Testnet. Tudo nesta página também está disponível em texto simples para agentes.",
    es: "nata tiene un servidor MCP y una skill de Claude para que los agentes de IA creen y gestionen campañas de pago por visita en Stellar Testnet. Todo lo de esta página también está en texto plano para agentes.",
  },
  tool: { en: "Tool", pt: "Ferramenta", es: "Herramienta" },
  inputs: { en: "Inputs", pt: "Entradas", es: "Entradas" },
  does: { en: "What it does", pt: "O que faz", es: "Qué hace" },
  variable: { en: "Variable", pt: "Variável", es: "Variable" },
  readonly: { en: "read-only", pt: "leitura", es: "lectura" },
  writes: { en: "writes", pt: "escreve", es: "escribe" },
  endpoints: { en: "Machine-readable endpoints", pt: "Endpoints para máquinas", es: "Endpoints para máquinas" },
};

export const TOOL_DESC: Record<ToolId, Tr> = {
  get_agent_account: { en: "Agent address, token balance and budget caps. Call first.", pt: "Endereço do agente, saldo do token e limites de orçamento. Chame primeiro.", es: "Dirección del agente, saldo del token y límites de presupuesto. Llámela primero." },
  request_faucet: { en: "Fund the agent with testnet XLM and vUSD.", pt: "Financia o agente com XLM e vUSD de teste.", es: "Financia al agente con XLM y vUSD de prueba." },
  list_active_campaigns: { en: "Campaigns running now, newest first.", pt: "Campanhas em andamento, mais novas primeiro.", es: "Campañas en curso, las más nuevas primero." },
  get_campaign: { en: "One campaign: place, reward, remaining budget, claims, status (running, scheduled, expired, exhausted, closed).", pt: "Uma campanha: local, recompensa, orçamento restante, resgates, status (running, scheduled, expired, exhausted, closed).", es: "Una campaña: lugar, recompensa, presupuesto restante, canjes, estado (running, scheduled, expired, exhausted, closed)." },
  get_claims: { en: "Claim count, payout so far, and whether a given wallet already claimed.", pt: "Número de resgates, total pago e se uma carteira já resgatou.", es: "Número de canjes, total pagado y si una billetera ya canjeó." },
  create_campaign: { en: "Lock a budget in escrow and create a campaign. Supports dry_run.", pt: "Bloqueia um orçamento em custódia e cria a campanha. Aceita dry_run.", es: "Bloquea un presupuesto en custodia y crea la campaña. Admite dry_run." },
  close_campaign: { en: "Close a campaign created by the agent account and refund the unspent budget.", pt: "Encerra uma campanha criada pela conta do agente e devolve o orçamento não gasto.", es: "Cierra una campaña creada por la cuenta del agente y devuelve el presupuesto no gastado." },
};

export const SECTIONS: { id: string; title: Tr; body: Record<Locale, string[]> }[] = [
  {
    id: "what",
    title: { en: "What the MCP does", pt: "O que o MCP faz", es: "Qué hace el MCP" },
    body: {
      en: ["The nata MCP server (stdio) lets an agent act as a merchant on Stellar Testnet: list and inspect campaigns, create one funded from the agent account, and close it to get the unspent budget back.", "Visitors claim rewards in the web app by scanning the counter QR. Agents never claim."],
      pt: ["O servidor MCP do nata (stdio) permite que um agente atue como comerciante na Stellar Testnet: listar e inspecionar campanhas, criar uma financiada pela conta do agente e encerrá-la para recuperar o orçamento não gasto.", "Os visitantes resgatam recompensas no app web lendo o QR do balcão. Agentes nunca resgatam."],
      es: ["El servidor MCP de nata (stdio) permite que un agente actúe como comercio en Stellar Testnet: listar e inspeccionar campañas, crear una financiada por la cuenta del agente y cerrarla para recuperar el presupuesto no gastado.", "Los visitantes canjean recompensas en la app web escaneando el QR del mostrador. Los agentes nunca canjean."],
    },
  },
  {
    id: "install",
    title: { en: "Install", pt: "Instalação", es: "Instalación" },
    body: {
      en: ["Build the server from the repository and register it with Claude Code. Use a dedicated testnet account; the secret is read from the environment of the MCP server and must never be pasted into chat."],
      pt: ["Compile o servidor a partir do repositório e registre-o no Claude Code. Use uma conta testnet dedicada; o segredo é lido do ambiente do servidor MCP e nunca deve ser colado no chat."],
      es: ["Compile el servidor desde el repositorio y regístrelo en Claude Code. Use una cuenta testnet dedicada; el secreto se lee del entorno del servidor MCP y nunca debe pegarse en el chat."],
    },
  },
  {
    id: "safety",
    title: { en: "Safety limits", pt: "Limites de segurança", es: "Límites de seguridad" },
    body: {
      en: ["Testnet only: other networks are refused.", "Keys come from the server environment only and are never logged.", "Budgets are capped per call and per session. Do not split a budget into many calls to get around a cap.", "Use dry_run first and get the user's confirmation before each real create_campaign or close_campaign.", "Only campaigns created by the agent account can be closed.", "Without NATA_AGENT_SECRET the server is read-only."],
      pt: ["Somente testnet: outras redes são recusadas.", "As chaves vêm só do ambiente do servidor e nunca são registradas em log.", "Orçamentos têm limite por chamada e por sessão. Não divida um orçamento em várias chamadas para contornar o limite.", "Use dry_run antes e peça a confirmação do usuário a cada create_campaign ou close_campaign real.", "Só campanhas criadas pela conta do agente podem ser encerradas.", "Sem NATA_AGENT_SECRET o servidor é somente de leitura."],
      es: ["Solo testnet: se rechazan otras redes.", "Las claves vienen solo del entorno del servidor y nunca se registran.", "Los presupuestos tienen límite por llamada y por sesión. No divida un presupuesto en varias llamadas para evitar el límite.", "Use dry_run primero y pida la confirmación del usuario en cada create_campaign o close_campaign real.", "Solo se pueden cerrar campañas creadas por la cuenta del agente.", "Sin NATA_AGENT_SECRET el servidor es de solo lectura."],
    },
  },
  {
    id: "example",
    title: { en: "Example", pt: "Exemplo", es: "Ejemplo" },
    body: {
      en: ["Launch a coffee promo: check the account, preview with dry_run, confirm with the user, create, then monitor and close."],
      pt: ["Lançar uma promoção de café: verifique a conta, faça a prévia com dry_run, confirme com o usuário, crie, depois acompanhe e encerre."],
      es: ["Lanzar una promoción de café: revise la cuenta, haga la vista previa con dry_run, confirme con el usuario, cree, luego monitoree y cierre."],
    },
  },
  {
    id: "skill",
    title: { en: "Claude skill", pt: "Skill do Claude", es: "Skill de Claude" },
    body: {
      en: [`The skill in skills/nata (SKILL.md and reference.md) tells an agent when and how to use the tools. Copy the folder to ~/.claude/skills/nata or .claude/skills/nata. Source: ${FACTS.repo}/tree/main/skills/nata`],
      pt: [`A skill em skills/nata (SKILL.md e reference.md) ensina o agente quando e como usar as ferramentas. Copie a pasta para ~/.claude/skills/nata ou .claude/skills/nata. Código: ${FACTS.repo}/tree/main/skills/nata`],
      es: [`La skill en skills/nata (SKILL.md y reference.md) enseña al agente cuándo y cómo usar las herramientas. Copie la carpeta a ~/.claude/skills/nata o .claude/skills/nata. Código: ${FACTS.repo}/tree/main/skills/nata`],
    },
  },
];

export type { Rich };
