require("dotenv").config({ path: ".env.local" })
const postgres = require("postgres")

const DATABASES = [
  { name: "pdm_textil", url: process.env.DATABASE_URL },
  { name: "pdm_pro_textil", url: process.env.DATABASE_URL_PDM_PRO_TEXTIL },
  { name: "pdm_ibirapuera", url: process.env.DATABASE_URL_PDM_IBIRAPUERA },
  { name: "neon", url: process.env.DATABASE_URL_NEON },
]

const INTEGRACOES = [
  {
    nome: "consulta_cnpj",
    baseUrl: "https://api.opencnpj.org",
    tipoAuth: "api_key",
    authConfig: { key: "", key_name: "", in: "header" },
    telas: ["consulta_cnpj"],
    descricao: "Consulta CNPJ via OpenCNPJ (gratuito)",
  },
  {
    nome: "consulta_cpf",
    baseUrl: "https://apicpf.com/api",
    tipoAuth: "api_key",
    authConfig: { key: "ecba766f95da8ab8a2b84565f49cfd291cb6647e93062a88378a8b4585b64b14", key_name: "X-API-KEY", in: "header" },
    telas: ["consulta_cpf"],
    descricao: "Consulta CPF via apicpf.com (plano Grátis Basic - 100 req/dia)",
  },
]

async function main() {
  for (const db of DATABASES) {
    if (!db.url) {
      console.log(`[${db.name}] URL ausente — pulando`)
      continue
    }
    const sql = postgres(db.url, { max: 2 })
    try {
      for (const integ of INTEGRACOES) {
        const [existente] = await sql`
          SELECT id, telas, ativo FROM integracoes WHERE nome = ${integ.nome} LIMIT 1
        `
        if (existente) {
          await sql`
            UPDATE integracoes
            SET base_url = ${integ.baseUrl},
                tipo_auth = ${integ.tipoAuth},
                auth_config = ${sql.json(integ.authConfig)},
                telas = ${sql.json(integ.telas)},
                ativo = true,
                updated_at = now()
            WHERE id = ${existente.id}
          `
          console.log(`[${db.name}] ${integ.nome} atualizada (id=${existente.id})`)
        } else {
          const [inserido] = await sql`
            INSERT INTO integracoes (nome, base_url, tipo_auth, auth_config, telas, ativo)
            VALUES (${integ.nome}, ${integ.baseUrl}, ${integ.tipoAuth}, ${sql.json(integ.authConfig)}, ${sql.json(integ.telas)}, true)
            RETURNING id
          `
          console.log(`[${db.name}] ${integ.nome} criada (id=${inserido.id})`)
        }
      }
    } catch (err) {
      console.error(`[${db.name}] erro:`, err.message)
    } finally {
      await sql.end({ timeout: 5 })
    }
  }
}

main().catch(e => { console.error(e); process.exit(1) })