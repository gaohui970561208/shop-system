import express from 'express';
import bodyParser from 'body-parser';
const jsonParser = bodyParser.json();
const router = express.Router();
import { getObj, getObjList, execute } from '../../database/operate';

//创建订单
router.post('/createOrder', jsonParser, async (req, res, next) => {
    if(!req.query || Object.keys(req.query).length === 0 || !req.query.userId) {
        res.json({code: -1, msg: "服务器繁忙"});
        return;
    }
    const userId = req.query.userId;
    // const reqData = req.body;
    const reqData = {
        status: req.body.status,
        address: JSON.stringify(req.body.address),
        shopId: req.body.shopId,
        productList: JSON.stringify(req.body.productList),
        paymentStatus: req.body.paymentStatus,
        price: req.body.price,
        payType: req.body.payType
    };
    //创建订单前，查询当前规格商品库存是否满足，若不满足，则提示用户当前商品库存不足
    let productList = []
    let sqlStr = `select * from category where `
    req.body.productList.forEach((element, index) => {
        if(index < req.body.productList.length - 1) {
            sqlStr += `categoryId=${element.categoryId} or `;
        } else {
            sqlStr += `categoryId=${element.categoryId}`;
        }
        productList.push(reqData);
    })
    getObjList(sqlStr).then(data => {
        let fullStatus=true;//库存是否充足
        productList.forEach(element => {
            data.forEach(e => {
                if(parseInt(element.categoryId) === parseInt(e.categoryId)) {
                    if(parseInt(element.productNum) > parseInt(e.cateNum)) {
                        fullStatus = fasle;
                    } 
                }
            })
        })
        if(fullStatus) {
            execute(`insert into orders (status,shopId,address,productList,paymentStatus,userId,price,payType) values (${reqData.status},${reqData.shopId},'${reqData.address}','${reqData.productList}',${reqData.paymentStatus},${userId},${reqData.price},${reqData.payType})`).then(data => {
                //成功之后从库存中减去相应的数量
                productList.forEach(element => {
                    execute(`update category set cateNum=(cateNum-${parseInt(element.productNum)}) where categoryId=${element.categoryId}`);
                })
                res.json({code: 0, msg: "下单成功", data: data});
            }).catch(error => {
                res.json({code: -1, msg: "下单失败", data: error});
            })
        } else {
            res.json({code: 1, msg: "当前商品库存不足"});
        }
    }).catch(error => {
        res.json({code: -1, msg: "下单失败", data: error});
    })
    
}),

//获取订单列表
router.get(`/getOrderList`, jsonParser, async (req, res, next) => {
    if(!req.query || Object.keys(req.query).length === 0 || !req.query.shopId) {
        res.json({code: -1, msg: "服务器繁忙"});
        return;
    }
    const shopId = req.query.shopId;
    getObjList(`select * from orders where shopId=${shopId}`).then(data => {
        data.forEach(element => {
            element.productList = JSON.parse(element.productList);
            element.address = JSON.parse(element.address);
        })
        res.json({code: 0, msg: "获取成功", data: data});
    }).catch(error => {
        res.json({code: -1, msg: "获取失败", data: error});
    })
})


//获取订单列表
router.get(`/getOrderListInfo`, jsonParser, async (req, res, next) => {
    if(!req.query || Object.keys(req.query).length === 0 || !req.query.userId) {
        res.json({code: -1, msg: "服务器繁忙"});
        return;
    }
    const userId = req.query.userId;
    const status = req.query.status;
    let sqlStr = `select * from orders where userId=${userId} order by orderId desc`;
    if(status != -1) {
        sqlStr += ` and status=${status}`
    }
    getObjList(sqlStr).then(data => {
        data.forEach(element => {
            element.productList = JSON.parse(element.productList);
        })
        res.json({code: 0, msg: "获取成功", data: data});
    }).catch(error => {
        res.json({code: -1, msg: "获取失败", data: error});
    })
})

//获取订单详情
router.get(`/orderInfo`, jsonParser, async (req, res, next) => {
    if(!req.query || Object.keys(req.query).length === 0 || !req.query.orderId) {
        res.json({code: -1, msg: "服务器繁忙"});
        return;
    }
    const orderId = req.query.orderId;
    getObj(`select * from orders where orderId=${orderId}`).then(data => {
        let orderData = JSON.parse(JSON.stringify(data));
        if(!orderData || Object.keys(orderData).length === 0) {
            res.json({code: 1, msg: "未找到此订单"});
            return;
        }
        //获取订单中的商品信息
        const categoryList = JSON.parse(orderData.productList);
        orderData.productList = JSON.parse(orderData.productList);
        orderData.address = JSON.parse(orderData.address);
        let sqlStr = `select * from shops,products,category where shops.shopId=products.shopId and products.productId=category.productId and (`;
        categoryList.forEach((element, index) => {if(index < categoryList.length - 1) {
                sqlStr += `category.categoryId=${element.categoryId} or `;
            } else {
                sqlStr += `category.categoryId=${element.categoryId})`;
            }
        });
        orderData.productList = [];
        getObjList(sqlStr).then(pList => {
            //获取到列表之后添加响应数量
            pList.forEach(e => {
                categoryList.forEach(el => {
                    if(parseInt(el.categoryId) === parseInt(e.categoryId)) {
                        let eData = e;
                        eData.productNum = el.productNum;
                        orderData.productList.push(eData);
                    }
                })
            })
            res.json({code: 0, msg: "获取成功", data: orderData});
        }).catch(error => {
            res.json({code: -1, msg: "获取失败", data: error});
        })
    }).catch(error => {
        res.json({code: -1, msg: "获取失败", data: error});
    })
})

//订单支付
router.put(`/payOrder`, jsonParser, async (req, res, next) => {
    if(!req.query || Object.keys(req.query).length === 0 || !req.query.orderId) {
        res.json({code: -1, msg: "服务器繁忙"});
        return;
    }
    const orderId = req.query.orderId;
    execute(`update orders set paymentStatus=2,status=1 where orderId=${orderId}`).then(data => {
        res.json({code: 0, msg: "支付成功"});
    }).catch(error => {
        res.json({code: -1, msg: "支付失败", data: error});
    })
})

//订单发货
router.put(`/sendOrder`, jsonParser, async (req, res, next) => {
    if(!req.query || Object.keys(req.query).length === 0 || !req.query.orderId) {
        res.json({code: -1, msg: "服务器繁忙"});
        return;
    }
    const orderId = req.query.orderId;
    execute(`update orders set status=2 where orderId=${orderId}`).then(data => {
        res.json({code: 0, msg: "发货成功"});
    }).catch(error => {
        res.json({code: -1, msg: "发货失败", data: error});
    })
})

//确认收获
router.put(`/confirmOrder`, jsonParser, async (req, res, next) => {
    if(!req.query || Object.keys(req.query).length === 0 || !req.query.orderId) {
        res.json({code: -1, msg: "服务器繁忙"});
        return;
    }
    const orderId = req.query.orderId;
    execute(`update orders set status=4 where orderId=${orderId}`).then(data => {
        //将订单价格添加入收入中
        getObj(`select * from orders where orderId=${orderId}`).then(orderData => {
            const orderReData = JSON.parse(JSON.stringify(orderData));
            const price = orderReData.price;
            let sqlStr = `update users,shops,orders set users.profit=users.profit+${parseInt(price)} where orders.shopId=shops.shopId and shops.userId=users.userId and orders.orderId=${orderId}`;
            console.log(sqlStr);
            execute(sqlStr).then(redata => {
                res.json({code: 0, msg: "收货成功"});
            }).catch(error => {
                res.json({code: -1, msg: "服务器繁忙"});
            })
        }).catch(error => {
            res.json({code: -1, msg: "服务器繁忙"});
        });
    }).catch(error => {
        res.json({code: -1, msg: "收货失败", data: error});
    })
})

//发起退款
router.post(`/createBack`, jsonParser, async (req, res, next) => {
    if(!req.query || Object.keys(req.query).length === 0 || !req.query.orderId) {
        res.json({code: -1, msg: "服务器繁忙"});
        return;
    }
    const orderId = req.query.orderId;
    const backDes = req.body.backDes;
    execute(`update orders set backStatus=1,backDes="${backDes}" where orderId=${orderId}`).then(data => {
        res.json({code: 0, msg: "退款已发起，请等待店家回应"});
    }).catch(error => {
        res.json({code: -1, msg: "退款申请失败", data: error});
    })
})
//同意退款
router.put(`/confirmBack`, jsonParser, async (req, res, next) => {
    if(!req.query || Object.keys(req.query).length === 0 || !req.query.orderId) {
        res.json({code: -1, msg: "服务器繁忙"});
        return;
    }
    const orderId = req.query.orderId;
    execute(`update orders set status=5,backStatus=2 where orderId=${orderId}`).then(data => {
        if(orderData.status === 3 || orderData.status === 4) {
            const price = orderData.pirce;
            //如果当前为确认收货或者订单完成的状态，说明收益已经进入卖家账户，从卖家的账户减去本次退款订单的收益。
            let sqlStr=`update users,shops,orders set users.profit=(users.profit-${parseInt(price)}) where orders.shopId=shops.shopId and shops.userId=users.userId and orders.orderId=${orderId}`
            //首先更新订单的状态为退款
            execute(`update orders set status=5,backStatus=2 where orderId=${orderId}`).then(data => {
                //执行减少收益的sql语句
                execute(sqlStr).then(resData => {
                    res.json({code: 0, msg: "退款成功"});
                }).catch(error => {
                    res.json({code: -1, msg: "退款失败", data: error});
                })
            }).catch(error => {
                res.json({code: -1, msg: "退款失败", data: error});
            })
        } else {
            execute(`update orders set status=5,backStatus=2 where orderId=${orderId}`).then(data => {
                res.json({code: 0, msg: "退款成功"});
            }).catch(error => {
                res.json({code: -1, msg: "退款失败", data: error});
            })
        }
    }).catch(error => {
        res.json({code: -1, msg: "支付失败", data: error});
    })
})
//退款驳回
router.put(`/cancelBack`, jsonParser, async (req, res, next) => {
    if(!req.query || Object.keys(req.query).length === 0 || !req.query.orderId) {
        res.json({code: -1, msg: "服务器繁忙"});
        return;
    }
    const orderId = req.query.orderId;
    execute(`update orders set backStatus=3 where orderId=${orderId}`).then(data => {
        res.json({code: 0, msg: "退款取消完成"});
    }).catch(error => {
        res.json({code: -1, msg: "支付失败", data: error});
    })
})

//删除订单
router.delete(`/deleteOrder`, jsonParser, async (req, res, next) => {
    if(!req.query || Object.keys(req.query).length === 0 || !req.query.orderId) {
        res.json({code: -1, msg: "服务器繁忙"});
        return;
    }
    const orderId = req.query.orderId;
    execute(`delete from orders where orderId=${orderId}`).then(data => {
        res.json({code: 0, msg: "删除成功"});
    }).catch(error => {
        res.json({code: -1, msg: "删除失败", data: error});
    })
})

module.exports = router;