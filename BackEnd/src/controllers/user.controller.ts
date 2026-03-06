import { Request, Response } from 'express';
import { UserInputError, UserService } from '../services/user.service';

export class UserController {
    static async getUsers(req: Request, res: Response) {
        try {
            const users = await UserService.getAllUsers();
            res.json(users);
        } catch (error) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    static async createUser(req: Request, res: Response) {
        try {
            const { username, email, password, confirmPassword } = req.body;
            const user = await UserService.createUser({
                username,
                email,
                password,
                confirmPassword,
            });
            res.status(201).json(user);
        } catch (error) {
            if (error instanceof UserInputError) {
                return res.status(error.statusCode).json({
                    error: error.message,
                    code: error.code,
                });
            }

            console.error('Unexpected error while creating user:', error);

            if (process.env.NODE_ENV !== 'production') {
                return res.status(500).json({
                    error: 'Internal Server Error',
                    details: error instanceof Error ? error.message : String(error),
                });
            }

            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    static async login(req: Request, res: Response) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({
                    error: 'Email and password are required',
                    code: 'INVALID_PASSWORD',
                });
            }

            const result = await UserService.loginUser({ email, password });
            res.status(200).json(result);
        } catch (error) {
            if (error instanceof UserInputError) {
                return res.status(error.statusCode).json({
                    error: error.message,
                    code: error.code,
                });
            }

            console.error('Unexpected error during login:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    static async getMe(req: Request, res: Response) {
        // The user object is injected by the authMiddleware
        const user = req.user;
        if (!user) {
            return res.status(401).json({ error: 'User context not found' });
        }
        res.status(200).json(user);
    }
}
