import { createServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import LoginForm from "./login-form";

export default async function LoginPage() {
  const supabase = await createServer();
  const { data } = await supabase.auth.getUser();

  if (data.user) {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            MyFinance
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            Seu controle financeiro pessoal
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
