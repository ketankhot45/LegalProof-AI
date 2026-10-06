import React from 'react';
import { Routes, Route, Navigate } from 'react-router';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { FeedbackProvider } from './contexts/FeedbackContext';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { VerifyEmail } from './pages/VerifyEmail';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { ActivateInvestigator } from './pages/ActivateInvestigator';
import { Dashboard } from './pages/Dashboard';
import { DashboardLayout } from './layouts/DashboardLayout';
import { ComplaintsList } from './pages/ComplaintsList';
import { ComplaintNew } from './pages/ComplaintNew';
import { ComplaintDetails } from './pages/ComplaintDetails';
import { CasesList } from './pages/CasesList';
import { CaseDetails } from './pages/CaseDetails';
import { EvidenceUpload } from './pages/EvidenceUpload';
import { EvidenceDetails } from './pages/EvidenceDetails';
import { EvidenceVault } from './pages/EvidenceVault';
import { PublicVerify } from './pages/PublicVerify';
import { InvestigatorRoster } from './pages/InvestigatorRoster';
import { AdminAssignmentQueue } from './pages/AdminAssignmentQueue';
import { NotFound } from './pages/NotFound';

/**
 * Public Index Route:
 * - Unauthenticated visitors: renders the public Landing page.
 * - Authenticated users: redirects to their authorized Dashboard.
 */
const IndexRoute: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="flex flex-col items-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
          <span className="text-xs text-zinc-500 font-mono tracking-wider">INITIALIZING SESSION...</span>
        </div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Landing />;
};

export default function App() {
  return (
    <FeedbackProvider>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<IndexRoute />} />
          <Route path="/login" element={<Login />} />
          <Route path="/login/:portalRole" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/activate-investigator" element={<ActivateInvestigator />} />
          <Route path="/verify" element={<PublicVerify />} />
          
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/investigators" element={<InvestigatorRoster />} />
            <Route path="/assignments" element={<AdminAssignmentQueue />} />
            <Route path="/complaints" element={<ComplaintsList />} />
            <Route path="/complaints/new" element={<ComplaintNew />} />
            <Route path="/complaints/:id" element={<ComplaintDetails />} />
            <Route path="/cases" element={<CasesList />} />
            <Route path="/cases/:id" element={<CaseDetails />} />
            <Route path="/cases/:caseId/evidence/upload" element={<EvidenceUpload />} />
            <Route path="/evidence" element={<EvidenceVault />} />
            <Route path="/evidence/:id" element={<EvidenceDetails />} />
          </Route>

          {/* Explicit 404 Not Found Catch-All */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </FeedbackProvider>
  );
}
