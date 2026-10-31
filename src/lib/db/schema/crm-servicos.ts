import { pgTable, serial, varchar, text, numeric, boolean, timestamp } from "drizzle-orm/pg-core"

export const crmServicos = pgTable("crm_servicos", {
  id: serial("id").primaryKey(),
  codigo: varchar("codigo", { length: 100 }).unique(),
  nome: varchar("nome", { length: 300 }).notNull(),
  descricao: text("descricao"),
  unidade: varchar("unidade", { length: 20 }).notNull().default("UNIDADES"),
  unidadeOutra: varchar("unidade_outra", { length: 50 }),
  preco: numeric("preco", { precision: 12, scale: 2 }),
  ativo: boolean("ativo").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export type CrmServico = typeof crmServicos.$inferSelect
export type NewCrmServico = typeof crmServicos.$inferInsert
