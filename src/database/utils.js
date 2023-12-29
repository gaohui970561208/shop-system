export const insertSql = (database, insertData) => {
    const insertKeyStr = Object.keys(insertData).join(',');
    const insertValueStr = Object.values(insertData).join(',');
    return `insert into ${database} (${insertKeyStr}) values (${insertValueStr})`;
}

export const updateSql = (database, updateData) => {
    
}