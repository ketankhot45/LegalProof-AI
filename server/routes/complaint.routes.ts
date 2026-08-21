import { Router } from 'express';
import { createComplaint, getComplaints, getComplaint, reviewComplaint } from '../controllers/complaint.controller.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = Router();

router.use(authenticate);

router.post('/', authorize(['COMPLAINANT']), createComplaint);
router.get('/', getComplaints);
router.get('/:id', getComplaint);
router.post('/:id/review', authorize(['ADMIN', 'INVESTIGATOR']), reviewComplaint);

export default router;
