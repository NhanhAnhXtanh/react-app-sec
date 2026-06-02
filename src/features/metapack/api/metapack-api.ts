import { httpGet, httpJson, httpDelete } from '@/shared/api/http';
import { MetaPackDto, MetaPackRegistration, MetaPackVersionDto } from '../types/metapack';

export const metapackApi = {
    getAll: (): Promise<MetaPackDto[]> => {
        return httpGet<MetaPackDto[]>('/api/v1/metapacks');
    },

    getById: (id: string): Promise<MetaPackDto> => {
        return httpGet<MetaPackDto>(`/api/v1/metapacks/${id}`);
    },

    create: (data: Partial<MetaPackDto>): Promise<MetaPackDto> => {
        return httpJson<MetaPackDto>('/api/v1/metapacks', 'POST', data);
    },

    update: (id: string, data: Partial<MetaPackDto>): Promise<MetaPackDto> => {
        return httpJson<MetaPackDto>(`/api/v1/metapacks/${id}`, 'PUT', data);
    },

    delete: (id: string): Promise<void> => {
        return httpDelete(`/api/v1/metapacks/${id}`);
    },

    getVersions: (packId: string): Promise<MetaPackVersionDto[]> => {
        return httpGet<MetaPackVersionDto[]>(`/api/v1/metapacks/${packId}/versions`);
    },

    // Registrations
    getRegistrations: (packId: string): Promise<MetaPackRegistration[]> => {
        return httpGet<MetaPackRegistration[]>(`/api/v1/metapacks/${packId}/registrations`);
    },

    approveRegistration: (
        regId: string, 
        apiSettings: string, 
        customLimitPm?: number, 
        customLimitPd?: number
    ): Promise<MetaPackRegistration> => {
        const params = new URLSearchParams();
        params.append('apiSettings', apiSettings);
        if (customLimitPm) params.append('customLimitPm', customLimitPm.toString());
        if (customLimitPd) params.append('customLimitPd', customLimitPd.toString());

        return httpJson<MetaPackRegistration>(`/api/v1/metapacks/registrations/${regId}/approve?${params.toString()}`, 'POST', null);
    },

    revokeRegistration: (regId: string): Promise<void> => {
        return httpJson<void>(`/api/v1/metapacks/registrations/${regId}/revoke`, 'POST', null);
    }
};
