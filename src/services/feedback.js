import { insertSql } from "../database/utils"
// 反馈服务
// 添加反馈信息
export const addFeedBack = async (userId, content) => {
    const sql = insertSql('beedback', { userId, feedback });
    return await execute(sql);
}