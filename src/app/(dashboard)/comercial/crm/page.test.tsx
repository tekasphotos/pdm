// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { screen, waitFor } from "@testing-library/react"
import CrmPage from "./page"
import { renderPage, createFetchMock, navMock, routeJson } from "@/test/harness"

vi.mock("@/lib/info-content", () => ({
  getInfoContent: vi.fn(() => ({ title: "CRM", description: "" })),
}))

const dashboard = {
  leads: { total: 4, esteMes: 2 },
  pessoas: { total: 3 },
  oportunidades: { total: 2, esteMes: 1, byStatus: [] },
  propostas: { total: 1, byStatus: [] },
  visitas: { total: 5, hoje: 1 },
  tarefas: { pendentes: 3, vencendo: 1 },
  topEmpresas: [],
  forecast: 0,
  conversao: { oportunidadesConvertidas: 1, totalOportunidades: 4 },
  recentes: [],
  previsaoVendas: [],
  campanhas: { total: 1, ativas: 1, orcamentoTotal: 0 },
  emailMassa: { enviados: 10, lidos: 5, clicados: 2 },
}

describe("CrmPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    navMock.reset()
    navMock.setPathname("/comercial/crm")
  })

  it("renderiza dashboard CRM", async () => {
    const fetchMock = createFetchMock(routeJson({ "/api/crm/dashboard": dashboard }))
    vi.stubGlobal("fetch", fetchMock.fn)
    renderPage(<CrmPage />)
    expect(await screen.findByRole("heading", { name: /CRM/ })).toBeInTheDocument()
    await waitFor(() => expect(screen.getByText("Leads")).toBeInTheDocument())
    expect(screen.getByText("4")).toBeInTheDocument()
  })

  it("não deixa o texto dos cards vazar (grid responsivo e min-w-0)", async () => {
    const fetchMock = createFetchMock(routeJson({ "/api/crm/dashboard": dashboard }))
    vi.stubGlobal("fetch", fetchMock.fn)
    renderPage(<CrmPage />)

    const card = (await screen.findByText("Leads")).closest("a") as HTMLElement
    expect(card.className).toContain("min-w-0")
    expect(card.className).toContain("flex-col")

    const grid = card.parentElement as HTMLElement
    expect(grid.className).toContain("grid-cols-2")
    expect(grid.className).toContain("md:grid-cols-4")
    expect(grid.className).not.toContain("xl:grid-cols-8")

    const label = screen.getByText("Tarefas Pendentes")
    expect(label.className).toContain("break-words")
  })
})
