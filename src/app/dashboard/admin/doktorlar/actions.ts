
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function toggleDoktorAktif(formData: FormData) {
  const id = formData.get("id") as string;
  const suAnkiDurum = formData.get("aktif") === "true";

  const supabaseServer = await createClient();
  await supabaseServer
    .from("doktor")
    .update({ aktif: !suAnkiDurum })
    .eq("id", id);

  revalidatePath("/dashboard/admin/doktorlar");
}
