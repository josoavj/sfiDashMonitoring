import { Navigate } from "react-router-dom";

export const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem("accessToken");

    if (!token) {
        return <Navigate to="/auth/login" replace />;
    }

    return children;
};

export const PublicRoute = ({ children }) => {
    const token = localStorage.getItem("accessToken");

    if (token) {
        return <Navigate to="/visualization" replace />;
    }

    return children;
};
