import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { crmPessoas } from "@/lib/db/schema/crm-pessoas"
import { integracoes } from "@/lib/db/schema/integracoes"
import { eq, like } from "drizzle-orm"

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

function validarCpf(cpf: string): boolean {
  const digitos = cpf.replace(/\D/g, "")
  if (digitos.length !== 11) return false
  if (/^(\d)\1+$/.test(digitos)) return false
  let soma = 0
  for (let i = 0; i < 9; i++) soma += parseInt(digitos[i]) * (10 - i)
  let resto = (soma * 10) % 11
  if (resto === 10 || resto === 11) resto = 0
  if (resto !== parseInt(digitos[9])) return false
  soma = 0
  for (let i = 0; i < 10; i++) soma += parseInt(digitos[i]) * (11 - i)
  resto = (soma * 10) % 11
  if (resto === 10 || resto === 11) resto = 0
  if (resto !== parseInt(digitos[10])) return false
  return true
}

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const { searchParams } = new URL(req.url)
    const cpf = searchParams.get("cpf")?.replace(/[^0-9]/g, "") || ""

    if (!cpf || !validarCpf(cpf)) {
      return NextResponse.json({ error: "CPF inválido" }, { status: 400 })
    }

    // Busca configuração da integração
    const cfg = await buscarConfigIntegracao("consulta_cpf")
    if (!cfg) {
      return NextResponse.json({ error: "Integração 'consulta_cpf' não configurada" }, { status: 503 })
    }

    let apiData = null
    try {
      const res = await fetch(`${cfg.baseUrl}/consulta?cpf=${cpf}`, {
        headers: montarHeaders(cfg),
        signal: AbortSignal.timeout(10000),
      })
      if (res.ok) {
        apiData = await res.json()
        // Normaliza resposta
        if (apiData.code === 404) {
          return NextResponse.json({ apiData: null, crmPessoas: [] })
        }
      }
    } catch (err) {
      console.error("[consulta-cpf] erro ao buscar API externa:", err)
    }

    const crmResult = await db
      .select()
      .from(crmPessoas)
      .where(like(crmPessoas.cpf, `%${cpf}%`))
      .limit(5)

    return NextResponse.json({
      apiData,
      crmPessoas: crmResult,
    })
  } catch (error) {
    console.error("[GET /api/crm/consulta-cpf]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}