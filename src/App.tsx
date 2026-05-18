import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/providers/AuthProvider";
import { RequireAuth, RequireOwner, RequireAdmin } from "@/components/RouteGuards";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppLayout from "@/layouts/AppLayout";
import Home from "@/pages/Home";
import Contact from "@/pages/Contact";
import Auth from "@/pages/Auth";
import ResetPassword from "@/pages/ResetPassword";
import AdminLogin from "@/pages/AdminLogin";
import AdminResetPassword from "@/pages/AdminResetPassword";
import Pending from "@/pages/Pending";
import Dashboard from "@/pages/Dashboard";
import Settings from "@/pages/Settings";
import PlaceholderPage from "@/pages/PlaceholderPage";
import Products from "@/pages/Products";
import Invoices from "@/pages/Invoices";
import NewInvoice from "@/pages/NewInvoice";
import InvoiceDetail from "@/pages/InvoiceDetail";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import TermsOfUse from "@/pages/TermsOfUse";
import Privacy from "@/pages/Privacy";
import WhereYouCanUse from "@/pages/WhereYouCanUse";
import About from "@/pages/About";
import Subscribe from "@/pages/Subscribe";
import UserManual from "@/pages/UserManual";
import Documentation from "@/pages/Documentation";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public Pages */}
            <Route path="/" element={<Home />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/about" element={<About />} />
            <Route path="/user-manual" element={<UserManual />} />
            <Route path="/documentation" element={<Documentation />} />
            <Route path="/terms-of-use" element={<TermsOfUse />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/where-you-can-use" element={<WhereYouCanUse />} />
            
            {/* Auth Routes */}
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/reset-password" element={<AdminResetPassword />} />
            <Route path="/pending" element={<RequireAuth><Pending /></RequireAuth>} />

            {/* Subscription/Payment Routes */}
            <Route path="/subscribe" element={<RequireAuth><Subscribe /></RequireAuth>} />

            {/* Admin */}
            <Route path="/admin" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />

            {/* Owner app - Protected by subscription status */}
            <Route element={<RequireOwner><ProtectedRoute><AppLayout /></ProtectedRoute></RequireOwner>}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/products" element={<Products />} />
              <Route path="/invoices" element={<Invoices />} />
              <Route path="/invoices/new" element={<NewInvoice />} />
              <Route path="/invoices/:id" element={<InvoiceDetail />} />
              <Route path="/settings" element={<Settings />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
