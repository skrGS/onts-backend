import crypto from 'crypto';
/**
 * @author tushig
 */
export const random = () => crypto.randomBytes(128).toString('base64');
export const authentication = ( salt: string, password: string) => {
    return crypto.createHmac('sha256', [salt, password].join("/")).update(password).digest('hex');
}