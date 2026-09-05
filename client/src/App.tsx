import React from 'react';
import { Routes, Route, Navigate } from 'react-router';
import { AuthProvider } from './contexts/AuthContext';
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

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
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
          <Route path="/complaints" element={<ComplaintsList />} />
          <Route path="/complaints/new" element={<ComplaintNew />} />
          <Route path="/complaints/:id" element={<ComplaintDetails />} />
          <Route path="/cases" element={<CasesList />} />
          <Route path="/cases/:id" element={<CaseDetails />} />
          <Route path="/cases/:caseId/evidence/upload" element={<EvidenceUpload />} />
          <Route path="/evidence" element={<EvidenceVault />} />
          <Route path="/evidence/:id" element={<EvidenceDetails />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
