// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest"
import { screen, fireEvent, waitFor } from "@testing-library/react"
import ServicosPage from "./page"
import { createFetchMock, renderPage, findCall, navMock } from "@/test/harness"

const servicos = [
  { id: 1, codigo: "S-01", nome: "Frete", unidade: "UNIDADES", preco: "150.00", ativo: true },
  { id: 2, codigo: "S-02", nome: "Instalação", unidade: "HORAS", preco: "80.00", ativo: true },
]

function buildHandler() {
  return ({ method, url }: { method: string; url: string }) => {
    if (method === "GET" && url === "/api/crm/servicos") return { json: servicos }
    if (method === "POST" && url === "/api/crm/servicos") return { json: { id: 3 }, status: 201 }
    if (method === "PUT" && url === "/api/crm/servicos/1") return { json: {} }
    if (method === "DELETE" && url === "/api/crm/servicos/1") return { json: { success: true } }
    return { json: null }
  }
}

function render() {
  navMock.setPathname("/comercial/crm/servicos")
  const mock = createFetchMock(buildHandler())
  vi.stubGlobal("fetch", mock.fn)
  return { ...renderPage(<ServicosPage />), mock }
}

describe("ServicosPage", () => {
  it("renderiza a lista de serviços", async () => {
    const { container, mock } = render()

    expect(await screen.findByRole("heading", { name: "Serviços" })).toBeInTheDocument()
    await screen.findByText("Frete")
    expect(screen.getByText("Instalação")).toBeInTheDocument()
    expect(screen.getAllByText(/Ativo/)).toHaveLength(2)
    expect(screen.getByText("2 serviços")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Novo Serviço" })).toBeInTheDocument()
    expect(container.querySelectorAll("svg.lucide-trash-2").length).toBe(2)
    expect(findCall(mock.calls, "/api/crm/servicos", "GET")).toBeDefined()
  })

  it("filtra serviços pela busca", async () => {
    render()
    await screen.findByText("Frete")

    fireEvent.change(screen.getByPlaceholderText("Buscar serviço..."), {
      target: { value: "Instalação" },
    })

    expect(screen.getByText("Instalação")).toBeInTheDocument()
    expect(screen.queryByText("Frete")).not.toBeInTheDocument()
    expect(screen.getByText("1 serviços")).toBeInTheDocument()
  })

  it("cria um novo serviço via POST", async () => {
    const { mock } = render()
    await screen.findByText("Frete")

    fireEvent.click(screen.getByRole("button", { name: "Novo Serviço" }))
    await screen.findByRole("heading", { name: "Novo Serviço" })

    fireEvent.change(screen.getByPlaceholderText("Ex: Frete"), {
      target: { value: "Consultoria" },
    })

    fireEvent.click(screen.getByRole("button", { name: "Criar" }))

    await waitFor(() => {
      const call = findCall(mock.calls, "/api/crm/servicos", "POST")
      expect(call).toBeDefined()
      expect(call!.body).toEqual(
        expect.objectContaining({ nome: "Consultoria", unidade: "UNIDADES", ativo: true })
      )
    })
    await waitFor(() =>
      expect(screen.queryByRole("heading", { name: "Novo Serviço" })).not.toBeInTheDocument()
    )
  })

  it("edita um serviço via PUT", async () => {
    const { container, mock } = render()
    await screen.findByText("Frete")

    fireEvent.click(container.querySelector("svg.lucide-pencil")!.closest("button")!)
    await screen.findByRole("heading", { name: "Editar Serviço" })

    const nomeInput = screen.getByPlaceholderText("Ex: Frete")
    expect((nomeInput as HTMLInputElement).value).toBe("Frete")
    fireEvent.change(nomeInput, { target: { value: "Frete Expresso" } })

    fireEvent.click(screen.getByRole("button", { name: "Salvar" }))

    await waitFor(() => {
      const call = findCall(mock.calls, "/api/crm/servicos/1", "PUT")
      expect(call).toBeDefined()
      expect(call!.body).toEqual(expect.objectContaining({ nome: "Frete Expresso" }))
    })
  })

  it("exclui um serviço via DELETE", async () => {
    const { container, mock } = render()
    await screen.findByText("Frete")

    fireEvent.click(container.querySelectorAll("svg.lucide-trash-2")[0].closest("button")!)

    await waitFor(() =>
      expect(findCall(mock.calls, "/api/crm/servicos/1", "DELETE")).toBeDefined()
    )
  })

  it("mostra estado vazio quando não há serviços", async () => {
    navMock.setPathname("/comercial/crm/servicos")
    const mock = createFetchMock(({ method, url }) => {
      if (method === "GET" && url === "/api/crm/servicos") return { json: [] }
      return { json: null }
    })
    vi.stubGlobal("fetch", mock.fn)
    renderPage(<ServicosPage />)

    expect(await screen.findByText("Nenhum serviço cadastrado")).toBeInTheDocument()
  })
})