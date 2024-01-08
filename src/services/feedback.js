import { getObj, getObjList, execute, getResult } from "../database/operate";
import { insertSql } from "../database/utils"
// 反馈服务
// 添加反馈信息
export const addFeedBack = async (userId, content) => {
    const sql = insertSql('feedback', { userId, feedback: content });
    return await execute(sql);
}