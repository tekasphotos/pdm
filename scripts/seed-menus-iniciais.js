require("dotenv").config({ path: require("path").join(__dirname, "..", ".env.local") })
const { Pool } = require("pg")

const ROLES = [
  { name: "DEFAULT", label: "Padrão", description: "Configuração padrão para novos usuários", paginaInicial: "/dashboard" },
  { name: "ADMIN", label: "Administrador", description: "Acesso total ao sistema", paginaInicial: "/dashboard" },
  { name: "SUDO", label: "Super Admin", description: "Acesso irrestrito", paginaInicial: "/dashboard" },
  { name: "COMERCIAL", label: "Comercial", description: "Solicitações, amostras e clientes", paginaInicial: "/comercial/solicitacoes" },
  { name: "CRM", label: "CRM", description: "Gestão de relacionamento com clientes", paginaInicial: "/comercial/crm" },
]

const DASHBOARDS = [
  ["Dashboard Solicitações de Desenvolvimento", "/dashboard"],
  ["Dashboard Amostras", "/dashboard/amostras"],
  ["Dashboard Amostras Comerciais", "/dashboard/amostra-comercial"],
  ["Dashboard Corte", "/dashboard/requisicoes-corte"],
  ["Relatórios", "/dashboard/relatorios"],
]

const COMERCIAL = [
  ["Solicitações de Desenvolvimento", "/comercial/solicitacoes"],
  ["Kanban S.D.", "/comercial/solicitacoes/kanban"],
  ["Requisições de Corte", "/comercial/requisicoes-corte"],
  ["Requisições de Amostra Comercial", "/comercial/requisicoes-amostra-comercial"],
  ["Amostras", "/amostras"],
  ["Clientes", "/comercial/clientes"],
  ["Representantes", "/comercial/representantes"],
]

const CRM = [
  ["Dashboard CRM", "/comercial/crm"],
  ["Pessoas", "/comercial/crm/pessoas"],
  ["Leads", "/comercial/crm/leads"],
  ["Contatos", "/comercial/crm/contatos"],
  ["Oportunidades", "/comercial/crm/oportunidades"],
  ["Kanban Oportunidades", "/comercial/crm/oportunidades/kanban"],
  ["Visitas", "/comercial/crm/visitas"],
  ["Dashboard Visitas", "/comercial/crm/visitas/dashboard"],
  ["Viagens", "/comercial/crm/viagens"],
  ["Tarefas", "/comercial/crm/tarefas"],
  ["Propostas", "/comercial/crm/propostas"],
  ["Faturamentos", "/comercial/crm/faturamentos"],
  ["Pedidos de Venda", "/comercial/crm/pedidos-venda"],
  ["Produtos", "/comercial/crm/produtos"],
  ["Serviços", "/comercial/crm/servicos"],
  ["Campanhas", "/comercial/crm/campanhas"],
  ["Conversas WhatsApp", "/comercial/crm/conversas"],
  ["Relatórios CRM", "/comercial/crm/relatorios"],
  ["Treinamento CRM", "/comercial/crm/treinamento"],
]

const CADASTROS = [
  ["Cadastros", "/cadastros"],
  ["Fios", "/cadastros/fios"],
  ["Cores", "/cadastros/cores"],
  ["Estampas", "/cadastros/estampas"],
  ["Bases Urdume", "/cadastros/bases-urdume"],
  ["Produtos", "/cadastros/produto-cru"],
  ["Químicos", "/cadastros/produtos-quimicos"],
  ["Receitas", "/cadastros/receitas"],
  ["Clientes", "/cadastros/clientes"],
  ["Fornecedores", "/cadastros/fornecedores"],
  ["Representantes", "/cadastros/representantes"],
]

const DOCUMENTOS = [
  ["Documentos", "/documentos"],
  ["Romaneios", "/documentos/romaneios"],
  ["Conferência OP Tecido Cru", "/documentos/conferencia-op-tecido-cru"],
]

const PROCESSOS = [
  ["Processos", "/processos"],
  ["Áreas", "/processos/areas"],
  ["Processos", "/processos/processos"],
  ["Subprocessos", "/processos/subprocessos"],
  ["Atividades", "/processos/atividades"],
  ["Sites", "/processos/sites"],
  ["Empresas", "/processos/empresas"],
  ["Diagramas", "/processos/visual"],
  ["Treinamento", "/processos/treinamento"],
]

const REUNIOES = [
  ["Reuniões", "/reunioes"],
  ["Projetos", "/reunioes/projetos"],
]

const ATIVOS = [
  ["Dashboard", "/ativos/dashboard"],
  ["Ativos", "/ativos/ativos"],
  ["Categorias", "/ativos/categorias"],
  ["Tipos de Vistoria", "/ativos/tipos-vistoria"],
  ["Planos", "/ativos/planos"],
  ["Vistorias", "/ativos/vistorias"],
]

const CHAMADOS = [
  ["Chamados", "/chamados"],
  ["Novo Chamado", "/chamados/novo"],
  ["Dashboard", "/chamados/dashboard"],
  ["Categorias", "/chamados/categorias"],
]

const FERRAMENTAS = [
  ["Ferramentas", "/ferramentas"],
  ["Consulta CNPJ", "/ferramentas/consulta-cnpj"],
  ["Conversores", "/ferramentas/conversores"],
  ["NF-e / CT-e", "/ferramentas/nfe-cte"],
  ["Regra de Três", "/ferramentas/regra-de-tres"],
]

const ADMIN = [
  ["Usuários", "/admin/usuarios"],
  ["Perfis", "/admin/roles"],
  ["Telas", "/admin/configuracoes/telas"],
  ["Permissões", "/admin/configuracoes/permissoes"],
  ["Empresa", "/admin/configuracoes/empresa"],
  ["Email", "/admin/configuracoes/email"],
  ["SMTP", "/admin/configuracoes/smtp"],
  ["Integrações", "/admin/configuracoes/integracoes"],
  ["Status", "/admin/configuracoes/status"],
  ["IA", "/admin/configuracoes/ai"],
  ["Banco de Dados", "/admin/configuracoes/banco-dados"],
  ["Logs", "/admin/logs"],
  ["Notificações", "/admin/notificacoes"],
  ["Email em Massa", "/admin/email-massa"],
  ["WhatsApp Dashboard", "/admin/whatsapp-dashboard"],
  ["WhatsApp Chat", "/admin/whatsapp-chat"],
  ["Catálogos WhatsApp", "/admin/whatsapp-catalogos"],
  ["Monitor WhatsApp", "/admin/whatsapp-monitor"],
  ["Bot Config", "/admin/bot-config"],
]

const CONTA = [
  ["Meu Perfil", "/perfil"],
  ["Menus", "/perfil/menus"],
]

const MENUS_POR_ROLE = {
  ADMIN: [
    { titulo: "Dashboards", icone: "LayoutDashboard", itens: DASHBOARDS },
    { titulo: "Comercial", icone: "Handshake", itens: COMERCIAL },
    { titulo: "CRM", icone: "Target", itens: CRM },
    { titulo: "Cadastros", icone: "Database", itens: CADASTROS },
    { titulo: "Documentos", icone: "FileText", itens: DOCUMENTOS },
    { titulo: "Processos", icone: "GitBranch", itens: PROCESSOS },
    { titulo: "Reuniões", icone: "Calendar", itens: REUNIOES },
    { titulo: "Ativos e Vistorias", icone: "ShieldCheck", itens: ATIVOS },
    { titulo: "Chamados", icone: "LifeBuoy", itens: CHAMADOS },
    { titulo: "Ferramentas", icone: "Wrench", itens: FERRAMENTAS },
    { titulo: "BI", icone: "BarChart3", itens: [["BI", "/bi"]] },
    { titulo: "Chat", icone: "MessageSquare", itens: [["Chat", "/chat"]] },
    { titulo: "Administração", icone: "Settings", itens: ADMIN },
    { titulo: "Conta", icone: "User", itens: CONTA },
  ],
  DEFAULT: [
    { titulo: "Dashboards", icone: "LayoutDashboard", itens: DASHBOARDS },
    { titulo: "Comercial", icone: "Handshake", itens: COMERCIAL },
    { titulo: "CRM", icone: "Target", itens: CRM },
    { titulo: "Cadastros", icone: "Database", itens: CADASTROS },
    { titulo: "Documentos", icone: "FileText", itens: DOCUMENTOS },
    { titulo: "Processos", icone: "GitBranch", itens: PROCESSOS },
    { titulo: "Reuniões", icone: "Calendar", itens: REUNIOES },
    { titulo: "Ativos e Vistorias", icone: "ShieldCheck", itens: ATIVOS },
    { titulo: "Chamados", icone: "LifeBuoy", itens: CHAMADOS },
    { titulo: "Ferramentas", icone: "Wrench", itens: FERRAMENTAS },
    { titulo: "BI", icone: "BarChart3", itens: [["BI", "/bi"]] },
    { titulo: "Chat", icone: "MessageSquare", itens: [["Chat", "/chat"]] },
    { titulo: "Conta", icone: "User", itens: CONTA },
  ],
  COMERCIAL: [
    { titulo: "Dashboards", icone: "LayoutDashboard", itens: DASHBOARDS },
    { titulo: "Comercial", icone: "Handshake", itens: COMERCIAL },
    { titulo: "Cadastros", icone: "Database", itens: CADASTROS },
    { titulo: "Documentos", icone: "FileText", itens: DOCUMENTOS },
    { titulo: "Ferramentas", icone: "Wrench", itens: FERRAMENTAS },
    { titulo: "Conta", icone: "User", itens: CONTA },
  ],
  CRM: [
    { titulo: "CRM", icone: "Target", itens: CRM },
    { titulo: "Dashboards", icone: "LayoutDashboard", itens: DASHBOARDS },
    { titulo: "Comercial", icone: "Handshake", itens: COMERCIAL },
    { titulo: "Cadastros", icone: "Database", itens: CADASTROS },
    { titulo: "Ferramentas", icone: "Wrench", itens: FERRAMENTAS },
    { titulo: "Conta", icone: "User", itens: CONTA },
  ],
}

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const client = await pool.connect()
  try {
    await client.query("BEGIN")

    for (const r of ROLES) {
      await client.query(
        `INSERT INTO roles (name, label, description, pagina_inicial, permissions, ativo)
         VALUES ($1, $2, $3, $4, '{}'::jsonb, true)
         ON CONFLICT (name) DO UPDATE SET
           label = EXCLUDED.label,
           description = EXCLUDED.description,
           pagina_inicial = EXCLUDED.pagina_inicial,
           ativo = true,
           updated_at = NOW()`,
        [r.name, r.label, r.description, r.paginaInicial]
      )
    }

    for (const [role, menus] of Object.entries(MENUS_POR_ROLE)) {
      await client.query(
        `DELETE FROM user_menu_itens WHERE user_menu_id IN (
           SELECT id FROM user_menus WHERE usuario_id IS NULL AND role = $1
         )`,
        [role]
      )
      await client.query(`DELETE FROM user_menus WHERE usuario_id IS NULL AND role = $1`, [role])

      for (let ordem = 0; ordem < menus.length; ordem++) {
        const menu = menus[ordem]
        const res = await client.query(
          `INSERT INTO user_menus (usuario_id, role, titulo, icone, ordem, ativo)
           VALUES (NULL, $1, $2, $3, $4, true) RETURNING id`,
          [role, menu.titulo, menu.icone, ordem]
        )
        const menuId = res.rows[0].id
        for (let i = 0; i < menu.itens.length; i++) {
          const [titulo, url] = menu.itens[i]
          await client.query(
            `INSERT INTO user_menu_itens (user_menu_id, titulo, url, ordem, ativo)
             VALUES ($1, $2, $3, $4, true)`,
            [menuId, titulo, url, i]
          )
        }
      }
      console.log(`${role}: ${menus.length} menus, ${menus.reduce((n, m) => n + m.itens.length, 0)} itens`)
    }

    await client.query("COMMIT")
    console.log("Seed de menus concluído.")
  } catch (e) {
    await client.query("ROLLBACK")
    throw e
  } finally {
    client.release()
    await pool.end()
  }
}

main().catch((e) => {
  console.error(e.message)
  process.exit(1)
})
