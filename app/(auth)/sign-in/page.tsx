import { AuthForm } from "@/components/features/AuthForm";

export const metadata = { title: "Sign in · RollCall" };

export default function SignInPage() {
  return <AuthForm mode="sign-in" />;
}
