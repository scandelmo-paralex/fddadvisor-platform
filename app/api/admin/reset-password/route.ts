import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { email, newPassword } = await request.json()

    // Create admin client with service role key
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const { data: users } = await supabase.auth.admin.listUsers()
    const user = users.users.find((u) => u.email === email)

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, { password: newPassword })

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: "Password updated successfully",
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
