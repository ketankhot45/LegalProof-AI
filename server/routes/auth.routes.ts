import { Router } from 'express';
import {
  register,
  login,
  logout,
  getMe,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  inviteInvestigator,
  activateInvestigator,
  listInvestigators,
} from '../controllers/auth.controller.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = Router();

// Public Authentication & Recovery
router.post('/register', register);
router.post('/login', login);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerification);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Public Investigator Activation (via single-use token)
router.post('/investigators/activate', activateInvestigator);

// Authenticated Session Endpoints
router.get('/me', authenticate, getMe);
router.post('/logout', authenticate, logout);

// Admin-Only Investigator Management
router.get('/investigators', authenticate, authorize(['ADMIN']), listInvestigators);
router.post('/investigators/invite', authenticate, authorize(['ADMIN']), inviteInvestigator);

export default router;
