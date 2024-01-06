import { encrypt, decrypt } from "../utils/crypto";
import { getObj, getObjList, execute, getResult } from "../database/operate";
import { insertSql, updateSql } from '../database/utils';
// 用户服务
// 用户信息加密
export const encryptUserInfo = (info) => {
    const infoStr = JSON.stringify(info);
    return encrypt(infoStr);
}
// 获取加密的用户信息
export const decryptUserInfo = (data) => {
    const infoStr = decrypt(data);
    return infoStr ? JSON.parse(infoStr) : null;
}

// 获取用户信息
export const getUserInfo =  async (userId) => {
    const data = await getObj(`select * from users where userId=${userId}`);
    return data;
}
// 测试用户是否存在
export const testUser = async (username) => {
    return await getObj(`select * from users where username="${username}"`);
}
// 添加用户
export const addUser = async (body) => {
    const sql = insertSql('users', body);
    const data = execute(sql);
    return data;
}
// 更新用户
export const updateUser = async (userId, body) => {
    const sql = updateSql('users', body, { userId: userId });
    return await execute(sql);
}
// 删除用户
export const delUser = async () => {}

// 判断当前用户是否登录
export const testLogin = (session) => {
    if (!session || !session.user) {
        return null;
    }
    // 获取当前session信息，如果当前不存在，说明未登录
    const sessionUserInfo = decryptUserInfo(session.user);
    if (!sessionUserInfo) {
        return null;
    }
    return sessionUserInfo;
}