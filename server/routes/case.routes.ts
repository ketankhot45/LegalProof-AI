import { Router } from 'express';
import { 
  getCases, 
  getCase, 
  updateCase, 
  addCaseNote,
  requestAssignment,
  getAssignmentRequests,
  reviewAssignmentRequest
} from '../controllers/case.controller.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = Router();

router.use(authenticate);
router.use(authorize(['ADMIN', 'INVESTIGATOR']));

router.get('/', getCases);
router.get('/assignment-requests', getAssignmentRequests);
router.post('/assignment-requests/:requestId/review', authorize(['ADMIN']), reviewAssignmentRequest);
router.get('/:id', getCase);
router.put('/:id', updateCase);
router.post('/:id/notes', addCaseNote);
router.post('/:id/assignment-requests', authorize(['INVESTIGATOR']), requestAssignment);

export default router;
