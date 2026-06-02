export interface MetaPackDto {
    id: string;
    code: string;
    name: string;
    description?: string;
    status: 'DRAFT' | 'PUBLISHED' | 'DISCONTINUED';
    maxRequestsPerMinute?: number;
    maxRequestsPerDay?: number;
    currentVersionId?: string;
    createdBy?: string;
    createdAt?: string;
    updatedBy?: string;
    updatedAt?: string;
    versionItems?: MetaPackVersionItemDto[];
}

export interface MetaPackVersionItemDto {
    id?: string;
    metaCode: string;
    endpointAlias: string;
    returnType: 'ARRAY' | 'OBJECT';
    parentField?: string;
    childField?: string;
    relationType?: 'ONE_TO_ONE' | 'ONE_TO_MANY' | 'MANY_TO_ONE';
    relationField?: string;
    selectedFields?: MetaPackField[];
    parentId?: string;
    position?: { x: number; y: number };
    children?: MetaPackVersionItemDto[];
}

export interface MetaPackVersionDto {
    id: string;
    versionNumber: number;
    status?: string;
    releaseNotes?: string;
    dataConfig?: string;
    dataHash?: string;
    createdBy?: string;
    createdAt?: string;
}

export interface MetaPackField {
    fieldName: string;
    alias: string;
    included: boolean;
    type?: string;
    isVirtual?: boolean;
}

export interface MetaPackRegistration {
    id: string;
    subscriberName: string;
    requestedFields: string; // JSON string
    apiKey?: string;
    apiSettings?: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVOKED';
    customRateLimitPerMinute?: number;
    customRateLimitPerDay?: number;
    expiresAt?: string;
    createdAt?: string;
}
