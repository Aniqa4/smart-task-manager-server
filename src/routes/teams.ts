import { Router } from 'express';
import { body, param } from 'express-validator';
import * as ctrl from '../controllers/teamController';
import auth from '../middleware/auth';
import validate from '../middleware/validate';

const router = Router();

router.use(auth);

router.post(
	'/',
	[body('name').isString().trim().notEmpty().withMessage('Team name is required')],
	validate,
	ctrl.createTeam
);

/**
 * @openapi
 * /api/teams:
 *   post:
 *     summary: Create a team (owner-only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               members:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     role:
 *                       type: string
 *                     capacity:
 *                       type: integer
 *                       minimum: 0
 *                       maximum: 5
 *     responses:
 *       201:
 *         description: Created
 */

router.get('/', ctrl.listTeams);
/**
 * @openapi
 * /api/teams:
 *   get:
 *     summary: List teams owned by authenticated user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/:id', [param('id').isMongoId().withMessage('Invalid team id')], validate, ctrl.getTeam);
/**
 * @openapi
 * /api/teams/{id}:
 *   get:
 *     summary: Get a team by id (owner only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK
 */

router.post(
	'/:id/members',
	[
		param('id').isMongoId().withMessage('Invalid team id'),
		body('name').isString().trim().notEmpty().withMessage('Member name required'),
		body('role').optional().isString().trim(),
		body('capacity').optional().isInt({ min: 0, max: 5 }).withMessage('capacity must be between 0 and 5')
	],
	validate,
	ctrl.addMember
);

/**
 * @openapi
 * /api/teams/{id}/members:
 *   post:
 *     summary: Add a member to a team (owner only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               role:
 *                 type: string
 *               capacity:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 5
 *     responses:
 *       201:
 *         description: Created
 */

router.delete('/:id/members/:memberId', [param('id').isMongoId(), param('memberId').isMongoId()], validate, ctrl.removeMember);

/**
 * @openapi
 * /api/teams/{id}/members/{memberId}:
 *   delete:
 *     summary: Remove a member from a team (owner only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: memberId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: No Content
 */

router.post('/:id/reassign', [param('id').isMongoId().withMessage('Invalid team id')], validate, ctrl.reassignTasks);

/**
 * @openapi
 * /api/teams/{id}/reassign:
 *   post:
 *     summary: Auto-reassign tasks within a team based on capacities
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Reassignment summary
 */

export default router;
