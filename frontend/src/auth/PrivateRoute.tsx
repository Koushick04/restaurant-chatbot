import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { PageSkeleton } from "../components/ui/skeleton";

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <PageSkeleton />; // Or any loading indicator
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
};

export default PrivateRoute;
