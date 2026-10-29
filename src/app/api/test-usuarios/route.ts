import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { usuarios } from "@/lib/db/schema/usuarios"

type Usuario = typeof usuarios.$inferSelect

function dbInfo() {
  const url = process.env.DATABASE_URL
  if (!url) return { set: false }
  try {
    const u = new URL(url)
    return {
      set: true,
      host: u.hostname,
      database: u.pathname.replace(/^\//, ""),
      sslmode: u.searchParams.get("sslmode"),
    }
  } catch {
    return { set: true, parseError: true }
  }
}

export async function GET() {
  const info = dbInfo()
  try {
    const rows: Usuario[] = await db.select().from(usuarios).orderBy(usuarios.email)
    return NextResponse.json({
      ok: true,
      db: info,
      count: rows.length,
      usuarios: rows.map((u: Usuario) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        ativo: u.ativo,
      })),
    })
  } catch (e: any) {
    return NextResponse.json(
      {
        ok: false,
        db: info,
        error: e.message,
        cause: e.cause?.message ?? String(e.cause ?? ""),
        code: e.cause?.code ?? e.code ?? null,
      },
      { status: 500 }
    )
  }
}
