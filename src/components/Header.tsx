import { UserButton, useUser } from "@clerk/clerk-react";

export const Header = () => {
  const { user } = useUser();

  return (
    <div className="relative flex items-center justify-center px-4 py-2">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-transparent bg-primary bg-clip-text">
          {user
            ? `What’s up, ${user.firstName || user.fullName || user.username}!`
            : "Welcome"}
        </h1>
        <p className="text-muted-foreground">Manage your tasks below</p>
      </div>
      <div className="absolute right-4">
        <UserButton />
      </div>
    </div>
  );
};
