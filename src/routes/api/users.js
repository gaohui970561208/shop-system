import express from 'express';
import bodyParser from 'body-parser';
import operate, { getObj, getObjList, execute, getResult } from '../../database/operate';
console.log('operate', operate);
console.log('get obj', getObj);
const jsonParser = bodyParser.json();
const router = express.Router();

router.get('/userInfo', async (req, res, next) => {
    if(!req.query || Object.keys(req.query).length === 0 || !req.query.userId) {
        res.json({code: -1, msg: "服务器出错"});
        return;
    }
    const userId = req.query.userId;
    getObj(`select * from users where userId=${userId}`).then(data => {
        let userInfo = JSON.parse(JSON.stringify(data));
        userInfo.shoppingCart = JSON.parse(userInfo.shoppingCart);
        res.json({code:0, msg:"获取成功", data:userInfo});
        return;
    })
});
//注册账号数据
router.post('/regesiter', jsonParser, async (req,res,next) => {
    //如果为空，则返回请输入用户名登录，前端同时作出限制
    if(!req.body || Object.keys(req.body).length === 0) {
        res.json({code:-1, msg:"请输入用户名"});
        return;
    }
    getObj(`select * from users where userName="${req.body.username}"`).then(userdata => {
        const userInfo = JSON.parse(JSON.stringify(userdata));
        if(userInfo && Object.keys(userInfo).length !== 0) {
            res.json({code: -1, msg: "用户已存在"});
            return;
        }
        execute(`insert into users (userName,password,nickName,phone) values ("${req.body.username}", "${req.body.password}", "${req.body.username}", ${req.body.phone})`).then(data => {
            res.json({code:0, msg:"注册成功", data:data});
        })
    })
});
//登录逻辑内容
router.post(`/login`, jsonParser, async (req,res,next) => {
    //如果为空，则返回请输入用户名登录，前端同时作出限制
    if(!req.body || Object.keys(req.body).length === 0) {
        res.json({code:-1, msg:"请输入用户名"});
        return;
    }
    getObj(`select * from users where userName="${req.body.username}"`).then(data => {
        const userInfo = JSON.parse(JSON.stringify(data));
        if(!data || Object.keys(userInfo).length === 0) {
            res.json({code: -1, msg: "没有这个用户", data:userInfo});
            return;
        }
        const passwordStr = Buffer.from(req.body.password, "base64").toString("ascii");
        const symbolIndex = passwordStr.lastIndexOf("+");
        const password = passwordStr.substring(0,symbolIndex);
        if(password === userInfo.password) {
            //在此使用base64方法执行加密将，名称密码添加入信息中
            const userData = {
                username: req.body.username,
                password: password
            }
            const nameStr = Buffer.from(JSON.stringify(userData)).toString("base64");
            res.cookie("WEBSHOPLOGIN",nameStr,{maxAge: 30 * 60 * 1000, httpOnly: true});
            res.json({code:0, msg:"登录成功", data:userInfo});
            return;
        }
        res.json({code: 1, msg: "密码错误"});
    })
});
//修改账号密码
router.post(`/updatePassword`, jsonParser, async (req, res, next) => {
    if(!req.query || Object.keys(req.query).length === 0 || !req.query.userId) {
        res.json({code: -1, msg: "服务器出错"});
        return;
    }
    const userId = req.query.userId;
    const passwordStr = Buffer.from(req.body.password, "base64").toString("ascii");
    const symbolIndex = passwordStr.lastIndexOf("+");
    const password = passwordStr.substring(0,symbolIndex);
    execute(`update users set password="${password}" where userId=${userId}`).then(data => {
        res.json({code: 0, msg: "修改成功，请重新登录"});
    }).catch(error => {
        res.json({code: -1, msg: "修改失败", data: error});
    })
})

//退出登录
router.get(`/exit`, jsonParser, async (req,res,next) => {
    const nameStr='';
    res.cookie("WEBSHOPLOGIN",nameStr,{maxAge: 0, httpOnly: true});
    res.json({code:0, msg:"退出登录"});
});
//登录状态查询
router.get(`/testLogin`, jsonParser, async (req,res,next) => {
    console.log(res.cookies);
    res.json({code: 0, data: res.cookies});
    return;
    if(!req.cookies["WEBSHOPLOGIN"] || Object.keys(req.cookies["WEBSHOPLOGIN"]).length === 0) {
        res.json({code: -1, data:false});
        return;
    }
    const cookieData = Buffer.from(req.cookies["WEBSHOPLOGIN"], "base64").toString("ascii");
    const userInfo = JSON.parse(cookieData);
    getObj(`select * from users where userName="${userInfo.username}" and password="${userInfo.password}"`).then(data => {
        const userdata = JSON.parse(JSON.stringify(data));
        if(userdata && Object.keys(userdata).length !== 0) {
            res.json({code: 0, data: userdata});
            return;
        }
        else {
            res.json({code: -1, data:false});
        }
    }).catch(error => {
        res.json({code: -1, data:false});
    })
});

//个人信息修改,头像
router.post(`/userAvatarUpdate`, jsonParser, async (req,res,next) => {
    if(!req.query || Object.keys(req.query).length === 0 || !req.query.userId) {
        res.json({code: -1, msg: "服务器出错"});
        return;
    }
    const userId = req.query.userId;
    if(!req.body || Object.keys(req.body).length === 0 || !req.body.avatarUrl) {
        res.json({code:-1, msg:"请选择图片"});
        return;
    }
    const avatarUrl = req.body.avatarUrl;
    execute(`update users set avatarUrl="${avatarUrl}" where userId="${userId}"`).then(data => {
        res.json({code:0, msg: "上传成功"});
    }).catch(error => {
        res.json({code:-1, msg: "上传失败", data: error});
    })
});

//个人信息修改,昵称
router.post(`/userNickNameUpdate`, jsonParser, async (req,res,next) => {
    if(!req.query || Object.keys(req.query).length === 0 || !req.query.userId) {
        res.json({code: -1, msg: "服务器出错"});
        return;
    }
    const userId = req.query.userId;
    if(!req.body || Object.keys(req.body).length === 0 || !req.body.nickName) {
        res.json({code:-1, msg:"请输入昵称"});
        return;
    }
    const nickName = req.body.nickName;
    execute(`update users set nickName="${nickName}" where userId="${userId}"`).then(data => {
        res.json({code:0, msg: "修改成功"});
    }).catch(error => {
        res.json({code:-1, msg: "修改失败", data: error});
    })
});

//个人信息修改,简介
router.post(`/userDescriptUpdate`, jsonParser, async (req,res,next) => {
    if(!req.query || Object.keys(req.query).length === 0 || !req.query.userId) {
        res.json({code: -1, msg: "服务器出错"});
        return;
    }
    const userId = req.query.userId;
    if(!req.body || Object.keys(req.body).length === 0 || !req.body.descript) {
        res.json({code:-1, msg:"请输入简介"});
        return;
    }
    const descript = req.body.descript;
    execute(`update users set descript="${descript}" where userId="${userId}"`).then(data => {
        res.json({code:0, msg: "修改成功"});
    }).catch(error => {
        res.json({code:-1, msg: "修改失败", data: error});
    })
})

//个人信息修改,手机
router.post(`/userPhoneUpdate`, jsonParser, async (req,res,next) => {
    if(!req.query || Object.keys(req.query).length === 0 || !req.query.userId) {
        res.json({code: -1, msg: "服务器出错"});
        return;
    }
    const userId = req.query.userId;
    if(!req.body || Object.keys(req.body).length === 0 || !req.body.phone) {
        res.json({code:-1, msg:"请输入手机号"});
        return;
    }
    const phone = req.body.phone;
    if(!(/^1[3456789]\d{9}$/.test(phone))) {
        res.json({code:-1, msg:"请输入正确的手机号"});
        return;
    }
    execute(`update users set phone="${phone}" where userId=${userId}`).then(data => {
        res.json({code:0, msg: "修改成功"});
    }).catch(error => {
        res.json({code:-1, msg: "修改失败", data: error});
    })
})

//获取购物车列表
router.get(`/getCartList`, jsonParser, async (req,res,next) => {
    if(!req.query || Object.keys(req.query).length === 0 || !req.query.userId) {
        res.json({code: -1, msg: "服务器出错"});
        return;
    }
    const userId = req.query.userId;
    getResult(`select shoppingCart from users where userId="${userId}"`).then(cartList => {
        const shoppingCartList = JSON.parse(cartList);
        //循环已有的数组，将数组中元素添加入sql语句中
        if(!shoppingCartList || !Array.isArray(shoppingCartList) || shoppingCartList.length === 0) {
            res.json({code: 0, msg: "获取成功", data: shoppingCartList});
            return;
        } else {
            let sqlStr = `select * from shops,products,category where shops.shopId=products.shopId and products.productId=category.productId and (`;
            shoppingCartList.forEach((element, index) => {
                if(index < shoppingCartList.length - 1) {
                    sqlStr += `category.categoryId=${element.categoryId} or `;
                } else {
                    sqlStr += `category.categoryId=${element.categoryId})`;
                }
            })
            getObjList(sqlStr).then(productList => {
                res.json({code: 0, msg: "获取成功", data: productList});
            }).catch(error => {
                res.json({code: -1, msg: "获取失败", data: error});
            })
        }
    }).catch(error => {
        res.json({code: -1, msg: "获取失败", data: error});
    })
})

//购物车删除
router.post(`/deleteShoppingCart`, jsonParser, async (req, res, next) => {
    if(!req.query || Object.keys(req.query).length === 0 || !req.query.userId) {
        res.json({code: -1, msg: "服务器繁忙"});
        return;
    }
    const userId = req.query.userId;
    const shopList = req.body;
    getObj(`select shoppingCart from users where userId=${userId}`).then(data => {
        const shoppingCartData = JSON.parse(JSON.stringify(data));
        let list = JSON.parse(shoppingCartData.shoppingCart);
        list.forEach((element, index) => {
            shopList.forEach(e => {
                if(element.categoryId === e.categoryId) {
                    list.splice(index, 1);
                }
            })
        })
        const newShoppingStr = JSON.stringify(list);
        execute(`update users set shoppingCart='${newShoppingStr}' where userId=${userId}`).then(reqData => {
            res.json({code: 0, msg: "删除成功", data: reqData});
        }).catch(error => {
            res.json({code: 0, msg: "服务器繁忙", data: error});
        })
    }).catch(error => {
        res.json({code: 0, msg: "服务器繁忙", data: error});
    })
})

module.exports = router;