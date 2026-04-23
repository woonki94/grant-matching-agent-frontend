import { Navigate } from "react-router-dom";

type Props = {
  children: React.ReactNode;
};

export default function AuthGuard({ children }: Props) {
  const isLoggedIn = localStorage.getItem("isLoggedIn");

  if (isLoggedIn !== "true") {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}