import mysql from 'mysql';

const mysql_config = { // mysql采用pool连接池基础配置 （采用pool连接池与不采用配置略有不同，具体请查看文档）
    connectionLimit : 50, // 最大连接数
    host : '127.0.0.1', // 本地搭建则本机ip,远程服务器则远程服务器ip
    port : 3306,  //连接数据库的端口号
    user : 'root', // mysql 账户
    password : 'gaohui1995', // mysql 密码
    database : 'shopManage', // 要操作的数据库
    supportBigNumbers: true, //数据库支持bigint或decimal类型列时，需要设此option为true （默认：false）
    connectTimeOut: 5000,   //连接超时
}

const pool = mysql.createPool(mysql_config); //创建连接池

export default pool;