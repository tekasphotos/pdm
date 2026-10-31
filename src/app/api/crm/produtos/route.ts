import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { crmProdutos } from "@/lib/db/schema/crm-produtos"
import { and, asc, eq, ilike, or } from "drizzle-orm"
import { registrarLog, notificar } from "@/lib/notificar"
import { handleApiError } from "@/lib/api-error"
import { UNIDADES_MEDIDA, UNIDADE_OUTRA } from "@/lib/crm/documento-venda"

function normalizarProduto(body: any) {
  const nome = typeof body?.nome === "string" ? body.nome.trim() : ""
  if (!nome) return { error: "Nome é obrigatório" }

  const unidade = String(body.unidade || "METROS").trim()
  return {
    dados: {
      nome,
      codigo: body.codigo?.trim() || null,
      descricao: body.descricao?.trim() || null,
      unidade,
      unidadeOutra: unidade === UNIDADE_OUTRA ? body.unidadeOutra?.trim() || null : null,
      preco: body.preco != null && body.preco !== "" ? body.preco : null,
      ativo: body.ativo !== undefined ? Boolean(body.ativo) : true,
    },
  }
}

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const { searchParams } = new URL(req.url)
    const q = searchParams.get("q")?.trim() || ""
    const ativo = searchParams.get("ativo")

    const conditions = []
    if (ativo === "true") conditions.push(eq(crmProdutos.ativo, true))
    if (ativo === "false") conditions.push(eq(crmProdutos.ativo, false))
    if (q.length >= 2) {
      conditions.push(
        or(ilike(crmProdutos.nome, `%${q}%`), ilike(crmProdutos.codigo, `%${q}%`))!
      )
    }

    const lista = await db
      .select()
      .from(crmProdutos)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(asc(crmProdutos.nome))

    return NextResponse.json(lista)
  } catch (error) {
    console.error("[GET /api/crm/produtos]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const session = auth.session

    const body = await req.json()
    const normalizado = normalizarProduto(body)
    if ("error" in normalizado) {
      return NextResponse.json({ error: normalizado.error }, { status: 400 })
    }

    if (!UNIDADES_MEDIDA.includes(normalizado.dados.unidade as any) && normalizado.dados.unidade !== UNIDADE_OUTRA) {
      return NextResponse.json({ error: "Unidade inválida" }, { status: 400 })
    }

    const [novo] = await db.insert(crmProdutos).values(normalizado.dados).returning()

    await registrarLog({
      tipo: "CADASTRO",
      acao: "criar",
      descricao: `Produto CRM criado: ${novo.nome}`,
      entidade: "CrmProduto",
      entidadeId: novo.id,
      usuarioNome: session.user.name,
    })

    await notificar(
      "PRODUTO_CRM_CRIADO",
      `Produto criado: ${novo.nome}`,
      `/comercial/crm/produtos`,
      session.user.name
    )

    return NextResponse.json(novo, { status: 201 })
  } catch (error) {
    if ((error as { code?: string })?.code === "23505") {
      return NextResponse.json({ error: "Já existe um produto com este código" }, { status: 409 })
    }
    return handleApiError(error, "POST /api/crm/produtos")
  }
}
