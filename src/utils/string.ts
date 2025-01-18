export function validateEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function parseJwt(token: string) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
}

export function validateE164(phoneNumber: string) {
    const reg = /^\+[1-9]\d{1,14}$/;
    return reg.test(phoneNumber);
}

export const timeSinceOf = function (date: number) {

    const text = [
        'y', 'mo', 'd', 'h', 'm', 's'
    ]

    const seconds = Math.floor(((new Date().valueOf()) - (new Date(date).valueOf())) / 1000);

    let interval = seconds / 31536000;

    if (interval > 1) {
        return Math.floor(interval) + text[0];
    }
    interval = seconds / 2592000;
    if (interval > 1) {
        return Math.floor(interval) + text[1];
    }
    interval = seconds / 86400;
    if (interval > 1) {
        return Math.floor(interval) + text[2];
    }
    interval = seconds / 3600;
    if (interval > 1) {
        return Math.floor(interval) + text[3];
    }
    interval = seconds / 60;
    if (interval > 1) {
        return Math.floor(interval) + text[4];
    }
    return Math.floor(seconds) + text[5];
}

export const randomString = function (length: number) {
    const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    for (let i = length; i > 0; --i) {
        result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
}