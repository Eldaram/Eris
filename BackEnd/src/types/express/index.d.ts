import { User } from '@prisma/client';

declare global {
    namespace Express {
        export interface Request {
            user?: User | any; // 'any' for the PocketBase user fallback defined in User.service if prisma user is missing
        }
    }
}
