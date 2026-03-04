import { Request, Response } from 'express';
import { UserModel } from '../models/user.model';

export class UserController {
    static async getUsers(req: Request, res: Response) {
        try {
            const users = await UserModel.getAll();
            res.json(users);
        } catch (error) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    static async createUser(req: Request, res: Response) {
        try {
            const { username } = req.body;
            if (!username) {
                return res.status(400).json({ error: 'Username is required' });
            }
            const user = await UserModel.create(username);
            res.status(201).json(user);
        } catch (error) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
}
