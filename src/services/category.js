import { getObj, getObjList, execute, getResult } from "../database/operate";
import { insertSql, updateSql } from '../database/utils';

export const addCategory = async (insertData) => {
    const sql = insertSql('category', insertData);
    return await execute(sql);
}
export const updateCategory = async (categortId, updateInfo) => {
    const sql = updateSql('category', updateInfo, { categortId });
    return await execute(sql);
}
export const deleteCategory = async (categortId) => {
    let sqlStr = `delete from category where categoryId = ${categoryId}`;
    return await execute(sqlStr)
}