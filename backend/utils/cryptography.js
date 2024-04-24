const crypto = require('crypto');

const encrypt = (data) => {
    const secretKey = Buffer.from(process.env.APP_SECRET_KEY, 'hex');
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-128-cbc', secretKey, iv);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return { iv: iv.toString('hex'), encryptedData: encrypted };
};

const decrypt = (data) => {
    const secretKey = Buffer.from(process.env.APP_SECRET_KEY, 'hex');
    const iv = Buffer.from(data.iv, 'hex');
    const decipher = crypto.createDecipheriv('aes-128-cbc', secretKey, iv);
    let decrypted = decipher.update(data.encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
};

module.exports = { encrypt, decrypt };