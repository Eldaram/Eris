import { authService } from './auth';
import { getApiBaseUrl } from './apiBase';

const API_URL = getApiBaseUrl();

const jsonRequest = async (url, options = {}) => {
    const response = await fetch(url, options);
    const contentType = response.headers.get('content-type') || '';

    if (!contentType.includes('application/json')) {
        const bodyText = await response.text();
        throw new Error(
            `Expected JSON from ${url}, but received ${contentType || 'unknown content type'}` +
            (bodyText.startsWith('<!DOCTYPE') || bodyText.startsWith('<html') ? ' (HTML response)' : '')
        );
    }

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || 'Request failed');
    }

    return data;
};

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
    ,
    /**
     * List servers for authenticated user
     */
    async listServers() {
        try {
            const response = await fetch(`${API_URL}/api/servers`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...authService.getAuthHeader()
                }
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch servers');
            }

            return data.servers || [];
        } catch (error) {
            console.error('List servers error:', error);
            throw error;
        }
    },

    /**
     * Get channels for a server
     */
    async getChannels(serverId) {
        try {
            const data = await jsonRequest(`${API_URL}/api/servers/${serverId}/channels`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...authService.getAuthHeader()
                }
            });

            return data.channels || [];
        } catch (error) {
            console.error('Get channels error:', error);
            throw error;
        }
    },

    async isServerOwner(serverId) {
        try {
            return await jsonRequest(`${API_URL}/api/servers/${serverId}/ownership`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...authService.getAuthHeader()
                }
            });
        } catch (error) {
            console.error('Check server ownership error:', error);
            throw error;
        }
    },

    async createRoom(serverId, name) {
        try {
            return await jsonRequest(`${API_URL}/api/servers/${serverId}/rooms`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...authService.getAuthHeader()
                },
                body: JSON.stringify({ name })
            });
        } catch (error) {
            console.error('Create room error:', error);
            throw error;
        }
    },

    async createInvite(serverId) {
        try {
            return await jsonRequest(`${API_URL}/api/servers/${serverId}/invites`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...authService.getAuthHeader()
                }
            });
        } catch (error) {
            console.error('Create invite error:', error);
            throw error;
        }
    },

    async getInvitePreview(code) {
        try {
            return await jsonRequest(`${API_URL}/api/invites/${code}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...authService.getAuthHeader()
                }
            });
        } catch (error) {
            console.error('Get invite preview error:', error);
            throw error;
        }
    },

    async redeemInvite(code) {
        try {
            return await jsonRequest(`${API_URL}/api/invites/${code}/redeem`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...authService.getAuthHeader()
                }
            });
        } catch (error) {
            console.error('Redeem invite error:', error);
            throw error;
        }
    }
};
