import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { crmServicos } from "@/lib/db/schema/crm-servicos"
import { eq } from "drizzle-orm"
import { registrarLog, notificar, notificarDelecao } from "@/lib/notificar"
import { handleApiError } from "@/lib/api-error"
import { UNIDADES_MEDIDA, UNIDADE_OUTRA } from "@/lib/crm/documento-venda"

function normalizarServico(body: any) {
  const nome = typeof body?.nome === "string" ? body.nome.trim() : ""
  if (!nome) return { error: "Nome é obrigatório" }

  const unidade = String(body.unidade || "UNIDADES").trim()
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

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const session = auth.session

    const { id } = await params
    const servicoId = parseInt(id)

    const [existente] = await db
      .select()
      .from(crmServicos)
      .where(eq(crmServicos.id, servicoId))
      .limit(1)

    if (!existente) {
      return NextResponse.json({ error: "Serviço não encontrado" }, { status: 404 })
    }

    const body = await req.json()
    const normalizado = normalizarServico({ ...existente, ...body })
    if ("error" in normalizado) {
      return NextResponse.json({ error: normalizado.error }, { status: 400 })
    }

    if (
      !UNIDADES_MEDIDA.includes(normalizado.dados.unidade as any) &&
      normalizado.dados.unidade !== UNIDADE_OUTRA
    ) {
      return NextResponse.json({ error: "Unidade inválida" }, { status: 400 })
    }

    const [atualizado] = await db
      .update(crmServicos)
      .set({ ...normalizado.dados, updatedAt: new Date() })
      .where(eq(crmServicos.id, servicoId))
      .returning()

    await registrarLog({
      tipo: "ATUALIZACAO",
      acao: "atualizar",
      descricao: `Serviço CRM #${id} atualizado`,
      entidade: "CrmServico",
      entidadeId: atualizado.id,
      usuarioNome: session.user.name,
    })

    await notificar(
      "SERVICO_CRM_ATUALIZADO",
      `Serviço atualizado: ${atualizado.nome}`,
      `/comercial/crm/servicos`,
      session.user.name
    )

    return NextResponse.json(atualizado)
  } catch (error) {
    if ((error as { code?: string })?.code === "23505") {
      return NextResponse.json({ error: "Já existe um serviço com este código" }, { status: 409 })
    }
    return handleApiError(error, "PUT /api/crm/servicos/[id]")
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    if ((auth.session.user?.role ?? "") !== "ADMIN" && (auth.session.user?.role ?? "") !== "SUDO") {
      return NextResponse.json({ error: "Apenas administradores podem excluir" }, { status: 403 })
    }

    const { id } = await params
    await db.delete(crmServicos).where(eq(crmServicos.id, parseInt(id)))

    await notificarDelecao("Serviço CRM", id, auth.session.user.name)

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error, "DELETE /api/crm/servicos/[id]")
  }
}
