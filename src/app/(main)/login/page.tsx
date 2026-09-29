import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { getViewer } from "@/lib/auth";
import { safeNextPath } from "@/lib/http";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const viewer = await getViewer();
  const nextPath = safeNextPath((await searchParams).next, "/");
  if (viewer) redirect(nextPath);
  return (
    <section className="page-pad">
      <h2 className="page-title">Sign in</h2>
      <p className="lede">Use the account you created on Bart’s site.</p>
      <AuthForm mode="login" nextPath={nextPath} />
      <p className="help" style={{ marginTop: 16 }}>
        New here? <Link href="/signup">Create an account</Link>
      </p>
    </section>
  );
}
