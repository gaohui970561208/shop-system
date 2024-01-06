import crypto from 'crypto';

const config = {
    secret: 'bf0nDAxsIGThfjhaqdkwbAO7mIEadzOx',
    iv: 'v6jGRpeGny0hsAsH',
}

export const encrypt = data => {
    // createCipher函数接收两个参数
    // 第一个参数为 加密方式 
     //const ciphers = crypto.getCiphers();
     //console.log(ciphers); // ['aes-128-cbc', 'aes-128-ccm', ...] 
    // 通过上述代码 可以获取到crypto支持的所有加密方式
    //第二个参数为加密向量，也称为 加盐（绝对隐私，解密需要用到）
    const cipher = crypto.createCipheriv('aes-256-cbc', config.secret, config.iv)
    let encrypted = cipher.update(data, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    return encrypted
}

export const decrypt = (data) => {
    // 解密数据  解密方式要和加密时使用的一致
    const decipher = crypto.createDecipheriv('aes-256-cbc', config.secret, config.iv)
    let decrypted = decipher.update(data, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
}