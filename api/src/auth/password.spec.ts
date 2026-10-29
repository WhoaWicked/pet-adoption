import { hashPassword, comparePassword } from './password';

describe('password', () => {
    it('compare returns true for the original password', async () => {
        // hash แล้ว compare ด้วยรหัสเดิม
        const password_1 = "hello";
        const hashed_password = await hashPassword(password_1);
        let result: boolean;
        result = await comparePassword(password_1, hashed_password);
        expect(result).toBe(true);
    });

    it('compare returns false for a different password', async () => {
        // hash แล้ว compare ด้วยรหัสอื่น
        const password_1 = "hello";
        const password_2 = "wasup"
        const hashed_password = await hashPassword(password_1);
        let result: boolean;
        result = await comparePassword(password_2, hashed_password);
        expect(result).toBe(false);
    });
});