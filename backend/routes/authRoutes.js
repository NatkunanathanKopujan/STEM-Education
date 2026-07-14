import { Router } from 'express';
import {
  changePassword,
  forgotPassword,
  login,
  logout,
  me,
  resetPassword,
  verify,
} from '../controllers/authController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { loginRateLimiter } from '../middleware/rateLimitMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';
import {
  changePasswordValidator,
  forgotPasswordValidator,
  loginValidator,
  resetPasswordValidator,
} from '../validators/authValidators.js';

const router = Router();

router.post('/login', loginRateLimiter, loginValidator, validateRequest, login);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, me);
router.get('/verify', authenticate, verify);
router.put('/change-password', authenticate, changePasswordValidator, validateRequest, changePassword);
router.post('/forgot-password', forgotPasswordValidator, validateRequest, forgotPassword);
router.post('/reset-password', resetPasswordValidator, validateRequest, resetPassword);

export default router;
