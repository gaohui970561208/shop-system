
import { getObj, getObjList, execute, getResult } from "../database/operate";
import { insertSql, updateSql } from '../database/utils';
export const addShopingCart = async (userId, body) => {
    let resData = [];
    const cartData = await getResult(`select shoppingCart from users where userId="${userId}"`)
    //在购物车没有东西的情况下，直接添加信息
    if(!cartData || JSON.parse(cartData).length === 0) {
        //将规格的id存入购物车中
        resData.push(body);
        const resStr = JSON.stringify(resData);
        const upSql = updateSql('users', { shoppingCart: resStr }, { userId });
        const result = await execute(upSql);
        return { status: 0, data: result };
    } else {
        const shoppingCartData = JSON.parse(cartData);
        //对比已有数据，有则添加，没有则加入
        const cateInfo = shoppingCartData.find((e) => parseInt(e.categoryId) === parseInt(body.categoryId));
        if (cateInfo) {
            return { status: -1, data: cateInfo };
        } else {
            resData = JSON.parse(cartData);
            resData.push(body);
            const resStr = JSON.stringify(resData);
            const upSql = updateSql('users', { shoppingCart: resStr }, { userId });
            const result = await execute(upSql);
            return { status: 0, data: result };
        }
    }
}
// 获取购物车
export const getCartListByUser = async (userId) => {
    const cartList = await getResult(`select shoppingCart from users where userId="${userId}"`);
    const shoppingCartList = JSON.parse(cartList);
    let productList = [];
    //循环已有的数组，将数组中元素添加入sql语句中
    if(shoppingCartList && Array.isArray(shoppingCartList) && shoppingCartList.length) {
        const whereSql = shoppingCartList.map((e) => {
            return `category.categoryId=${e.categoryId}`;
        }).join(' or ');
        let sqlStr = `select * from shops,products,category where shops.shopId=products.shopId and products.productId=category.productId and (${whereSql})`;
        productList =  await getObjList(sqlStr);
    }
    return productList;
}
// 删除购物车内容
export const deleteCartList = async (userId, productList) => {
    const cardData = await getObj(`select shoppingCart from users where userId=${userId}`)
    const shoppingCartData = JSON.parse(JSON.stringify(cardData));
    let list = JSON.parse(shoppingCartData.shoppingCart);
    list.forEach((e, index) => {
        productList.forEach(e => {
            if(e.categoryId === e.categoryId) {
                list.splice(index, 1);
            }
        })
    })
    const newShoppingStr = JSON.stringify(list);
    const str = updateSql('users', { shoppingCart: newShoppingStr }, { userId: userId });
    return await execute(str);
}
// 添加商品
export const addProdut = async (shopId, body) => {
    const productData = {
        productName: body.productName,
        productImg: body.productImg,
        productDescript: body.productDescript,
        productDesList: body.productDesList.join(" && "),
        classifyId: body.classifyId,
        shopId: shopId,
        status: body.status,
        defaultCategoryId: body.defaultCategoryId,
    };
    const categoryList = body.categoryList;
    //对数据进行处理，首先进行商品添加
    const sql = insertSql('products', productData);
    const result = await execute(sql);
    const whereSql = categoryList.map((e) => {
        return `categoryId=${e.categoryId}`;
    }).join(' or ');
    let categorySql = `update category set productId=${result.insertId} where ${whereSql}`;
    //添加成功后将关联规格的productId连接到新创建的商品中
    const cateResult = await execute(categorySql);
    return cateResult;
}
// 获取商品列表
export const getProductListForShop = async (shopId) => {
    const list = await getObjList(`select * from products,category where products.productId=category.productId and products.defaultCategoryId = category.categoryId and products.shopId="${shopId}" and products.isDelete=0`);
    return list.map((e) => {
        let info = { ...e };
        const cateData = {
            categoryId: e.categoryId,
            categoryName: e.categoryName,
            cateNum: e.cateNum,
            catePrice: e.catePrice,
            cateImgUrl: e.cateImgUrl
        };
        info.productDesList = e.productDesList.split("&&");
        info.categoryList = [];
        info.categoryList.push(cateData);
        return info;
    })
}
export const getProductInfo = async (productId) => {
    const result = await getObj(`select * from shops,products,category where shops.shopId=products.shopId and products.productId="${productId}" and products.isDelete=0 and products.defaultCategoryId=category.categoryId`);
    let info = { ...result };
    info.productDesList = info.productDesList.split('&&');
    const cateData = await getObjList(`select * from category where productId="${productId}"`);
    info.categoryList = cateData;
    return info;
}
// 移动端获取商品列表
export const getProductList = async (classifyId) => {
    let sqlStr = `select * from products,category where products.productId=category.productId and products.defaultCategoryId = category.categoryId and products.isDelete=0 and products.status=1`;
    if(parseInt(classifyId)) {
        sqlStr += ` and products.classifyId=${classifyId}`;
    }
    sqlStr += ' order by products.hotNum desc';
    const list = await getObjList(sqlStr);
    return list.map((e) => {
        let info = { ...e };
        const cateData = {
            categoryId: e.categoryId,
            categoryName: e.categoryName,
            cateNum: e.cateNum,
            catePrice: e.catePrice,
            cateImgUrl: e.cateImgUrl
        };
        info.productDesList = e.productDesList.split("&&");
        info.categoryList = [];
        info.categoryList.push(cateData);
        return info;
    })
}
export const searchProductList = async (shopId, title) => {
    let sqlStr = `select * from products,category where products.productId=category.productId and products.defaultCategoryId = category.categoryId and products.isDelete=0`;
    //若存在shopId,则说明需要在店铺内查询
    if(shopId) {
        sqlStr += ` and products.shopId=${shopId}`;
    } else {
        //若不存在，则说明是在移动端，此时非上架物品不显示
        sqlStr += ` and products.status=1`;
    }
    if(title) {
        sqlStr += ` and products.productName like "%${title}%"`;
    }
    const list = await getObjList(sqlStr)
    return list.map((e) => {
        let info = { ...e };
        info.productDesList = e.productDesList.split('&&');
        return info
    })
}
export const updateProduct = async (productId, body) => {
    const updateInfo = {
        productName: body.productName,
        productImg: body.productImg,
        productDescript: body.productDescript,
        productDesList: body.productDesList.join(" && "),
        classifyId: body.classifyId,
        status: body.status,
        defaultCategoryId: body.defaultCategoryId,
    };
    const categoryList = body.categoryList;
    //对数据进行处理，首先进行商品更新
    const upSql = updateSql('products', updateInfo, { productId });
    const result = await execute(upSql);
    const whereSql = categoryList.map((e) => {
        return `categoryId=${e.categoryId}`;
    }).join(' or ');
    let categorySql = `update category set productId=${productId} where ${whereSql}`;
    //添加成功后将关联规格的productId连接到新创建的商品中
    const cateResult = await execute(categorySql);
    return cateResult;
}