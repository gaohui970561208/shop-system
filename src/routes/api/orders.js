import express from 'express';
import bodyParser from 'body-parser';
const jsonParser = bodyParser.json();
const router = express.Router();
import { testLogin } from '../../services/user';
import { addOrder, getOrderListForShop, getOrderListForUser, getOrderInfo, payOrder, updateOrderStatus, confirmReceipt, orderBack, confirmBack, rejectBack, deleteOrder } from '../../services/order';

//创建订单
router.post('/createOrder', jsonParser, async (req, res, next) => {
    const sessionUserInfo = testLogin(req.session);
    if (!sessionUserInfo) {
        res.json({code: 401, msg: "当前用户未登录"});
        return;
    }
    const userId = sessionUserInfo.id;
    try {
        const orderData = addOrder(userId, req.body);
        const { status, data } = orderData;
        if (status === -2) {
            res.json({code: 1, msg: "当前商品库存不足"});
            return;
        }
        res.json({code: 0, msg: "下单成功", data: data});
    } catch (error) {
        console.error(error);
        res.json({code: -1, msg: "下单失败", data: error});
    }    
}),

//获取订单列表
router.get(`/getOrderList`, jsonParser, async (req, res, next) => {
    const sessionUserInfo = testLogin(req.session);
    if (!sessionUserInfo) {
        res.json({code: 401, msg: "当前用户未登录"});
        return;
    }
    const shopId = req.query.shopId;
    try {
        const data = await getOrderListForShop(shopId);
        res.json({code: 0, msg: "获取成功", data: data});
    } catch (error) {
        console.error(error);
        res.json({code: -1, msg: "获取失败", data: error});
    }
})


//获取订单列表
router.get(`/getOrderListInfo`, jsonParser, async (req, res, next) => {
    const sessionUserInfo = testLogin(req.session);
    if (!sessionUserInfo) {
        res.json({code: 401, msg: "当前用户未登录"});
        return;
    }
    const userId = sessionUserInfo.id;
    const status = req.query.status || null;
    try {
        const data = await getOrderListForUser(userId, status);
        res.json({code: 0, msg: "获取成功", data: data});
    } catch (error) {
        console.error(error);
        res.json({code: -1, msg: "获取失败", data: error});
    }
})

//获取订单详情
router.get(`/orderInfo`, jsonParser, async (req, res, next) => {
    const sessionUserInfo = testLogin(req.session);
    if (!sessionUserInfo) {
        res.json({code: 401, msg: "当前用户未登录"});
        return;
    }
    if(!req.query || Object.keys(req.query).length === 0 || !req.query.orderId) {
        res.json({code: -1, msg: "暂无该订单信息"});
        return;
    }
    const orderId = req.query.orderId;
    try {
        const orderData = await getOrderInfo(orderId);
        res.json({code: 0, msg: "获取成功", data: orderData});
    } catch (error) {
        console.error(error);
        res.json({code: -1, msg: "获取失败", data: error});
    }
})

//订单支付
router.put(`/payOrder`, jsonParser, async (req, res, next) => {
    const sessionUserInfo = testLogin(req.session);
    if (!sessionUserInfo) {
        res.json({code: 401, msg: "当前用户未登录"});
        return;
    }
    if(!req.query || Object.keys(req.query).length === 0 || !req.query.orderId) {
        res.json({code: -1, msg: "暂无该订单信息"});
        return;
    }
    const orderId = req.query.orderId;
    try {
        const payResult = await payOrder(orderId);
        res.json({code: 0, msg: "支付成功"});
    } catch (error) {
        console.error(error);
        res.json({code: -1, msg: "支付失败", data: error});
    }
})

//订单发货
router.put(`/sendOrder`, jsonParser, async (req, res, next) => {
    const sessionUserInfo = testLogin(req.session);
    if (!sessionUserInfo) {
        res.json({code: 401, msg: "当前用户未登录"});
        return;
    }
    if(!req.query || Object.keys(req.query).length === 0 || !req.query.orderId) {
        res.json({code: -1, msg: "暂无该订单信息"});
        return;
    }
    const orderId = req.query.orderId;
    try {
        const result = await updateOrderStatus(orderId, 2);
        res.json({code: 0, msg: "发货成功"});
    } catch (error) {
        console.error(error);
        res.json({code: -1, msg: "发货失败", data: error});
    }
})

//确认收货
router.put(`/confirmOrder`, jsonParser, async (req, res, next) => {
    const sessionUserInfo = testLogin(req.session);
    if (!sessionUserInfo) {
        res.json({code: 401, msg: "当前用户未登录"});
        return;
    }
    if(!req.query || Object.keys(req.query).length === 0 || !req.query.orderId) {
        res.json({code: -1, msg: "暂无该订单信息"});
        return;
    }
    const orderId = req.query.orderId;
    try {
        const status = await confirmReceipt(orderId);
        res.json({code: 0, msg: "收货成功"});
    } catch (error) {
        console.error(error);
        res.json({code: -1, msg: "收货失败", data: error});
    }
})

//发起退款
router.post(`/createBack`, jsonParser, async (req, res, next) => {
    const sessionUserInfo = testLogin(req.session);
    if (!sessionUserInfo) {
        res.json({code: 401, msg: "当前用户未登录"});
        return;
    }
    if(!req.query || Object.keys(req.query).length === 0 || !req.query.orderId) {
        res.json({code: -1, msg: "暂无该订单信息"});
        return;
    }
    const orderId = req.query.orderId;
    try {
        const status = await orderBack(orderId, req.body);
        res.json({code: 0, msg: "退款已发起，请等待店家回应"});
    } catch (error) {
        console.error(error);
        res.json({code: -1, msg: "退款申请失败", data: error});
    }
})
//同意退款
router.put(`/confirmBack`, jsonParser, async (req, res, next) => {
    const sessionUserInfo = testLogin(req.session);
    if (!sessionUserInfo) {
        res.json({code: 401, msg: "当前用户未登录"});
        return;
    }
    if(!req.query || Object.keys(req.query).length === 0 || !req.query.orderId) {
        res.json({code: -1, msg: "暂无该订单信息"});
        return;
    }
    const orderId = req.query.orderId;
    try {
        const status = await confirmBack(orderId);
        res.json({code: 0, msg: "退款成功"});
    } catch (error) {
        console.error(error);
        res.json({code: -1, msg: "退款失败", data: error});
    }
})
//退款驳回
router.put(`/cancelBack`, jsonParser, async (req, res, next) => {
    const sessionUserInfo = testLogin(req.session);
    if (!sessionUserInfo) {
        res.json({code: 401, msg: "当前用户未登录"});
        return;
    }
    if(!req.query || Object.keys(req.query).length === 0 || !req.query.orderId) {
        res.json({code: -1, msg: "暂无该订单信息"});
        return;
    }
    const orderId = req.query.orderId;
    try {
        const status = await rejectBack(orderId);
        res.json({code: 0, msg: "退款取消完成"});
    } catch (error) {
        console.error(error);
        res.json({code: -1, msg: "支付失败", data: error});
    }
})

//删除订单
router.delete(`/deleteOrder`, jsonParser, async (req, res, next) => {
    const sessionUserInfo = testLogin(req.session);
    if (!sessionUserInfo) {
        res.json({code: 401, msg: "当前用户未登录"});
        return;
    }
    if(!req.query || Object.keys(req.query).length === 0 || !req.query.orderId) {
        res.json({code: -1, msg: "暂无该订单信息"});
        return;
    }
    const orderId = req.query.orderId;
    try {
        const status = await deleteOrder(orderId);
        res.json({code: 0, msg: "删除成功"});
    } catch (error) {
        console.error(error);
        res.json({code: -1, msg: "删除失败", data: error});
    }
})

export default router;