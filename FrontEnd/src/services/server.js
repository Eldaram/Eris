import { authService } from './auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const serverService = {
    /**
     * Create a new server
     * @param {string} name - The name of the server
     * @returns {Promise<Object>} - The created server data
     */
    async createServer(name) {
        try {
            const response = await fetch(`${API_URL}/api/servers`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...authService.getAuthHeader()
                },
                body: JSON.stringify({ name })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create server');
            }

            return data;
        } catch (error) {
            console.error('Create server error:', error);
            throw error;
        }
    }
};
