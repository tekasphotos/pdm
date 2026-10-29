import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { usuarios } from "@/lib/db/schema/usuarios"

type Usuario = typeof usuarios.$inferSelect

export async function GET() {
  try {
    const rows: Usuario[] = await db.select().from(usuarios).orderBy(usuarios.email)
    return NextResponse.json({
      ok: true,
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
      { ok: false, error: e.message },
      { status: 500 }
    )
  }
}
