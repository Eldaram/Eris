import { UserModel } from '../models/user.model';

type UserErrorCode =
    | 'INVALID_USERNAME'
    | 'INVALID_EMAIL'
    | 'USERNAME_ALREADY_EXISTS'
    | 'EMAIL_ALREADY_EXISTS'
    | 'INVALID_PASSWORD'
    | 'PASSWORD_MISMATCH';

export class UserInputError extends Error {
    constructor(
        public readonly code: UserErrorCode,
        message: string,
        public readonly statusCode: number = 400,
    ) {
        super(message);
        this.name = 'UserInputError';
    }
}

export class UserService {
    static async getAllUsers() {
        return UserModel.getAll();
    }

    static async createUser(input: {
        username: string;
        email: string;
        password: string;
        confirmPassword: string;
    }) {
        const normalizedUsername = this.normalizeAndValidateUsername(input.username);
        const normalizedEmail = this.normalizeAndValidateEmail(input.email);
        this.validatePasswordMatch(input.password, input.confirmPassword);
        const password = input.password;
        this.validatePassword(password);

        const [existingUsername, existingEmail] = await Promise.all([
            UserModel.findInPocketBaseByUsername(normalizedUsername),
            UserModel.findInPocketBaseByEmail(normalizedEmail),
        ]);

        if (existingUsername) {
            throw new UserInputError(
                'USERNAME_ALREADY_EXISTS',
                'A user with this username already exists.',
                409,
            );
        }

        if (existingEmail) {
            throw new UserInputError(
                'EMAIL_ALREADY_EXISTS',
                'An account already uses this email.',
                409,
            );
        }

        let pbUser: { id: string };
        try {
            pbUser = await UserModel.createInPocketBase(
                normalizedUsername,
                normalizedEmail,
                password,
                input.confirmPassword,
            );
        } catch (error: any) {
            this.rethrowPocketBaseValidationError(error);
            throw error;
        }

        try {
            return await UserModel.createInPrisma(normalizedUsername, pbUser.id);
        } catch (error) {
            // Compensation step to avoid leaving orphan users in PocketBase.
            try {
                await UserModel.deleteInPocketBaseById(pbUser.id);
            } catch {
                // Keep original error as the root cause for API behavior consistency.
            }
            throw error;
        }
    }

    private static normalizeAndValidateUsername(username: string) {
        const normalized = username.trim();
        if (!normalized) {
            throw new UserInputError('INVALID_USERNAME', 'Username is required.');
        }
        if (normalized.length < 3 || normalized.length > 32) {
            throw new UserInputError('INVALID_USERNAME', 'Username must be between 3 and 32 characters.');
        }

        const usernamePattern = /^[a-zA-Z0-9._-]+$/;
        if (!usernamePattern.test(normalized)) {
            throw new UserInputError(
                'INVALID_USERNAME',
                'Username can only contain letters, numbers, dots, underscores, and hyphens.',
            );
        }

        return normalized;
    }

    private static normalizeAndValidateEmail(email: string) {
        const normalized = email.trim().toLowerCase();
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(normalized)) {
            throw new UserInputError('INVALID_EMAIL', 'Email format is invalid.');
        }

        return normalized;
    }

    private static validatePasswordMatch(password: string, confirmPassword: string) {
        if (password !== confirmPassword) {
            throw new UserInputError('PASSWORD_MISMATCH', 'Passwords do not match.');
        }
    }

    private static validatePassword(password: string) {
        if (!password || password.length < 8) {
            throw new UserInputError('INVALID_PASSWORD', 'Password must be at least 8 characters long.');
        }
    }

    private static rethrowPocketBaseValidationError(error: any): never {
        const fieldErrors = error?.response?.data?.data;
        if (!fieldErrors || typeof fieldErrors !== 'object') {
            throw error;
        }

        if (fieldErrors.email) {
            throw new UserInputError('INVALID_EMAIL', fieldErrors.email.message || 'Email format is invalid.');
        }

        if (fieldErrors.username) {
            throw new UserInputError('INVALID_USERNAME', fieldErrors.username.message || 'Username is invalid.');
        }

        if (fieldErrors.password) {
            throw new UserInputError('INVALID_PASSWORD', fieldErrors.password.message || 'Password is invalid.');
        }

        throw error;
    }
}
