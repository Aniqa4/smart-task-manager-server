import { Router } from 'express';
import { body, param } from 'express-validator';
import * as controller from '../controllers/tasksController';
import validate from '../middleware/validate';

const router = Router();

/**
 * @openapi
 * /api/tasks:
 *   get:
 *     summary: List tasks with optional filters
 *     parameters:
 *       - in: query
 *         name: project
 *         schema:
 *           type: string
 *         description: Filter by project id
 *       - in: query
 *         name: member
 *         schema:
 *           type: string
 *         description: Filter by assigned member id
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/', controller.getTasks);
router.post(
	'/',
	[body('title').isString().trim().notEmpty().withMessage('title is required')],
	validate,
	controller.createTask
);
/**
 * @openapi
 * /api/tasks:
 *   post:
 *     summary: Create a task under a project
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - project
 *               - title
 *             properties:
 *               project:
 *                 type: string
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               assignedMember:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [Low, Medium, High]
 *               status:
 *                 type: string
 *                 enum: [Pending, 'In Progress', Done]
 *     responses:
 *       201:
 *         description: Created
 */
router.get('/:id', [param('id').isMongoId().withMessage('Invalid id')], validate, controller.getTask);
/**
 * @openapi
 * /api/tasks/{id}:
 *   get:
 *     summary: Get a task by id
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
router.put('/:id', [param('id').isMongoId(), body('title').optional().isString()], validate, controller.updateTask);
/**
 * @openapi
 * /api/tasks/{id}:
 *   put:
 *     summary: Update a task
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
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               assignedMember:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [Low, Medium, High]
 *               status:
 *                 type: string
 *                 enum: [Pending, 'In Progress', Done]
 *     responses:
 *       200:
 *         description: OK
 */
router.delete('/:id', [param('id').isMongoId()], validate, controller.deleteTask);

/**
 * @openapi
 * /api/tasks/{id}:
 *   delete:
 *     summary: Delete a task
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: No Content
 */

export default router;
