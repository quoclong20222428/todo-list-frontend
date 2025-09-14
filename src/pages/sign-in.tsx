import AuthLayout from "@/components/AuthLayout";
import { SignIn } from "@clerk/clerk-react";

export default function SignInPage() {
  return (
    <AuthLayout>
      <SignIn />
    </AuthLayout>
  );
}
