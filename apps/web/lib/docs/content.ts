import type { Locale } from "@/lib/i18n/dictionaries";

/** Public, non-secret deployment facts. Same values as .env.example. */
export const FACTS = {
  network: "Stellar Testnet",
  campaignsContractId: "CBLE7UFHEZT7YCWABJN5JCH5V7O4BVUWRNCPYZ5HVTUKDGV3OIAVKSXV",
  tokenContractId: "CBR455EYJZ54MTAOGRKB6M2GCNFLENMVUOPEKXXDWVPODEZLRW7V2PRD",
  tokenSymbol: "vUSD",
  tokenIssuer: "GDCSTIPNL2YTPNEYZWFVMSEYOW5SEFC6FFWU2CSIVS67CHCV34YS6B26",
  repo: "https://github.com/developerfred/nata-stellar",
} as const;

export const INSTALL_CMD = `cd packages/mcp && npm install && npm run build

claude mcp add nata \\
  -e NATA_AGENT_SECRET=<testnet S... secret of the agent account> \\
  -e NATA_CAMPAIGNS_CONTRACT_ID=${FACTS.campaignsContractId} \\
  -e NATA_TOKEN_CONTRACT_ID=${FACTS.tokenContractId} \\
  -e NATA_TOKEN_SYMBOL=${FACTS.tokenSymbol} \\
  -- node "$(pwd)/dist/index.js"`;

export const DEPLOY_ENV = `# Vercel: Root Directory = apps/web. Testnet only.

# Public (NEXT_PUBLIC_*): inlined in the browser bundle, never put a secret here
NEXT_PUBLIC_STELLAR_RPC_URL=https://soroban-testnet.stellar.org
NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
NEXT_PUBLIC_CAMPAIGNS_CONTRACT_ID=${FACTS.campaignsContractId}   # required
NEXT_PUBLIC_TOKEN_CONTRACT_ID=${FACTS.tokenContractId}   # required
NEXT_PUBLIC_TOKEN_SYMBOL=${FACTS.tokenSymbol}
NEXT_PUBLIC_TOKEN_ISSUER=${FACTS.tokenIssuer}   # vUSD issuer (G...)
NEXT_PUBLIC_FRIENDBOT_URL=https://friendbot.stellar.org
NEXT_PUBLIC_EXPLORER_URL=https://stellar.expert/explorer/testnet
NEXT_PUBLIC_WALLET_WASM_HASH=   # empty = device wallets (passkey factory not deployed, leave empty)
NEXT_PUBLIC_SITE_URL=   # optional, e.g. https://<host>: absolute links in /llms.txt

# Server only (never NEXT_PUBLIC_)
SPONSOR_SECRET=   # required: funded testnet account; pays claim fees (relayer fallback) and the trustline fee bump
UPSTASH_REDIS_REST_URL=   # or KV_REST_API_URL: shared rate limits, REQUIRED for the faucet on Vercel
UPSTASH_REDIS_REST_TOKEN=   # or KV_REST_API_TOKEN
RELAYER_URL=   # optional, needs RELAYER_API_KEY too; falls back to SPONSOR_SECRET
RELAYER_API_KEY=
RELAYER_TIMEOUT_MS=12000
CONFIRM_BUDGET_MS=20000
FAUCET_SECRET=   # MUST be the vUSD ISSUER secret (S...): it can mint unlimited vUSD, testnet-only dedicated key
FAUCET_AMOUNT=100
FAUCET_PER_ADDRESS_DAILY=3
FAUCET_PER_IP_DAILY=10
FAUCET_DAILY_BUDGET=20000
FAUCET_BUDGET_MS=8000
X402_PAY_TO=   # optional: receiving G... account with a vUSD trustline; unset = paid route answers 503
X402_ASSET=   # default: NEXT_PUBLIC_TOKEN_CONTRACT_ID
X402_PRICE=0.01
X402_NETWORK=stellar:testnet
X402_FACILITATOR_URL=https://www.x402.org/facilitator
X402_FACILITATOR_API_KEY=   # only for the OpenZeppelin facilitator`;

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
    en: "nata has an MCP server and a Claude skill so AI agents can create and manage pay-per-visit campaigns on Stellar Testnet. This page also covers the vUSD faucet, the x402 paid endpoint, the Vercel deploy and the known limitations. Everything on this page is also available as plain text for agents.",
    pt: "O nata tem um servidor MCP e uma skill do Claude para que agentes de IA criem e gerenciem campanhas de pagamento por visita na Stellar Testnet. Tudo nesta página também está disponível em texto simples para agentes. Também cobre o faucet de vUSD, o endpoint pago x402, o deploy na Vercel e as limitações conhecidas.",
    es: "nata tiene un servidor MCP y una skill de Claude para que los agentes de IA creen y gestionen campañas de pago por visita en Stellar Testnet. Todo lo de esta página también está en texto plano para agentes. También cubre el faucet de vUSD, el endpoint de pago x402, el despliegue en Vercel y las limitaciones conocidas.",
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
  {
    id: "faucet",
    title: { en: "vUSD faucet", pt: "Faucet de vUSD", es: "Faucet de vUSD" },
    body: {
      en: [
        "POST /api/faucet with {\"address\":\"G… or C…\"} mints 100 test vUSD (FAUCET_AMOUNT). The /faucet page uses it and the MCP tool request_faucet calls it when NATA_FAUCET_URL points to <host>/api/faucet. Limits: 3 per address and 10 per IP per UTC day, 20000 vUSD per day in total.",
        "A G… address needs the vUSD trustline first (the app opens it with a sponsored transaction); otherwise the answer is 422. A C… passkey wallet (not deployed) would need none. The route answers 503 when FAUCET_SECRET is missing or is not the vUSD issuer key, and on Vercel also when the shared rate-limit store (Upstash or Vercel KV) is missing. The MCP does not add the trustline for the agent account, so request_faucet only funds XLM until the account has one.",
      ],
      pt: [
        "POST /api/faucet com {\"address\":\"G… ou C…\"} emite 100 vUSD de teste (FAUCET_AMOUNT). A página /faucet usa essa rota e a ferramenta MCP request_faucet a chama quando NATA_FAUCET_URL aponta para <host>/api/faucet. Limites: 3 por endereço e 10 por IP por dia UTC, 20000 vUSD por dia no total.",
        "Um endereço G… precisa antes da trustline de vUSD (o app a abre com uma transação patrocinada); senão a resposta é 422. Uma carteira passkey C… (não implantada) não precisaria. A rota responde 503 se FAUCET_SECRET faltar ou não for a chave emissora do vUSD, e na Vercel também se faltar o armazenamento compartilhado de limites (Upstash ou Vercel KV). O MCP não cria a trustline da conta do agente, então request_faucet só financia XLM até a conta ter uma.",
      ],
      es: [
        "POST /api/faucet con {\"address\":\"G… o C…\"} emite 100 vUSD de prueba (FAUCET_AMOUNT). La página /faucet usa esa ruta y la herramienta MCP request_faucet la llama cuando NATA_FAUCET_URL apunta a <host>/api/faucet. Límites: 3 por dirección y 10 por IP por día UTC, 20000 vUSD por día en total.",
        "Una dirección G… necesita antes la trustline de vUSD (la app la abre con una transacción patrocinada); si no, la respuesta es 422. Una billetera passkey C… (no desplegada) no la necesitaría. La ruta responde 503 si falta FAUCET_SECRET o no es la clave emisora de vUSD, y en Vercel también si falta el almacén compartido de límites (Upstash o Vercel KV). El MCP no crea la trustline de la cuenta del agente, así que request_faucet solo financia XLM hasta que la cuenta tenga una.",
      ],
    },
  },
  {
    id: "x402",
    title: { en: "x402 paid endpoint", pt: "Endpoint pago x402", es: "Endpoint de pago x402" },
    body: {
      en: [
        "GET /api/x402/campaigns-premium returns active campaigns plus fillRate, claimsLeft and total remaining budget. Without payment it answers HTTP 402 with a PAYMENT-REQUIRED header (scheme exact, network stellar:testnet, payTo, token contract, price 0.01 by default). An x402 v2 client signs a Soroban authorization entry and retries with PAYMENT-SIGNATURE; the facilitator verifies it and settles only if the handler answers 2xx.",
        "It is off until X402_PAY_TO is set (503) and fails closed if the facilitator is unreachable. Config, the paying client script (pnpm x402:e2e in apps/web) and the facilitator choice are in docs/X402.md. The MCP server does not pay; the free list_active_campaigns tool covers the unpaid data.",
      ],
      pt: [
        "GET /api/x402/campaigns-premium retorna as campanhas ativas mais fillRate, claimsLeft e o orçamento restante total. Sem pagamento responde HTTP 402 com o cabeçalho PAYMENT-REQUIRED (esquema exact, rede stellar:testnet, payTo, contrato do token, preço 0.01 por padrão). Um cliente x402 v2 assina uma entrada de autorização Soroban e repete com PAYMENT-SIGNATURE; o facilitador verifica e só liquida se o handler responder 2xx.",
        "Fica desligado até X402_PAY_TO ser definido (503) e falha fechado se o facilitador estiver inacessível. Configuração, o script de cliente pagador (pnpm x402:e2e em apps/web) e a escolha do facilitador estão em docs/X402.md. O servidor MCP não paga; a ferramenta gratuita list_active_campaigns cobre os dados sem pagamento.",
      ],
      es: [
        "GET /api/x402/campaigns-premium devuelve las campañas activas más fillRate, claimsLeft y el presupuesto restante total. Sin pago responde HTTP 402 con la cabecera PAYMENT-REQUIRED (esquema exact, red stellar:testnet, payTo, contrato del token, precio 0.01 por defecto). Un cliente x402 v2 firma una entrada de autorización Soroban y reintenta con PAYMENT-SIGNATURE; el facilitador verifica y solo liquida si el handler responde 2xx.",
        "Está apagado hasta definir X402_PAY_TO (503) y falla cerrado si el facilitador no responde. La configuración, el script de cliente pagador (pnpm x402:e2e en apps/web) y la elección del facilitador están en docs/X402.md. El servidor MCP no paga; la herramienta gratuita list_active_campaigns cubre los datos sin pago.",
      ],
    },
  },
  {
    id: "deploy",
    title: { en: "Deploy to Vercel", pt: "Deploy na Vercel", es: "Despliegue en Vercel" },
    body: {
      en: ["Import the repository, set Root Directory to apps/web and add these variables. Values prefixed NEXT_PUBLIC_ are public; everything else is server only. Add an Upstash Redis database from the Vercel marketplace before sharing the link, fund SPONSOR_SECRET with testnet XLM, and use a dedicated testnet key for FAUCET_SECRET (the vUSD issuer: it can mint unlimited vUSD). Testnet only."],
      pt: ["Importe o repositório, defina Root Directory como apps/web e adicione estas variáveis. As com prefixo NEXT_PUBLIC_ são públicas; todas as outras são só de servidor. Adicione um Upstash Redis pelo marketplace da Vercel antes de compartilhar o link, financie SPONSOR_SECRET com XLM de teste e use uma chave testnet dedicada em FAUCET_SECRET (o emissor do vUSD: ele pode emitir vUSD sem limite). Somente testnet."],
      es: ["Importe el repositorio, defina Root Directory como apps/web y agregue estas variables. Las que empiezan con NEXT_PUBLIC_ son públicas; todas las demás son solo de servidor. Agregue una base Upstash Redis desde el marketplace de Vercel antes de compartir el enlace, financie SPONSOR_SECRET con XLM de prueba y use una clave testnet dedicada en FAUCET_SECRET (el emisor de vUSD: puede emitir vUSD sin límite). Solo testnet."],
    },
  },
  {
    id: "limits",
    title: { en: "Known limitations", pt: "Limitações conhecidas", es: "Limitaciones conocidas" },
    body: {
      en: [
        "Passkey wallets (Face ID / Touch ID): supported by the code but not deployed or enabled. The smart wallet factory and WebAuthn verifier are not deployed and NEXT_PUBLIC_WALLET_WASM_HASH is empty, so visitors use a device wallet (key in localStorage; clearing site data loses it).",
        "One token per deployment: the UI uses a single NEXT_PUBLIC_TOKEN_CONTRACT_ID. The contract takes a token per campaign, but multi-token is not supported in the UI. The faucet, trustline sponsorship and MCP faucet are specific to the vUSD issuer; Circle USDC is a planned swap-in, not tested.",
        "x402: the paid round trip (verify, handler, settle) was verified once on testnet with 0.01 vUSD (tx aabd9305…bc9b0be). Mainnet and USDC were not tested.",
        "Faucet: FAUCET_SECRET is the issuer key. If it leaks, anyone can mint vUSD, so keep it dedicated and testnet-only.",
        "Relayer: the OpenZeppelin path was verified live on testnet (9/9 checks, claim tx 9f181f3f…b368f3, close_campaign tx 51fec925…179514); without it the sponsor account pays every fee.",
        "Rate limits are only a soft per-instance limit without Upstash or Vercel KV. No external audit. Testnet only.",
        "Still to fill by the team: live URL and demo video URL (see docs/SUBMISSION.md).",
      ],
      pt: [
        "Carteiras passkey (Face ID / Touch ID): suportadas pelo código, mas não implantadas nem ativadas. A factory da smart wallet e o verificador WebAuthn não estão implantados e NEXT_PUBLIC_WALLET_WASM_HASH está vazio, então visitantes usam carteira do dispositivo (chave em localStorage; limpar os dados do site perde a conta).",
        "Um token por deployment: a UI usa um único NEXT_PUBLIC_TOKEN_CONTRACT_ID. O contrato aceita um token por campanha, mas multi-token não é suportado na UI. O faucet, o patrocínio de trustline e o faucet do MCP são específicos do emissor do vUSD; o USDC da Circle é uma troca planejada, não testada.",
        "x402: o ciclo pago (verify, handler, settle) foi verificado uma vez na testnet com 0.01 vUSD (tx aabd9305…bc9b0be). Mainnet e USDC não foram testados.",
        "Faucet: FAUCET_SECRET é a chave do emissor. Se vazar, qualquer pessoa pode emitir vUSD; mantenha-a dedicada e só testnet.",
        "Relayer: o caminho OpenZeppelin foi verificado ao vivo na testnet (9/9 checks, claim tx 9f181f3f…b368f3, close_campaign tx 51fec925…179514); sem ele a conta sponsor paga todas as taxas.",
        "Sem Upstash ou Vercel KV os limites são só um limite fraco por instância. Sem auditoria externa. Somente testnet.",
        "A preencher pela equipe: URL ao vivo e URL do vídeo de demo (veja docs/SUBMISSION.md).",
      ],
      es: [
        "Billeteras passkey (Face ID / Touch ID): soportadas por el código, pero no desplegadas ni habilitadas. La factory de la smart wallet y el verificador WebAuthn no están desplegados y NEXT_PUBLIC_WALLET_WASM_HASH está vacío, así que los visitantes usan una billetera del dispositivo (clave en localStorage; borrar los datos del sitio pierde la cuenta).",
        "Un token por despliegue: la UI usa un único NEXT_PUBLIC_TOKEN_CONTRACT_ID. El contrato admite un token por campaña, pero multi-token no está soportado en la UI. El faucet, el patrocinio de trustline y el faucet del MCP son específicos del emisor de vUSD; el USDC de Circle es un reemplazo previsto, no probado.",
        "x402: el ciclo pagado (verify, handler, settle) se verificó una vez en testnet con 0.01 vUSD (tx aabd9305…bc9b0be). Mainnet y USDC no se probaron.",
        "Faucet: FAUCET_SECRET es la clave del emisor. Si se filtra, cualquiera puede emitir vUSD; manténgala dedicada y solo testnet.",
        "Relayer: la ruta OpenZeppelin se verificó en vivo en testnet (9/9 checks, claim tx 9f181f3f…b368f3, close_campaign tx 51fec925…179514); sin él la cuenta sponsor paga todas las comisiones.",
        "Sin Upstash ni Vercel KV los límites son solo un límite débil por instancia. Sin auditoría externa. Solo testnet.",
        "Por completar por el equipo: URL en vivo y URL del video de demo (vea docs/SUBMISSION.md).",
      ],
    },
  },
];

export type { Rich };
