import express from 'express';
import bodyParser from 'body-parser';
import { testLogin, encryptUserInfo, decryptUserInfo, testUser, getUserInfo, addUser, updateUser } from '../../services/user';
import { getCartListByUser, deleteCartList } from '../../services/product';
const jsonParser = bodyParser.json();
const router = express.Router();

router.get('/userInfo', async (req, res, next) => {
    const sessionUserInfo = testLogin(req.session);
    if (!sessionUserInfo) {
        res.json({code: 401, msg: "当前用户未登录"});
        return;
    }
    const userId = sessionUserInfo.id;
    let userInfo = await getUserInfo(userId);
    userInfo.shoppingCart = JSON.parse(userInfo.shoppingCart);
    res.json({code:0, msg:"获取成功", data:userInfo});
});
//注册账号数据
router.post('/regesiter', jsonParser, async (req,res,next) => {
    //如果为空，则返回请输入用户名登录，前端同时作出限制
    if(!req.body || Object.keys(req.body).length === 0) {
        res.json({code:-1, msg:"请输入用户名"});
        return;
    }
    const userInfo = await testUser(req.body.username);
    if(userInfo && Object.keys(userInfo).length !== 0) {
        res.json({code: -1, msg: "用户已存在"});
        return;
    }
    const insertUserInfo = {
        username: req.body.username,
        password: req.body.password,
        nickname: req.body.username,
        phone: req.body.phone,
    }
    const data = await addUser(insertUserInfo);
    res.json({code:0, msg:"注册成功", data:data});
});
//登录逻辑内容
router.post(`/login`, jsonParser, async (req,res,next) => {
    //如果为空，则返回请输入用户名登录，前端同时作出限制
    if(!req.body || Object.keys(req.body).length === 0) {
        res.json({code:-1, msg:"请输入用户名"});
        return;
    }
    const userInfo = await testUser(req.body.username);
    console.log('userInfo', userInfo);
    if(!userInfo || Object.keys(userInfo).length === 0) {
        res.json({code: -1, msg: "用户名或密码错误"});
        return;
    }
    if(req.body.password === userInfo.password) {
        //在此使用base64方法执行加密将，名称密码添加入信息中
        const userData = {
            id: userInfo.userId,
            username: userInfo.username,
            password: userInfo.password
        }
        if (req.session) {
            req.session.user = encryptUserInfo(userData);
        }
        res.json({code:0, msg:"登录成功", data:userInfo});
        return;
    }
    res.json({code: -1, msg: "用户名或密码错误"});
});
//修改账号密码
router.post(`/updatePassword`, jsonParser, async (req, res, next) => {
    const sessionUserInfo = testLogin(req.session);
    if (!sessionUserInfo) {
        res.json({code: 401, msg: "当前用户未登录"});
        return;
    }
    const userId = sessionUserInfo.id;
    const updateBody = {
        password: req.body.password,
    }
    try {
        const data = await updateUser(userId, updateBody);
        res.json({code: 0, msg: "修改成功，请重新登录"});
    } catch (error) {
        console.error(error);
        res.json({code: -1, msg: "修改失败", data: error});
    }
})

//退出登录
router.get(`/exit`, jsonParser, async (req,res,next) => {
    req.session.user = '';
    res.json({code:0, msg:"退出登录"});
});

//个人信息修改,头像
router.post(`/userAvatarUpdate`, jsonParser, async (req,res,next) => {
    const sessionUserInfo = testLogin(req.session);
    if (!sessionUserInfo) {
        res.json({code: 401, msg: "当前用户未登录"});
        return;
    }
    if(!req.body || Object.keys(req.body).length === 0 || !req.body.avatarUrl) {
        res.json({code:-1, msg:"请选择图片"});
        return;
    }
    const userId = sessionUserInfo.id;
    const updateBody = {
        avatarUrl: req.body.avatarUrl,
    }
    try {
        const data = await updateUser(userId, updateBody);
        res.json({code: 0, msg: "上传成功"});
    } catch (error) {
        console.error(error);
        res.json({code: -1, msg: "上传失败", data: error});
    }
});

//个人信息修改,昵称
router.post(`/userNickNameUpdate`, jsonParser, async (req,res,next) => {
    const sessionUserInfo = testLogin(req.session);
    if (!sessionUserInfo) {
        res.json({code: 401, msg: "当前用户未登录"});
        return;
    }
    if(!req.body || Object.keys(req.body).length === 0 || !req.body.nickname) {
        res.json({code:-1, msg:"请输入昵称"});
        return;
    }
    const userId = sessionUserInfo.id;
    const updateBody = {
        nickname: req.body.nickname,
    }
    try {
        const data = await updateUser(userId, updateBody);
        res.json({code: 0, msg: "修改成功"});
    } catch (error) {
        console.error(error);
        res.json({code: -1, msg: "修改失败", data: error});
    }
});

//个人信息修改,简介
router.post(`/userDescriptUpdate`, jsonParser, async (req,res,next) => {
    const sessionUserInfo = testLogin(req.session);
    if (!sessionUserInfo) {
        res.json({code: 401, msg: "当前用户未登录"});
        return;
    }
    if(!req.body || Object.keys(req.body).length === 0 || !req.body.descript) {
        res.json({code:-1, msg:"请输入简介"});
        return;
    }
    const userId = sessionUserInfo.id;
    const updateBody = {
        descript: req.body.descript,
    }
    try {
        const data = await updateUser(userId, updateBody);
        res.json({code: 0, msg: "修改成功"});
    } catch (error) {
        console.error(error);
        res.json({code: -1, msg: "修改失败", data: error});
    }
})

//个人信息修改,手机
router.post(`/userPhoneUpdate`, jsonParser, async (req,res,next) => {
    const sessionUserInfo = testLogin(req.session);
    if (!sessionUserInfo) {
        res.json({code: 401, msg: "当前用户未登录"});
        return;
    }
    if(!req.body || Object.keys(req.body).length === 0 || !req.body.phone) {
        res.json({code:-1, msg:"请输入手机号"});
        return;
    }
    const userId = sessionUserInfo.id;
    if(!(/^1[3456789]\d{9}$/.test(req.body.phone))) {
        res.json({code:-1, msg:"请输入正确的手机号"});
        return;
    }
    const updateBody = {
        phone: req.body.phone,
    }
    try {
        const data = await updateUser(userId, updateBody);
        res.json({code: 0, msg: "修改成功"});
    } catch (error) {
        console.error(error);
        res.json({code: -1, msg: "修改失败", data: error});
    }
})

//获取购物车列表
router.get(`/getCartList`, jsonParser, async (req,res,next) => {
    const sessionUserInfo = testLogin(req.session);
    if (!sessionUserInfo) {
        res.json({code: 401, msg: "当前用户未登录"});
        return;
    }
    const userId = sessionUserInfo.id;
    try {
        const cartList = await getCartListByUser(userId);
        res.json({code: 0, msg: "获取成功", data: cartList});
    } catch (error) {
        console.error(error);
        res.json({code: -1, msg: "获取失败", data: error});
    }
})

//购物车删除
router.post(`/deleteShoppingCart`, jsonParser, async (req, res, next) => {
    const sessionUserInfo = testLogin(req.session);
    if (!sessionUserInfo) {
        res.json({code: 401, msg: "当前用户未登录"});
        return;
    }
    const userId = sessionUserInfo.id;
    const shopList = req.body;
    try {
        const data = await deleteCartList(userId, shopList);
        res.json({code: 0, msg: "删除成功", data: reqData});
    } catch (error) {
        console.error(error);
        res.json({code: 0, msg: "服务器繁忙", data: error});
    }
})

module.exports = router;