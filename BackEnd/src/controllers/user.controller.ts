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
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
}
