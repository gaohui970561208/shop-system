import express from 'express';
import bodyParser from 'body-parser';
const jsonParser = bodyParser.json();
const router = express.Router();
import { addFeedBack } from '../../services/feedback';
import { testLogin } from '../../services/user';

router.post(`/sendFeedback`, jsonParser, async (req, res, next) => {
    const sessionUserInfo = testLogin(req.session);
    if (!sessionUserInfo) {
        res.json({code: 401, msg: "当前用户未登录"});
        return;
    }
    const userId = sessionUserInfo.id;
    const { feedback } = req.body;
    try {
        const data = await addFeedBack(userId, feedback);
        res.json({code: 0, msg: "提交成功,感谢您的反馈"});
    } catch (error) {
        res.json({ode: -1, msg: "提交失败", data: error});
    }
})

export default router;