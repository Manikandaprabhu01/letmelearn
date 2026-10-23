import { createFileRoute } from "@tanstack/react-router";
import { LoginPage } from "./login";

export const Route = createFileRoute("/signup")({
  component: () => <LoginPage initialMode="sign-up" />,
});
