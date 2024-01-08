// 插入SQL语句
export const insertSql = (database, insertData) => {
    const insertKeyStr = Object.keys(insertData).join(',');
    const insertValueStr = Object.values(insertData).map((e) => {
        return typeof e === 'string' ? `'${e}'` : e;
    }).join(',');
    return `insert into ${database} (${insertKeyStr}) values (${insertValueStr})`;
}
// 更新SQL语句 因为存在更新的子查询，所以这里开放一个字查询语句入口
export const updateSql = (database, updateData, whereData, whereUnit = 'AND') => {
    const updateStr = Object.keys(updateData).map((e) => {
        const str = typeof updateData[e] === 'string' ? `'${updateData[e]}'` : updateData[e];
        return `${e}=${str}`;
    }).join(',');
    const whereStr = Object.keys(whereData).map((e) => {
        const str = typeof updateData[e] === 'string' ? `'${updateData[e]}'` : updateData[e];
        return `${e}=${whereData[e]}`
    }).join(` ${whereUnit} `);
    return `update ${database} set ${updateStr} where ${whereStr}`
}