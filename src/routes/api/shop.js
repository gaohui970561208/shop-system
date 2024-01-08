import express from 'express';
import bodyParser from 'body-parser';
const jsonParser = bodyParser.json();
const router = express.Router();
import { getObj, getObjList, execute, getResult } from '../../database/operate';
import { testLogin } from '../../services/user';
import { addShop, updateShop, deleteShop, getShopList, getShopInfo } from '../../services/shop';

//添加店铺
router.post(`/addShop`, jsonParser, async (req, res, next) => {
    const sessionUserInfo = testLogin(req.session);
    if (!sessionUserInfo) {
        res.json({code: 401, msg: "当前用户未登录"});
        return;
    }
    const userId = sessionUserInfo.id;
    try {
        const result = await addShop(userId, req.body);
        const { status } = result;
        if (status === -1) {
            res.json({code: 2, msg: "店铺数量已满"});
        } else {
            res.json({code: 0, msg: "创建成功"});
        }
    } catch (error) {
        console.error(error);
        res.json({code: -1, msg: "创建失败", data:error});
    }
})

//修改店铺信息
router.post(`/updateShop`, jsonParser, async (req,res,next) => {
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
    const shopData = {
        shopName: req.body.shopName,
        shopLogo: req.body.shopLogo,
        shopBrief: req.body.shopBrief
    }
    try {
        const status = await updateShop(shopId, shopData);
        res.json({code: 0, msg: "修改成功"});
    } catch (error) {
        console.error(error);
        res.json({code: -1, msg: "修改失败", data:error});
    }
})

//删除店铺
router.delete(`/deleteShop`, jsonParser, async (req,res,next) => {
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
        const status = await deleteShop(shopId);
        res.json({code:0, msg: "删除成功"});
    } catch (error) {
        console.error(error);
        res.json({code:-1, msg: "删除失败", data:error});
    }
})

//获取店铺信息列表
router.get(`/list`, jsonParser, async (req,res,next) => {
    const sessionUserInfo = testLogin(req.session);
    if (!sessionUserInfo) {
        res.json({code: 401, msg: "当前用户未登录"});
        return;
    }
    const userId = sessionUserInfo.id;
    try {
        const shopList = await getShopList(userId);
        res.json({code: 0, msg: "获取成功", data: shopList});
    } catch (error) {
        console.error(error);
        res.json({code: -1, msg: "获取失败", data: error});
    }
})

//获取店铺详情
router.get('/getShopInfo', jsonParser, async (req, res, next) => {
    const sessionUserInfo = testLogin(req.session);
    if (!sessionUserInfo) {
        res.json({code: 401, msg: "当前用户未登录"});
        return;
    }
    if(!req.query || Object.keys(req.query).length === 0 || !req.query.shopId) {
        res.json({code: -1, msg: "服务器出错"});
        return;
    }
    const shopId = req.query.shopId;
    try {
        const shopInfo = await getShopInfo(shopId);
        res.json({code: 0, msg: '获取成功', data: shopInfo});
    } catch (error) {
        console.error(error);
        res.json({code: -1, msg: "获取失败", data: error});
    }
})

export default router;