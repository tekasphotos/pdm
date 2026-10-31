// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest"
import { screen, fireEvent, waitFor } from "@testing-library/react"
import ProdutosPage from "./page"
import { createFetchMock, renderPage, findCall, navMock } from "@/test/harness"

const produtos = [
  { id: 1, codigo: "P-01", nome: "Malha penteada", unidade: "METROS", preco: "12.50", ativo: true },
  { id: 2, codigo: "P-02", nome: "Tecido algodão", unidade: "KILOS", preco: "25.00", ativo: true },
]

function buildHandler() {
  return ({ method, url }: { method: string; url: string }) => {
    if (method === "GET" && url === "/api/crm/produtos") return { json: produtos }
    if (method === "POST" && url === "/api/crm/produtos") return { json: { id: 3 }, status: 201 }
    if (method === "PUT" && url === "/api/crm/produtos/1") return { json: {} }
    if (method === "DELETE" && url === "/api/crm/produtos/1") return { json: { success: true } }
    return { json: null }
  }
}

function render() {
  navMock.setPathname("/comercial/crm/produtos")
  const mock = createFetchMock(buildHandler())
  vi.stubGlobal("fetch", mock.fn)
  return { ...renderPage(<ProdutosPage />), mock }
}

describe("ProdutosPage", () => {
  it("renderiza a lista de produtos", async () => {
    const { container, mock } = render()

    expect(await screen.findByRole("heading", { name: "Produtos" })).toBeInTheDocument()
    await screen.findByText("Malha penteada")
    expect(screen.getByText("Tecido algodão")).toBeInTheDocument()
    expect(screen.getAllByText(/Ativo/)).toHaveLength(2)
    expect(screen.getByText("2 produtos")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Novo Produto" })).toBeInTheDocument()
    expect(container.querySelectorAll("svg.lucide-trash-2").length).toBe(2)
    expect(findCall(mock.calls, "/api/crm/produtos", "GET")).toBeDefined()
  })

  it("filtra produtos pela busca", async () => {
    render()
    await screen.findByText("Malha penteada")

    fireEvent.change(screen.getByPlaceholderText("Buscar produto..."), {
      target: { value: "algodão" },
    })

    expect(screen.getByText("Tecido algodão")).toBeInTheDocument()
    expect(screen.queryByText("Malha penteada")).not.toBeInTheDocument()
    expect(screen.getByText("1 produtos")).toBeInTheDocument()
  })

  it("cria um novo produto via POST", async () => {
    const { mock } = render()
    await screen.findByText("Malha penteada")

    fireEvent.click(screen.getByRole("button", { name: "Novo Produto" }))
    await screen.findByRole("heading", { name: "Novo Produto" })

    fireEvent.change(screen.getByPlaceholderText("Ex: Malha penteada"), {
      target: { value: "Estamparia" },
    })

    fireEvent.click(screen.getByRole("button", { name: "Criar" }))

    await waitFor(() => {
      const call = findCall(mock.calls, "/api/crm/produtos", "POST")
      expect(call).toBeDefined()
      expect(call!.body).toEqual(
        expect.objectContaining({ nome: "Estamparia", unidade: "METROS", ativo: true })
      )
    })
    await waitFor(() =>
      expect(screen.queryByRole("heading", { name: "Novo Produto" })).not.toBeInTheDocument()
    )
  })

  it("edita um produto via PUT", async () => {
    const { container, mock } = render()
    await screen.findByText("Malha penteada")

    fireEvent.click(container.querySelector("svg.lucide-pencil")!.closest("button")!)
    await screen.findByRole("heading", { name: "Editar Produto" })

    const nomeInput = screen.getByPlaceholderText("Ex: Malha penteada")
    expect((nomeInput as HTMLInputElement).value).toBe("Malha penteada")
    fireEvent.change(nomeInput, { target: { value: "Malha Premium" } })

    fireEvent.click(screen.getByRole("button", { name: "Salvar" }))

    await waitFor(() => {
      const call = findCall(mock.calls, "/api/crm/produtos/1", "PUT")
      expect(call).toBeDefined()
      expect(call!.body).toEqual(expect.objectContaining({ nome: "Malha Premium" }))
    })
  })

  it("exclui um produto via DELETE", async () => {
    const { container, mock } = render()
    await screen.findByText("Malha penteada")

    fireEvent.click(container.querySelectorAll("svg.lucide-trash-2")[0].closest("button")!)

    await waitFor(() =>
      expect(findCall(mock.calls, "/api/crm/produtos/1", "DELETE")).toBeDefined()
    )
  })

  it("mostra estado vazio quando não há produtos", async () => {
    navMock.setPathname("/comercial/crm/produtos")
    const mock = createFetchMock(({ method, url }) => {
      if (method === "GET" && url === "/api/crm/produtos") return { json: [] }
      return { json: null }
    })
    vi.stubGlobal("fetch", mock.fn)
    renderPage(<ProdutosPage />)

    expect(await screen.findByText("Nenhum produto cadastrado")).toBeInTheDocument()
  })
})