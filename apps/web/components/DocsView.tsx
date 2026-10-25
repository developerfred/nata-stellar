"use client";

import { useI18n } from "@/lib/i18n";
import { DEPLOY_ENV, ENDPOINTS, ENV_VARS, EXAMPLE, INSTALL_CMD, SECTIONS, TOOLS, TOOL_DESC, UI } from "@/lib/docs/content";

const Code = ({ children }: { children: string }) => (
  <pre className="card overflow-x-auto !p-3 font-mono text-xs leading-relaxed"><code>{children}</code></pre>
);

export function DocsView() {
  const { locale: l } = useI18n();
  const extra: Record<string, React.ReactNode> = {
    install: (
      <>
        <Code>{INSTALL_CMD}</Code>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead><tr className="text-muted"><th className="py-1 pr-3">{UI.variable[l]}</th><th>{UI.does[l]}</th></tr></thead>
            <tbody>
              {ENV_VARS.map((v) => (
                <tr key={v.name} className="border-t border-line align-top"><td className="py-1 pr-3 font-mono text-xs">{v.name}</td><td className="py-1">{v.note[l]}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    ),
    example: <Code>{EXAMPLE}</Code>,
    deploy: <Code>{DEPLOY_ENV}</Code>,
  };

  return (
    <div className="grid gap-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">{UI.title[l]}</h1>
        <p className="mt-2 text-muted">{UI.lead[l]}</p>
      </div>

      {SECTIONS.slice(0, 2).map((s) => (
        <Section key={s.id} id={s.id} title={s.title[l]} paras={s.body[l]}>{extra[s.id]}</Section>
      ))}

      <section id="tools" className="grid gap-2">
        <h2 className="text-xl font-extrabold tracking-tight text-azul">{l === "en" ? "Tools" : l === "pt" ? "Ferramentas" : "Herramientas"}</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead><tr className="text-muted"><th className="py-1 pr-3">{UI.tool[l]}</th><th className="pr-3">{UI.inputs[l]}</th><th>{UI.does[l]}</th></tr></thead>
            <tbody>
              {TOOLS.map((t) => (
                <tr key={t.id} className="border-t border-line align-top">
                  <td className="py-1 pr-3 font-mono text-xs">{t.id}<div className="font-sans text-muted">{t.write ? UI.writes[l] : UI.readonly[l]}</div></td>
                  <td className="py-1 pr-3 font-mono text-xs">{t.inputs}</td>
                  <td className="py-1">{TOOL_DESC[t.id][l]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {SECTIONS.slice(2).map((s) => (
        <Section key={s.id} id={s.id} title={s.title[l]} paras={s.body[l]} list={s.id === "safety" || s.id === "limits"}>{extra[s.id]}</Section>
      ))}

      <section id="endpoints" className="grid gap-2">
        <h2 className="text-xl font-extrabold tracking-tight text-azul">{UI.endpoints[l]}</h2>
        <ul className="grid gap-1 text-sm">
          {ENDPOINTS.map((e) => (
            <li key={e.path}><a className="font-mono text-xs text-azul underline underline-offset-4" href={e.path}>{e.path}</a> <span className="text-muted">({e.kind})</span></li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Section({ id, title, paras, list, children }: { id: string; title: string; paras: string[]; list?: boolean; children?: React.ReactNode }) {
  return (
    <section id={id} className="grid gap-2">
      <h2 className="text-xl font-extrabold tracking-tight text-azul">{title}</h2>
      {list ? (
        <ul className="list-disc pl-5">{paras.map((p) => <li key={p}>{p}</li>)}</ul>
      ) : (
        paras.map((p) => <p key={p}>{p}</p>)
      )}
      {children}
    </section>
  );
}
