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

    static async findByPocketBaseId(pocketbaseId: string) {
        return prisma.user.findUnique({
            where: { pocketbaseId },
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

    static async authenticateWithPocketBase(email: string, password: string) {
        // Authenticate the user. It mutates the global pb.authStore, so we clear it right after.
        // For higher concurrency, consider instantiating a localized PocketBase client per request.
        const authData = await pb.collection('users').authWithPassword(email, password);
        pb.authStore.clear();
        return authData;
    }

    static async verifyPocketBaseToken(token: string) {
        // We create a transient PocketBase instance for token verification to avoid mutational race conditions
        // on the shared global `pb` instance's auth store.
        const transientPb = new (pb.constructor as any)(pb.baseUrl);
        transientPb.authStore.save(token, null);

        try {
            return await transientPb.collection('users').authRefresh();
        } finally {
            transientPb.authStore.clear();
        }
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
