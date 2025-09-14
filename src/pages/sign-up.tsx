import AuthLayout from "@/components/AuthLayout";
import { SignUp } from "@clerk/clerk-react";

export default function SignUpPage() {
  return (
    <AuthLayout>
      <SignUp />
    </AuthLayout>
  );
}
