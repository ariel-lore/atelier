import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { getViewer } from "@/lib/auth";

export default async function SignupPage() {
  const viewer = await getViewer();
  if (viewer) redirect("/");
  return (
    <section className="page-pad">
      <h2 className="page-title">Create account</h2>
      <p className="lede">After this, verify your Instagram so Bart can add you to a circle.</p>
      <AuthForm mode="signup" nextPath="/verify" />
      <p className="help" style={{ marginTop: 16 }}>
        Already have an account? <Link href="/login">Sign in</Link>
      </p>
    </section>
  );
}
