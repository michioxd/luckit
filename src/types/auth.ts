export interface LoginResponseType {
    kind: string;
    localId: string;
    email: string;
    displayName: string;
    idToken: string;
    registered: boolean;
    profilePicture: string;
    refreshToken: string;
    expiresIn: string;
}

export interface LoginPayloadType {
    email: string;
    password: string;
    returnSecureToken: boolean;
    clientType: "CLIENT_TYPE_IOS";
}

export interface RefreshTokenPayloadType {
    grantType: "refresh_token";
    refreshToken: string;
}

export interface RefreshTokenResponseType {
    access_token: string;
    expires_in: string;
    token_type: string;
    refresh_token: string;
    id_token: string;
    user_id: string;
    project_id: string;
}

export interface RequestPhoneOTPResponseType {
    method: string;
    provider: string;
}

export interface VerifyPhoneOTPResponseType {
    token: string;
}
