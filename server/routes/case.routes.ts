import { Router } from 'express';
import { getCases, getCase, updateCase, addCaseNote } from '../controllers/case.controller.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = Router();

router.use(authenticate);
router.use(authorize(['ADMIN', 'INVESTIGATOR']));

router.get('/', getCases);
router.get('/:id', getCase);
router.put('/:id', updateCase);
router.post('/:id/notes', addCaseNote);

export default router;
