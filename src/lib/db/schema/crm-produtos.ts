import { pgTable, serial, varchar, text, numeric, boolean, timestamp } from "drizzle-orm/pg-core"

export const crmProdutos = pgTable("crm_produtos", {
  id: serial("id").primaryKey(),
  codigo: varchar("codigo", { length: 100 }).unique(),
  nome: varchar("nome", { length: 300 }).notNull(),
  descricao: text("descricao"),
  unidade: varchar("unidade", { length: 20 }).notNull().default("METROS"),
  unidadeOutra: varchar("unidade_outra", { length: 50 }),
  preco: numeric("preco", { precision: 12, scale: 2 }),
  ativo: boolean("ativo").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export type CrmProduto = typeof crmProdutos.$inferSelect
export type NewCrmProduto = typeof crmProdutos.$inferInsert
