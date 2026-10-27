import { AuthForm } from "@/components/features/AuthForm";

export const metadata = { title: "Create account · RollCall" };

export default function SignUpPage() {
  return <AuthForm mode="sign-up" />;
}
