// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { createQueryBuilder, resetDb } from "@/test/route-db-mock"
import { GET, POST } from "./route"

vi.mock("@/lib/auth", () => ({ requireAuth: vi.fn() }))
vi.mock("@/lib/notificar", () => ({
  registrarLog: vi.fn(),
  notificar: vi.fn(),
  notificarErro: vi.fn(),
  notificarDelecao: vi.fn(),
}))
vi.mock("@/lib/db", () => ({
  db: { select: vi.fn(), insert: vi.fn(), update: vi.fn(), delete: vi.fn() },
}))

const sessionAdmin = { session: { user: { id: "1", role: "ADMIN", name: "Tiago" } }, userId: 1 }

const produtos = [
  { id: 1, codigo: "P-01", nome: "Malha penteada", unidade: "METROS", preco: "12.50", ativo: true },
  { id: 2, codigo: "P-02", nome: "Tecido algodão", unidade: "KILOS", preco: "25.00", ativo: true },
]

function get(url: string) {
  return GET(new NextRequest(url))
}

function post(body: Record<string, unknown>) {
  return POST(
    new NextRequest("http://localhost/api/crm/produtos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  )
}

describe("GET /api/crm/produtos", () => {
  beforeEach(() => {
    vi.mocked(requireAuth).mockReset()
    resetDb(db)
    vi.mocked(requireAuth).mockResolvedValue(sessionAdmin as any)
  })

  it("retorna 401 sem autenticação", async () => {
    vi.mocked(requireAuth).mockResolvedValue(
      new NextResponse(JSON.stringify({ error: "Não autorizado" }), { status: 401 }) as any
    )
    const res = await get("http://localhost/api/crm/produtos")
    expect(res.status).toBe(401)
  })

  it("lista produtos ordenados por nome", async () => {
    db.select.mockReturnValueOnce(createQueryBuilder(produtos))
    const res = await get("http://localhost/api/crm/produtos")
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
    expect(body).toHaveLength(2)
    expect(body[0].nome).toBe("Malha penteada")
  })

  it("aplica filtro ativo=true", async () => {
    db.select.mockReturnValueOnce(createQueryBuilder([]))
    await get("http://localhost/api/crm/produtos?ativo=true")
    const builder = (db.select as ReturnType<typeof vi.fn>).mock.results[0].value
    expect(builder.where).toHaveBeenCalled()
  })

  it("aplica busca por nome quando q>=2", async () => {
    db.select.mockReturnValueOnce(createQueryBuilder([]))
    await get("http://localhost/api/crm/produtos?q=Malha")
    const builder = (db.select as ReturnType<typeof vi.fn>).mock.results[0].value
    expect(builder.where).toHaveBeenCalled()
  })

  it("não aplica filtro de busca quando q tem menos de 2 chars", async () => {
    db.select.mockReturnValueOnce(createQueryBuilder([]))
    await get("http://localhost/api/crm/produtos?q=M")
    const builder = (db.select as ReturnType<typeof vi.fn>).mock.results[0].value
    expect(builder.where).toHaveBeenCalledWith(undefined)
  })
})

describe("POST /api/crm/produtos", () => {
  beforeEach(() => {
    vi.mocked(requireAuth).mockReset()
    resetDb(db)
    vi.mocked(requireAuth).mockResolvedValue(sessionAdmin as any)
  })

  it("retorna 401 sem autenticação", async () => {
    vi.mocked(requireAuth).mockResolvedValue(
      new NextResponse(JSON.stringify({ error: "Não autorizado" }), { status: 401 }) as any
    )
    const res = await post({ nome: "Produto" })
    expect(res.status).toBe(401)
  })

  it("retorna 400 sem nome", async () => {
    const res = await post({ codigo: "P-01" })
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: "Nome é obrigatório" })
  })

  it("retorna 400 com unidade inválida", async () => {
    const res = await post({ nome: "Produto", unidade: "INVALIDA" })
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: "Unidade inválida" })
  })

  it("cria produto com dados mínimos", async () => {
    db.insert.mockReturnValueOnce(createQueryBuilder([{ id: 3, nome: "Novo" }]))
    const res = await post({ nome: "Novo" })
    expect(res.status).toBe(201)
    expect(db.insert).toHaveBeenCalled()
  })

  it("cria produto com todos os campos", async () => {
    db.insert.mockReturnValueOnce(createQueryBuilder([{ id: 3, nome: "Completo" }]))
    const res = await post({
      nome: "Completo",
      codigo: "CMP-01",
      descricao: "Desc",
      unidade: "METROS",
      preco: 10.5,
      ativo: false,
    })
    expect(res.status).toBe(201)
    expect(db.insert).toHaveBeenCalled()
  })

  it("retorna 409 quando código duplicado", async () => {
    const error: any = new Error("duplicate key")
    error.code = "23505"
    db.insert.mockImplementationOnce(() => { throw error })
    const res = await post({ nome: "Duplicado", codigo: "DUP-01" })
    expect(res.status).toBe(409)
    expect(await res.json()).toEqual({ error: "Já existe um produto com este código" })
  })
})