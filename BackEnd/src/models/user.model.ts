import prisma from '../config/prisma';
import pb from '../config/pocketbase';

export class UserModel {
    private static escapePocketBaseFilterValue(value: string) {
        return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    }

    // ========== Prisma Operations ==========

    static async getAll() {
        return prisma.user.findMany();
    }

    static async createInPrisma(username: string, pocketbaseId: string) {
        return prisma.user.create({
            data: {
                username,
                pocketbaseId,
            },
        });
    }

    static async findById(id: string) {
        return prisma.user.findUnique({
            where: { id },
        });
    }

    // ========== PocketBase Operations ==========

    static async createInPocketBase(
        username: string,
        email: string,
        password: string,
        passwordConfirm: string,
    ) {
        return pb.collection('users').create({
            username,
            email,
            password,
            passwordConfirm,
            emailVisibility: false,
        });
    }

    static async deleteInPocketBaseById(id: string) {
        return pb.collection('users').delete(id);
    }

    static async findInPocketBaseByUsername(username: string) {
        const safeUsername = this.escapePocketBaseFilterValue(username);

        try {
            return await pb.collection('users').getFirstListItem(`username="${safeUsername}"`);
        } catch (error: any) {
            if (error?.status === 404) {
                return null;
            }
            throw error;
        }
    }

    static async findInPocketBaseByEmail(email: string) {
        const safeEmail = this.escapePocketBaseFilterValue(email);

        try {
            return await pb.collection('users').getFirstListItem(`email="${safeEmail}"`);
        } catch (error: any) {
            if (error?.status === 404) {
                return null;
            }
            throw error;
        }
    }
}
