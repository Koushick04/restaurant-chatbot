import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/context/ThemeContext";
import { LandingPage } from "@/pages/LandingPage";
import { ChatWidget } from "@/components/chat/ChatWidget";
import { PageSkeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/toast";
import { AuthProvider } from "./auth/AuthContext";
import PrivateRoute from "./auth/PrivateRoute";

const LoginPage = lazy(() => import("./pages/admin/LoginPage"));
const AdminLayout = lazy(() => import("@/pages/admin/AdminLayout").then(module => ({ default: module.AdminLayout })));
const DashboardPage = lazy(() => import("@/pages/admin/DashboardPage").then(module => ({ default: module.DashboardPage })));
const ConversationsPage = lazy(() => import("@/pages/admin/ConversationsPage").then(module => ({ default: module.ConversationsPage })));
const FaqsPage = lazy(() => import("@/pages/admin/FaqsPage").then(module => ({ default: module.FaqsPage })));
const DocumentsPage = lazy(() => import("@/pages/admin/DocumentsPage").then(module => ({ default: module.DocumentsPage })));
const BusinessPage = lazy(() => import("@/pages/admin/BusinessPage").then(module => ({ default: module.BusinessPage })));
const ChatbotPage = lazy(() => import("@/pages/admin/ChatbotPage").then(module => ({ default: module.ChatbotPage })));
const LeadsPage = lazy(() => import("@/pages/admin/LeadsPage").then(module => ({ default: module.LeadsPage })));
const ThemePage = lazy(() => import("@/pages/admin/ThemePage").then(module => ({ default: module.ThemePage })));

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<main className="min-h-screen p-6"><PageSkeleton /></main>}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/admin/login" element={<LoginPage />} />
              <Route path="/admin" element={<PrivateRoute><AdminLayout /></PrivateRoute>}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="conversations" element={<ConversationsPage />} />
                <Route path="faqs" element={<FaqsPage />} />
                <Route path="documents" element={<DocumentsPage />} />
                <Route path="business" element={<BusinessPage />} />
                <Route path="chatbot" element={<ChatbotPage />} />
                <Route path="leads" element={<LeadsPage />} />
                <Route path="theme" element={<ThemePage />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
          <ChatWidget />
          <Toaster />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
