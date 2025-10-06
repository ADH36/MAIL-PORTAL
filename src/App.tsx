import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { useAuthStore } from "@/lib/auth";
import ProtectedRoute from "@/components/ProtectedRoute";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Dashboard from "@/pages/Dashboard";
import Home from "@/pages/Home";
import Admin from "@/pages/Admin";
import SmtpManagement from "@/pages/SmtpManagement";

export default function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Public routes */}
          <Route 
            path="/" 
            element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Home />} 
          />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          
          {/* Placeholder routes for future implementation */}
          <Route
            path="/inbox"
            element={
              <ProtectedRoute>
                <div className="text-center text-xl p-8">Inbox - Coming Soon</div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/sent"
            element={
              <ProtectedRoute>
                <div className="text-center text-xl p-8">Sent - Coming Soon</div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/compose"
            element={
              <ProtectedRoute>
                <div className="text-center text-xl p-8">Compose - Coming Soon</div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/contacts"
            element={
              <ProtectedRoute>
                <div className="text-center text-xl p-8">Contacts - Coming Soon</div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <div className="text-center text-xl p-8">Settings - Coming Soon</div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <Admin />
              </ProtectedRoute>
            }
          />
          <Route
            path="/smtp-management"
            element={
              <ProtectedRoute>
                <SmtpManagement />
              </ProtectedRoute>
            }
          />
          
          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        
        {/* Toast notifications */}
        <Toaster position="top-right" richColors />
      </div>
    </Router>
  );
}
