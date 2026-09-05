import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { createComplaint, getComplaints, getComplaint, reviewComplaint, downloadSupportingProof } from '../controllers/complaint.controller.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const storage = multer.memoryStorage();
const fileFilter = (req: any, file: any, cb: any) => {
  const dangerousExts = ['.exe', '.sh', '.bat', '.cmd', '.msi', '.js', '.php', '.py'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (dangerousExts.includes(ext)) {
    return cb(new Error('Dangerous file types are not allowed as supporting proof'), false);
  }
  cb(null, true);
};

const proofUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max
});

const proofUploadMiddleware = (req: any, res: any, next: any) => {
  proofUpload.single('proof')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
};

const router = Router();

router.use(authenticate);

router.post('/', authorize(['COMPLAINANT']), proofUploadMiddleware, createComplaint);
router.get('/', getComplaints);
router.get('/:id', getComplaint);
router.get('/:id/proofs/:proofId', downloadSupportingProof);
router.post('/:id/review', authorize(['ADMIN', 'INVESTIGATOR']), reviewComplaint);

export default router;
