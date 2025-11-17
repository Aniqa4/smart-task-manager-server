import { Router } from 'express';
import { body } from 'express-validator';
import * as ctrl from '../controllers/authController';
import validate from '../middleware/validate';

const router = Router();

router.post(
	'/register',
	[
		body('username').isString().trim().isLength({ min: 3 }).withMessage('username must be at least 3 chars'),
		body('password').isString().isLength({ min: 6 }).withMessage('password must be at least 6 chars'),
		body('name').optional().isString().trim()
	],
	validate,
	ctrl.register
);

router.post(
	'/login',
	[
		body('username').isString().trim().notEmpty().withMessage('username required'),
		body('password').isString().notEmpty().withMessage('password required')
	],
	validate,
	ctrl.login
);

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               name:
 *                 type: string
 *     responses:
 *       '201':
 *         description: Created
 */

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Login an existing user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       '200':
 *         description: OK
 */

export default router;
