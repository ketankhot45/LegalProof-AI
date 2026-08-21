import { Router } from 'express';
import { 
  uploadEvidence, 
  getEvidenceList, 
  getEvidenceDetails, 
  downloadEvidence, 
  verifyEvidenceIntegrity, 
  anchorEvidenceController,
  analyzeEvidenceController,
  getEvidenceAnalysisController
} from '../controllers/evidence.controller.js';
import { authenticate } from '../middlewares/auth.js';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';

const router = Router();
router.use(authenticate);

// Configure multer using memory storage
const storage = multer.memoryStorage();

// File filter to block dangerous types (executables)
const fileFilter = (req: any, file: any, cb: any) => {
  const dangerousExts = ['.exe', '.sh', '.bat', '.cmd', '.msi', '.js', '.php', '.py'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (dangerousExts.includes(ext)) {
    return cb(new Error('Dangerous file types are not allowed'), false);
  }
  
  cb(null, true);
};

const upload = multer({ 
  storage, 
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

const uploadMiddleware = (req: any, res: any, next: any) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
};

router.post('/cases/:caseId/evidence', uploadMiddleware, uploadEvidence);
router.get('/cases/:caseId/evidence', getEvidenceList);
router.get('/evidence/:id/download', downloadEvidence);
router.get('/evidence/:id/analysis', getEvidenceAnalysisController);
router.get('/evidence/:id', getEvidenceDetails);
router.post('/evidence/:id/verify', verifyEvidenceIntegrity);
router.post('/evidence/:id/anchor', anchorEvidenceController);
router.post('/evidence/:id/analyze', analyzeEvidenceController);

export default router;
