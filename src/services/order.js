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
    let sqlStr = `select * from orders where userId=${userId} ${Number(status) !== -1 ? 'and status=' + status : ''} order by orderId desc`;
    const list = await getObjList(sqlStr);
    return list.map((e) => {
        let info = { ...e };
        info.productList = JSON.parse(e.productList);
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
export const payOrder = async (orderId) => {
    const sql = updateSql('orders', { paymentStatus: 2, status: 1 }, { orderId });
    return await execute(sql);
}
export const updateOrderStatus = async (orderId, status) => {
    const sql = updateSql('orders', { status }, { orderId });
    return await execute(sql);
}
export const confirmReceipt = async (orderId) => {
    const result = await updateOrderStatus(orderId, 4);
    const orderData = await getObj(`select * from orders where orderId=${orderId}`);
    const price = orderData.price;
    const upSql = `update users,shops,orders set users.profit=users.profit+${parseInt(price)} where orders.shopId=shops.shopId and shops.userId=users.userId and orders.orderId=${orderId}`;
    return await execute(upSql);
}
export const orderBack = async (orderId, data) => {
    const { backDes } = data;
    const sql = updateSql('orders', { paymentStatus: 2, backDes }, { orderId });
    return await execute(sql)
}
export const confirmBack = async (orderId) => {
    const orderData = await getObj(`select * from orders where orderId=${orderId}`);
    const upSql = updateSql('orders', { status: 5, backStatus: 2 }, { orderId });
    const orderStatus = await execute(upSql);
    const price = orderData.pirce;
    const profitStatus = true;
    if(orderData.status === 3 || orderData.status === 4) {
        //如果当前为确认收货或者订单完成的状态，说明收益已经进入卖家账户，从卖家的账户减去本次退款订单的收益。
        const profitSql =`update users,shops,orders set users.profit=(users.profit-${parseInt(price)}) where orders.shopId=shops.shopId and shops.userId=users.userId and orders.orderId=${orderId}`;
        profitStatus = await execute(profitSql);
    }
    return orderStatus && profitStatus;
}
export const rejectBack = async (orderId) => {
    const upSql = updateSql('orders', { status: 5, backStatus: 3 }, { orderId });
    return await execute(upSql);
}
export const deleteOrder = async (orderId) => {
    const sql = `delete from orders where orderId=${orderId}`;
    return await execute(sql);
}