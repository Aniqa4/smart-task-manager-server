import { Router } from 'express';
import { body, param, query } from 'express-validator';
import * as ctrl from '../controllers/projectsController';
import auth from '../middleware/auth';
import validate from '../middleware/validate';

const router = Router();

router.use(auth);

router.post(
  '/',
  [body('name').isString().trim().notEmpty().withMessage('Project name required'), body('team').isMongoId().withMessage('Valid team id required')],
  validate,
  ctrl.createProject
);

router.get('/', [query('team').optional().isMongoId()], validate, ctrl.listProjects);
router.get('/:id', [param('id').isMongoId()], validate, ctrl.getProject);
router.put('/:id', [param('id').isMongoId(), body('name').optional().isString(), body('description').optional().isString()], validate, ctrl.updateProject);
router.delete('/:id', [param('id').isMongoId()], validate, ctrl.deleteProject);

export default router;

/**
 * @openapi
 * /api/projects:
 *   post:
 *     summary: Create a project linked to a team (owner only)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - team
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               team:
 *                 type: string
 *     responses:
 *       '201':
 *         description: Created
 */
