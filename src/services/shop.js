import { getObj, getObjList, execute, getResult } from "../database/operate";
import { insertSql, updateSql } from '../database/utils';
// 店铺相关服务

export const addShop = async (userId, body) => {
    //判断当前用户下有几个店铺，若为5个，则取消创建;
    const searchSql = `select count(*) from shops where userId=${userId}`;
    const count = await getResult(searchSql);
    if (count >= 5) {
        return { status: -1 };
    } else {
        const insertData = {
            userId: userId,
            shopName: body.shopName,
            shopLogo: body.shopLogo,
            shopBrief: body.shopBrief
        }
        const addSql = insertSql('shops', insertData);
        const result = await execute(addSql);
        return { status: 0 };
    }
}
export const updateShop = async (shopId, shopData) => {
    const upSql = updateSql('shops', shopData, { shopId });
    return await execute(upSql);
}
export const deleteShop = async (shopId) => {
    const sql = `delete from shops where shopId=${shopId}`;
    const status = await execute(sql);
    const upSql = updateSql('products', { isDelete: 1 }, { shopId });
    return await execute(upSql);
}
export const getShopList = async (userId) => {
    return await getObjList(`select *  from shops where userId=${userId}`);
}
export const getShopInfo = async (shopId) => {
    return await getObj(`select * from shops where shopId=${shopId}`);
}