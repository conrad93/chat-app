const multer = require('multer');

let memoryStorage = multer.memoryStorage();

const none = () => multer().none();

const tempUpload = multer({ storage: memoryStorage });

module.exports = {
    none,
    tempUpload
};