import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { crmPessoas } from "@/lib/db/schema/crm-pessoas"
import { clientes } from "@/lib/db/schema/clientes"
import { representantes } from "@/lib/db/schema/representantes"
import { integracoes } from "@/lib/db/schema/integracoes"
import { eq } from "drizzle-orm"

export const dynamic = "force-dynamic"

async function buscarConfigIntegracao(nome: string) {
  const [cfg] = await db
    .select({ baseUrl: integracoes.baseUrl, authConfig: integracoes.authConfig, tipoAuth: integracoes.tipoAuth })
    .from(integracoes)
    .where(eq(integracoes.nome, nome))
    .limit(1)
  return cfg
}

function montarHeaders(cfg: { authConfig: any; tipoAuth: string }) {
  const { authConfig, tipoAuth } = cfg
  const headers: Record<string, string> = {}
  if (tipoAuth === "api_key" && authConfig?.key) {
    headers[authConfig.key_name || "X-API-KEY"] = authConfig.key
  }
  return headers
}

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const { searchParams } = new URL(req.url)
    const cnpj = searchParams.get("cnpj")?.replace(/[^0-9]/g, "") || ""

    if (!cnpj || cnpj.length !== 14) {
      return NextResponse.json({ error: "CNPJ inválido" }, { status: 400 })
    }

    // Busca configuração da integração
    const cfg = await buscarConfigIntegracao("consulta_cnpj")
    if (!cfg) {
      return NextResponse.json({ error: "Integração 'consulta_cnpj' não configurada" }, { status: 503 })
    }

    let apiData = null
    try {
      const res = await fetch(`${cfg.baseUrl}/${cnpj}`, {
        headers: montarHeaders(cfg),
        signal: AbortSignal.timeout(10000),
      })
      if (res.ok) apiData = await res.json()
    } catch (err) {
      console.error("[consulta-cnpj] erro ao buscar API externa:", err)
    }

    const crmResult = await db
      .select()
      .from(crmPessoas)
      .where(eq(crmPessoas.cnpj, cnpj))
      .limit(5)

    const clientesResult = await db
      .select()
      .from(clientes)
      .where(eq(clientes.cnpj, cnpj))
      .limit(5)

    const representantesResult = await db
      .select()
      .from(representantes)
      .where(eq(representantes.cnpj, cnpj))
      .limit(5)

    return NextResponse.json({
      apiData,
      crmPessoas: crmResult,
      clientes: clientesResult,
      representantes: representantesResult,
    })
  } catch (error) {
    console.error("[GET /api/crm/consulta-cnpj]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}