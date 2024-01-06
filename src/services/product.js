
import { getObj, getObjList, execute, getResult } from "../database/operate";
import { insertSql, updateSql } from '../database/utils';
// 获取购物车
export const getCartListByUser = async (userId) => {
    const cartList = await getResult(`select shoppingCart from users where userId="${userId}"`);
    const shoppingCartList = JSON.parse(cartList);
    let productList = [];
    //循环已有的数组，将数组中元素添加入sql语句中
    if(shoppingCartList && Array.isArray(shoppingCartList) && shoppingCartList.length) {
        let sqlStr = `select * from shops,products,category where shops.shopId=products.shopId and products.productId=category.productId and (`;
        shoppingCartList.forEach((element, index) => {
            if(index < shoppingCartList.length - 1) {
                sqlStr += `category.categoryId=${element.categoryId} or `;
            } else {
                sqlStr += `category.categoryId=${element.categoryId})`;
            }
        })
        productList =  await getObjList(sqlStr);
    }
    return productList;
}
// 删除购物车内容
export const deleteCartList = async (userId, productList) => {
    const cardData = getObj(`select shoppingCart from users where userId=${userId}`)
    const shoppingCartData = JSON.parse(JSON.stringify(cardData));
    let list = JSON.parse(shoppingCartData.shoppingCart);
    list.forEach((element, index) => {
        productList.forEach(e => {
            if(element.categoryId === e.categoryId) {
                list.splice(index, 1);
            }
        })
    })
    const newShoppingStr = JSON.stringify(list);
    const str = updateSql('users', { shoppingCart: newShoppingStr }, { userId: userId });
    return await execute(str);
}