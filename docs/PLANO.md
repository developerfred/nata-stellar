# nata: plano de construção (HackMeridian)

> **Nota (26/out):** este é o plano original, mantido como foi escrito. Onde ele cita carteira passkey/Face ID, USDC ou relayer, o estado entregue é: carteira do dispositivo (factory de passkey não implantada), token `vUSD` na testnet, relayer e x402 verificados na testnet. Veja `VERIFICATION.md`.

> Entrega: **segunda, 26/out, 12:00 (Lisboa)**. Hoje: domingo, 25/out, ~18:15.
> Tracks: **Genesis + Stellar Composed**. Rede: **Stellar Testnet**.

## 1. Pitch em uma frase

Qualquer local (restaurante, café, loja, estande de evento, museu) cria uma campanha com orçamento em USDC, que fica travado num contrato Soroban. O contrato **só paga quando uma visita real é provada no balcão**. O visitante recebe cashback na hora numa carteira com passkey, sem seed phrase e sem gas, e pode gastar esse saldo em qualquer outro local da rede.

**Problema:** marketing local paga por impressão e clique, sem saber se alguém entrou pela porta. Programas de fidelidade ficam presos a uma loja só, e cashback de cartão leva dias e custa taxa.

**Usuário-alvo:**
- Do lado do comerciante: pequenos negócios locais e organizadores de eventos.
- Do lado do visitante: quem circula na cidade ou no evento, como turistas e participantes de conferência.

**Proposta de valor:** o comerciante paga por visita, não por anúncio. O visitante recebe dólares de verdade, que valem em qualquer lugar da rede.

## 2. Por que Stellar (o que os juízes vão procurar)

| Peça | Uso |
|---|---|
| **Contrato Soroban `campaigns`** | Escrow do orçamento, verificação de assinatura ed25519 do comerciante (`env.crypto().ed25519_verify`), nonce de uso único, uma visita por carteira, eventos para analytics |
| **USDC (SAC)** | Orçamento e cashback. Usar o USDC testnet da Circle, com fallback para um asset próprio `vUSD` emitido por nós |
| **Smart wallet com passkey** (`passkey-kit`, endereço `C…`) | Login com Face ID/Touch ID. Um endereço C recebe saldo SAC **sem trustline** |
| **Patrocínio de taxas** (OpenZeppelin Relayer Channels via `PasskeyServer`) | O visitante nunca precisa de XLM |
| **Pagamento P2P / no balcão** | O visitante gasta o cashback em outro local: transferência SAC assinada com passkey |

Isso já são 3 ou mais blocos compostos (passkey wallet + OZ relayer + USDC/SAC + contrato próprio), o que encaixa em Composed. Ideias do track contempladas: *Stablecoins in everyday life* e *Wallets people want to use*.

## 3. Escopo do MVP

### Obrigatório (P0)
1. **Contrato `campaigns`** (Rust/Soroban)
   - `create_campaign(merchant, token, reward, budget, max_claims, start, end, signer_pubkey, meta_uri) -> id`: exige `merchant.require_auth()` e transfere `budget` do comerciante para o contrato.
   - `claim(campaign_id, visitor, nonce, expires_at, sig)`:
     - verifica que `sig` assina `(contract_id, campaign_id, nonce, expires_at)` com `signer_pubkey`;
     - verifica que `expires_at >= ledger.timestamp()`;
     - verifica que o nonce não foi usado (storage temporário com TTL);
     - verifica que o `visitor` ainda não fez claim nessa campanha (persistente);
     - verifica que o orçamento é suficiente;
     - transfere `reward` para o `visitor` e emite o evento `claimed`.
   - `close_campaign(id)`: o comerciante recupera o saldo restante.
   - `get_campaign(id)` e `list_active()`, este último paginado.
   - Testes unitários: claim válido, QR expirado, nonce repetido, segunda visita da mesma carteira, orçamento esgotado, assinatura de outra chave.
2. **App do visitante** (Next.js, mobile-first, PWA)
   - Criar ou conectar a carteira com passkey.
   - **Mapa/lista de locais** com campanhas ativas, cada um com página de menu ou catálogo e promoção.
   - **Escanear QR → claim**: o backend submete a transação via relayer e o visitante vê "+€2" com o link para o stellar.expert.
   - Saldo e histórico.
3. **Painel do comerciante** (mesmo app, rota `/merchant`)
   - Cadastro do local: nome, tipo, endereço, menu em JSON simples e foto.
   - Criar campanha: depositar orçamento.
   - **Modo balcão**: tela cheia com **QR rotativo a cada 20s**, assinado com a chave ed25519 do local, gerada e guardada no navegador do comerciante.
   - Métricas: visitas, custo por visita, orçamento restante, lidos dos eventos do contrato.
4. **Backend fino** (rotas API do Next.js)
   - Proxy para o relayer (a chave da API nunca vai ao cliente).
   - Indexação simples: lê os eventos via RPC `getEvents` e guarda em cache (SQLite, Vercel KV ou JSON).
   - Rate limit por IP e por carteira nos claims.
5. **Deploy público** (Vercel) + **README** + **ARCHITECTURE.md** com os IDs dos contratos.

### Desejável (P1, só se o P0 estiver redondo)
- **Pagar no balcão com o cashback**: o comerciante mostra um QR de cobrança e o visitante paga em USDC com passkey. Isso fecha o ciclo da rede.
- **Campanha "rota"**: ganhar um bônus ao visitar N locais diferentes (gamificação de eventos IRL).
- Seed com 6 a 8 locais fictícios de Lisboa e de um evento, para mostrar que funciona com "outros locais".

### Fora do escopo (dizer isso no README)
Mainnet, saque para banco via anchor, geofencing por GPS, prova anti-sybil forte e auditoria. Tudo isso entra como roadmap.

## 4. Modelo de segurança (o seu diferencial, coloque no pitch)

| Ataque | Mitigação no MVP |
|---|---|
| Foto do QR enviada para amigos | O QR expira em 20s e o nonce é de uso único no contrato |
| Mesma pessoa fazendo claim várias vezes | Um claim por carteira por campanha, verificado on-chain |
| Criar muitas carteiras (sybil) | Rate limit no relayer, `max_claims` por campanha e cooldown. No roadmap: Stellar Passport stamp ou prova de humanidade |
| Comerciante falso assinando visitas para si mesmo | Ele só gasta o próprio orçamento, então não há incentivo |
| Backend malicioso | O backend não tem poder sobre os fundos: as regras ficam no contrato |

## 5. Arquitetura

```
[natante PWA] --passkey--> [Smart wallet C…]
      | escaneia QR (campaign_id, nonce, exp, sig)
      v
[Next.js API] --invoke claim--> [OZ Relayer Channels] --> [Soroban: campaigns] --SAC transfer--> USDC
      ^                                                         |
      |-------------------- getEvents (indexador) <-------------
[Painel comerciante] --create_campaign (assina com carteira)--> [campaigns]
[Modo balcão] gera QR assinado com ed25519 local (rotativo)
```

Observação: o `claim` **não precisa da assinatura do visitante**, porque o dinheiro só pode ir para o endereço `visitor`. Isso torna o claim muito rápido: a passkey só é necessária para criar a carteira e para gastar.

## 6. Stack

- Contrato: Rust + `soroban-sdk` (versão atual compatível com a testnet), Stellar CLI para build, deploy e bindings TypeScript (`stellar contract bindings typescript`).
- Front: Next.js (App Router) + Tailwind + `@stellar/stellar-sdk` + `passkey-kit` + leitor de QR (`@zxing/browser` ou `html5-qrcode`) + `qrcode`.
- Infra: Vercel e RPC `https://soroban-testnet.stellar.org`.

## 7. Plano de horas (até 12:00 de amanhã)

| Horário | Entrega | Critério de pronto |
|---|---|---|
| 18:30 a 19:30 | Setup: repositório público, Stellar CLI, contas testnet (friendbot), USDC testnet ou `vUSD`, spike do `passkey-kit` + relayer | Uma transferência patrocinada funcionando a partir de uma carteira passkey |
| 19:30 a 22:30 | Contrato `campaigns` + testes + deploy na testnet + bindings TS | Todos os testes passando, contract ID no README |
| 22:30 a 01:30 | Modo balcão (QR rotativo) + fluxo de escanear e fazer claim + criação de campanha | Claim real de ponta a ponta na testnet pelo celular |
| 01:30 a 06:30 | **Dormir.** Não pule: o vídeo e o pitch precisam de você inteiro | |
| 06:30 a 08:30 | Lista/mapa de locais, página de menu, métricas do comerciante, seed de locais | Navegação completa sem dados falsos na tela de claim |
| 08:30 a 09:30 | P1 (pagar no balcão), só se tudo acima estiver redondo. Senão, polimento | |
| 09:30 a 10:30 | README, ARCHITECTURE.md, links de transações, divulgação de trabalho anterior (nenhum) | Um juiz consegue rodar tudo seguindo só o README |
| 10:30 a 11:30 | Vídeo de 3 min + pitch deck | |
| 11:30 a 12:00 | Submissão com folga | |

**Regra de corte:** se às 01:30 o claim de ponta a ponta não estiver funcionando, corte o passkey e use Freighter ou uma chave local para o visitante. O contrato e o QR são o coração do projeto.

## 8. Roteiro do vídeo (3 min)

1. **0:00 a 0:20, problema:** "O comerciante paga anúncio sem saber se alguém entrou pela porta."
2. **0:20 a 0:50, comerciante:** cadastra o café, cria a campanha "€2 por visita, orçamento €100" e mostra a transação de depósito no stellar.expert.
3. **0:50 a 1:40, visitante:** abre a PWA, cria a carteira com Face ID, vê o mapa, escaneia o QR e recebe "+2 USDC" em cerca de 5s, com a transação no explorer.
4. **1:40 a 2:10, segurança:** tenta reusar um QR velho e o contrato recusa; tenta um segundo claim e é recusado.
5. **2:10 a 2:30, rede:** outro local (estande de evento) e a métrica de custo por visita no painel.
6. **2:30 a 3:00, visão:** qualquer local, gastar o cashback em toda a rede, saque via anchor, prova anti-sybil e a próxima etapa (SCF).

**Truque de adoção, já que não há restaurantes reais:** coloque **um QR de campanha ativa no deck e no README** para que o próprio juiz escaneie, receba USDC testnet e vire usuário. Na final de quarta, mostre o QR no palco para a plateia: são usuários reais ao vivo.

## 9. Checklist de submissão

- [ ] Repositório público com o código
- [ ] README: resumo, problema, setup, instalação, variáveis de ambiente, como fazer a demo
- [ ] ARCHITECTURE.md: como o Stellar é usado, com asset, contract ID, wallet, relayer e RPC
- [ ] URL pública ao vivo
- [ ] Vídeo de demo
- [ ] Links de transações na testnet (create_campaign, claim, claim recusado)
- [ ] Declaração de trabalho anterior: nenhum, tudo construído no evento (commits com data)
- [ ] Pitch deck: problema, solução, usuários, valor, equipe, visão, modelo de negócio (taxa de 5 a 10% sobre o orçamento da campanha), mercado e go-to-market (eventos primeiro, depois bairros turísticos)

## 10. A validar na primeira hora (não confirmei)

- A versão atual do `passkey-kit` e o acesso ao **OpenZeppelin Relayer Channels** na testnet (exigem `baseUrl` e `apiKey`). Fallback: uma conta patrocinadora própria que submete o `claim`, sem precisar de relayer, já que o claim não exige assinatura do visitante.
- O faucet de USDC testnet da Circle no Stellar. Fallback: emitir o asset `vUSD` e fazer o deploy do SAC dele.
