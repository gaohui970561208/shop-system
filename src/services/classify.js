import { getObj, getObjList, execute, getResult } from "../database/operate";
import { insertSql, updateSql } from '../database/utils';

export const addClassify = async (insertData) => {
    const sql = insertSql('classify', insertData);
    return await execute(sql);
}
export const updateClassify = async (categortId, updateInfo) => {
    const sql = updateSql('classify', updateInfo, { categortId });
    return await execute(sql);
}
export const deleteClassify = async (classifyId) => {
    let sqlStr = `delete from classify where classifyId = ${classifyId}`;
    return await execute(sqlStr)
}
export const getClassifyList = async () => {
    return await getObjList(`select * from classify`);
}