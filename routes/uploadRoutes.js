const AWS = require('aws-sdk');
const uuid = require('uuid/v1');
const requireLogin = require('../middlewares/requireLogin');
const keys = require('../config/keys');

const s3 = new AWS.S3({
    accessKeyId: keys.awsAccessID,
    secretAccessKey: keys.awsSecretAccessKey
});

module.exports = app => {
    app.get('/api/upload', requireLogin, async (req, res) => {
        let key = req.user.id + '/' + uuid() + '.jpeg';
        const params = {
            Bucket: 'my-blog-bucket-555',
            Key: key,
            ContentType: 'image/jpeg'
        };
        s3.getSignedUrl('putObject', params, (err, url) => {
            res.send({key, url})
        })
    })
};
