import { Request, Response, NextFunction } from 'express';
import { UserService, UserInputError } from '../services/user.service';

/**
 * Authentication middleware that verifies the Bearer token in the Authorization header.
 * If valid, it attaches the user object to `req.user`.
 * If invalid or missing, it returns a 401 Unauthorized response.
 * 
 * Note: Apply this middleware explicitly ONLY on routes that require authentication.
 */
export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            error: 'Authentication token is missing or invalid format',
            code: 'MISSING_TOKEN',
        });
    }

    const token = authHeader.split(' ')[1];

    try {
        const { user } = await UserService.verifyAuthToken(token);

        // Attach the authenticated user to the request object
        req.user = user;

        next();
    } catch (error) {
        if (error instanceof UserInputError) {
            return res.status(401).json({
                error: error.message,
                code: error.code,
            });
        }

        console.error('Unexpected error during token verification:', error);
        return res.status(401).json({
            error: 'Invalid or expired token',
            code: 'INVALID_TOKEN',
        });
    }
};
