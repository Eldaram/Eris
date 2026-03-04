import prisma from '../config/prisma';

export class UserModel {
    static async getAll() {
        return await prisma.user.findMany();
    }

    static async create(username: string) {
        return await prisma.user.create({
            data: {
                username,
            },
        });
    }

    static async findById(id: string) {
        return await prisma.user.findUnique({
            where: { id },
        });
    }
}
