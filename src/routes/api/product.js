import express from 'express';
import bodyParser from 'body-parser';
const jsonParser = bodyParser.json();
const router = express.Router();
import { testLogin } from '../../services/user';
import { addProdut, getProductInfo, getProductListForShop, getProductList, addShopingCart, searchProductList, updateProduct } from '../../services/product'; 
import { addCategory, updateCategory, deleteCategory } from '../../services/category';
import { addClassify, updateClassify, deleteClassify, getClassifyList } from '../../services/classify';

//添加商品
router.post(`/addProduct`, jsonParser, async (req,res,next) => {
    const sessionUserInfo = testLogin(req.session);
    if (!sessionUserInfo) {
        res.json({code: 401, msg: "当前用户未登录"});
        return;
    }
    if(!req.query || Object.keys(req.query).length === 0 || !req.query.shopId) {
        res.json({code: -1, msg: "暂无该店铺信息"});
        return;
    }
    const shopId = req.query.shopId;
    try {
        const { status } = await addProdut(shopId, req.body);
        res.json({code: 0, msg: "添加成功"});
    } catch (error) {
        console.error(error);
        res.json({code: -1, msg: "添加失败", data: error});
    }
});

//获取商品列表，后台
router.get(`/listBack`, jsonParser, async (req,res,next) => {
    const sessionUserInfo = testLogin(req.session);
    if (!sessionUserInfo) {
        res.json({code: 401, msg: "当前用户未登录"});
        return;
    }
    if(!req.query || Object.keys(req.query).length === 0 || !req.query.shopId) {
        res.json({code: -1, msg: "暂无该店铺信息"});
        return;
    }
    const shopId = req.query.shopId;
    try {
        const list = await getProductListForShop(shopId);
        res.json({code: 0, msg: "获取成功", data: list});
    } catch (error) {
        console.error(error);
        res.json({code: -1, msg: "获取失败", data: error});
    }
}),

//获取商品详情
router.get(`/productInfo`, jsonParser, async (req,res,next) => {
    const sessionUserInfo = testLogin(req.session);
    if (!sessionUserInfo) {
        res.json({code: 401, msg: "当前用户未登录"});
        return;
    }
    if(!req.query || Object.keys(req.query).length === 0 || !req.query.productId) {
        res.json({code: -1, msg: "未找到该商品"});
        return;
    };
    const productId = req.query.productId;
    try {
        const info = await getProductInfo(productId);
        res.json({code: 0, msg: "获取成功", data: info});
    } catch (error) {
        console.error(error);
        res.json({code: -1, msg: "获取失败", data: error});
    }
})

//获取商品列表，移动端
router.get(`/list`, jsonParser, async (req,res,next) => {
    const classifyId = req.query.classifyId || 0;
    try {
        const list = await getProductList(classifyId);
        res.json({code: 0, msg: "获取成功", data: list});
    } catch (error) {
        console.error(error);
        res.json({code: -1, msg: "获取失败", data: error});
    }
})
//添加购物车
router.post(`/addShopingCart`, jsonParser, async (req, res, next) => {
    const sessionUserInfo = testLogin(req.session);
    if (!sessionUserInfo) {
        res.json({code: 401, msg: "当前用户未登录"});
        return;
    }
    const userId = sessionUserInfo.id;
    const productData = req.body;
    try {
        const result = await addShopingCart(userId, productData);
        if (result && result.status === 1) {
            res.json({code: 1, msg: "已经在您的购物车里啦", data: result});
        } else {
            res.json({code: 0, msg: "添加购物车成功", data: result});
        }
    } catch (error) {
        console.error(error);
        res.json({code: -1, msg: "添加失败", data: error});
    }
})

//查询商品，关键字模糊查询
router.post(`/searchProducts`, jsonParser, async (req,res,next) => {
    let shopId = null;
    let title = null;
    // 店铺内查询需要判断登录
    if(req.query && Object.keys(req.query).length > 0 && req.query.shopId) {
        shopId = req.query.shopId;
    }
    if(req.body && Object.keys(req.body).length > 0 && req.body.title) {
        title = req.body.title;
    }
    try {
        const list = await searchProductList(shopId, title);
        res.json({code: 0, msg: "获取成功", data: list});
    } catch (error) {
        console.error(error);
        res.json({code: -1, msg: "获取失败", data: error});
    }
}),

//修改商品信息
router.post(`/updateProduct`, jsonParser, async (req, res, next) => {
    const sessionUserInfo = testLogin(req.session);
    if (!sessionUserInfo) {
        res.json({code: 401, msg: "当前用户未登录"});
        return;
    }
    if(!req.query || Object.keys(req.query).length === 0 || !req.query.productId) {
        res.json({code: -1, msg: "未找到该商品"});
    }
    const productId = req.query.productId;
    const body = {
        productName: req.body.productName,
        productImg: req.body.productImg,
        productDescript: req.body.productDescript,
        productDesList: req.body.productDesList,
        classifyId: req.body.classifyId,
        defaultCategoryId: req.body.defaultCategoryId
    };
    try {
        const result = await updateProduct(productId, body);
        res.json({code: 0, msg: "修改成功", data: result});
    } catch (error) {
        console.error(error);
        res.json({code: -1, msg: "修改失败", data: error});
    }
}),

//添加规格
router.post(`/addCategory`, jsonParser, async (req, res, next) => {
    const sessionUserInfo = testLogin(req.session);
    if (!sessionUserInfo) {
        res.json({code: 401, msg: "当前用户未登录"});
        return;
    }
    if(!req.query || Object.keys(req.query).length === 0 || !req.query.shopId) {
        res.json({code: -1, msg: "请进入对应店铺执行操作"});
    }
    const shopId = req.query.shopId;
    let productId = req.query.productId || 0;
    const body = {
        shopId: shopId,
        productId: productId,
        categoryName: req.body.categoryName,
        cateNum: req.body.cateNum,
        catePrice: req.body.catePrice,
        cateImgUrl: req.body.cateImgUrl
    };
    try {
        const result = await addCategory(body);
        res.json({code: 0, msg: "添加成功", data: result});
    } catch (error) {
        console.error(error);
        res.json({code: -1, msg: "添加失败", data: error});
    }
})

//修改规格
router.post(`/updateCategory`, jsonParser, async (req, res, next) => {
    const sessionUserInfo = testLogin(req.session);
    if (!sessionUserInfo) {
        res.json({code: 401, msg: "当前用户未登录"});
        return;
    }
    if(!req.query || Object.keys(req.query).length === 0 || !req.query.categoryId) {
        res.json({code: -1, msg: "未找到该规格"});
    }
    const categoryId = req.query.categoryId;
    const body = {
        categoryName: req.body.categoryName,
        cateNum: req.body.cateNum,
        catePrice: req.body.catePrice,
        cateImgUrl: req.body.cateImgUrl
    };
    try {
        const result = await updateCategory(categoryId, body);
        res.json({code: 0, msg: "修改成功", data: result});
    } catch (error) {
        console.error(error);
        res.json({code: -1, msg: "修改失败", data: error});
    }
})

//删除规格
router.delete(`/deleteCategory`, jsonParser, async (req, res, next) => {
    const sessionUserInfo = testLogin(req.session);
    if (!sessionUserInfo) {
        res.json({code: 401, msg: "当前用户未登录"});
        return;
    }
    if(!req.query || Object.keys(req.query).length === 0 || !req.query.categoryId) {
        res.json({code: -1, msg: "未找到该规格"});
    }
    const categoryId = req.query.categoryId;
    try {
        const result = await deleteCategory(categoryId);
        res.json({code: 0, msg: "删除成功"});
    } catch (error) {
        console.error(error);
        res.json({code: -1, msg: "删除失败"});
    }
})

//上下架和删除商品
router.post(`/updateProductStatus`, jsonParser, async (req, res, next) => {
    const sessionUserInfo = testLogin(req.session);
    if (!sessionUserInfo) {
        res.json({code: 401, msg: "当前用户未登录"});
        return;
    }
    if(!req.query || Object.keys(req.query).length === 0 || !req.query.productId) {
        res.json({code: -1, msg: "未找到该商品"});
    }
    const productId = req.query.productId;
    const type = req.body.type;
    if(parseInt(type) === 1) {
        const status = req.body.status;
        try {
            const result = await updateProduct(productId, { status });
            res.json({code: 0, msg: "修改成功"});
        } catch (error) {
            console.error(error);
            res.json({code: -1, msg: "修改失败", data: error});
        }
    } else if(parseInt(type) === 2) {
        try {
            const result = await updateProduct(productId, { isDelete: 1 });
            res.json({code: 0, msg: "删除成功"});
        } catch (error) {
            console.error(error);
            res.json({code: -1, msg: "删除失败", data: error});
        }
    }
})

//添加分类
router.post(`/addClassify`, jsonParser, async (req, res, next) => {
    if(!req.body || Object.keys(req.body).length === 0 || !req.body.classifyName) {
        res.json({code: -1, msg: "服务器繁忙"});
    }
    const { classifyName } = req.body;
    try {
        const result = await addClassify({ classifyName });
        res.json({code: 0, msg: "添加成功"});
    } catch (error) {
        console.error(error);
        res.json({code: -1, msg: "添加失败", data: error});
    }
})

//删除分类
router.delete(`/deleteClassify`, jsonParser, async (req, res, next) => {
    if(!req.query || Object.keys(req.query).length === 0 || !req.query.classifyId) {
        res.json({code: -1, msg: "服务器繁忙"});
    }
    const classifyId = req.query.classifyId;
    try {
        const result = await deleteClassify(classifyId);
        res.json({code: 0, msg: "删除成功"});
    } catch (error) {
        console.error(error);
        res.json({code: -1, msg: "删除失败", data: error});
    }
})

//获取分类列表
router.get(`/getClassifyList`, jsonParser, async (req, res, next) => {
    try {
        const list = await getClassifyList();
        res.json({code: 0, msg: '获取成功', data: list})
    } catch (error) {
        console.error(error);
        res.json({code: -1, msg: "获取失败", data: error});
    }
})

export default router;