// 整体的入口文件
const express =  require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => {
    res.send('Hello World!')
})
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})

// export default app;
module.exports = app;