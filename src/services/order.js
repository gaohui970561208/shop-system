import { getObj, getObjList, execute, getResult } from "../database/operate";
import { insertSql, updateSql } from '../database/utils';
// 订单服务
export const addOrder = async (userId, body) => {
    const reqData = {
        status: body.status,
        address: JSON.stringify(body.address),
        shopId: body.shopId,
        productList: JSON.stringify(body.productList),
        paymentStatus: body.paymentStatus,
        price: body.price,
        payType: body.payType
    };
    //创建订单前，查询当前规格商品库存是否满足，若不满足，则提示用户当前商品库存不足
    let productList = []
    let sqlStr = `select * from category where `
    body.productList.forEach((element, index) => {
        if(index < body.productList.length - 1) {
            sqlStr += `categoryId=${element.categoryId} or `;
        } else {
            sqlStr += `categoryId=${element.categoryId}`;
        }
        productList.push(reqData);
    })
    const fullStatus = await testSockNum(productList);
    if (!fullStatus) {
        return { status: -2 }; // -2 代表库存不足
    }
    const insertData = {
        status: reqData.status,
        shopId: reqData.shopId,
        address: reqData.address,
        productList: reqData.productList,
        paymentStatus: reqData.paymentStatus,
        userId: userId,
        price: reqData.price,
        payType: reqData.payType
    }
    const sql = insertSql('orders', insertData);
    const data = await execute(sql);
    productList.forEach(async (element) => {
        const num = parseInt(element.productNum) || 1;
        const sqlStr = updateSql('category', { cateNum: `(cateNum-${num})` }, { categoryId: element.categoryId });
        await execute(sqlStr);
    })
    return { status: 0, data };
}
/** 检测当前是否有库存 
 * @param { Array<{ categoryId, productNum }> } list 因为规格值可能不同，所以这里使用规格值作为判定标准
 */
export const testSockNum = async (list) => {
    let fullStatus = true; // 库存是否充足
    const whereSql = list.map((e) => {
        return `categoryId=${e.categoryId}`;
    }).join(' or ');
    let sqlStr = `select * from category where ${whereSql}`;
    const productList = await getObjList(sqlStr);
    productList.forEach((e) => {
        list.forEach((j) => {
            if(parseInt(e.categoryId) === parseInt(j.categoryId)) {
                if(parseInt(j.productNum) > parseInt(e.cateNum)) {
                    fullStatus = fasle;
                } 
            }
        })
    })
    return fullStatus;
} 
// 后台获取订单列表
export const getOrderListForShop = async (shopId) => {
    const sql = `select * from orders where shopId=${shopId}`;
    const list = await getObjList(sql)
    list.forEach(element => {
        element.productList = JSON.parse(element.productList);
        element.address = JSON.parse(element.address);
    })
    return list.map((e) => {
        let info = { ...e };
        info.productList = JSON.parse(e.productList);
        info.address = JSON.parse(e.address);
        return info;
    })
}
export const getOrderListForUser = async (userId, status) => {
    let sqlStr = `select * from orders where userId=${userId} order by orderId desc`;
    if(status != -1) {
        sqlStr += ` and status=${status}`
    }
    const list = await getObjList(sqlStr)
    return list.map((e) => {
        let info = { ...e };
        info.productList.JSON.parse(e.productList);
        return info;
    })
}
export const getOrderInfo = async (orderId) => {
    const sqlStr = `select * from orders where orderId=${orderId}`;
    let orderData = await getObj(sqlStr);
    if(!orderData || Object.keys(orderData).length === 0) {
        res.json({code: 1, msg: "未找到此订单"});
        return;
    }
    //获取订单中的商品信息
    const categoryList = JSON.parse(orderData.productList);
    orderData.productList = JSON.parse(orderData.productList);
    orderData.address = JSON.parse(orderData.address);
    const cateSql = categoryList.map((e) => {
        return `category.categoryId=${e.categoryId}`;
    }).join(' or ');
    let productSql = `select * from shops,products,category where shops.shopId=products.shopId and products.productId=category.productId and (${cateSql})`;
    const list = [];
    const productList = await getObjList(productSql);
    productList.forEach((product) => {
        categoryList.forEach((cate) => {
            if(parseInt(cate.categoryId) === parseInt(product.categoryId)) {
                let eData = product;
                eData.productNum = el.productNum;
                list.push(eData);
            }
        })
    })
    orderData.productList = list;
    return orderData;
}
