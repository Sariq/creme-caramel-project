const MongoClient = require('mongodb').MongoClient;
const mongodbUri = require('mongodb-uri');

let _db;

function initDb(dbUrl, callback){ // eslint-disable-line
    if(_db){
        console.warn('Trying to init DB again!');
        return callback(null, _db);
    }
    MongoClient.connect(dbUrl, { useNewUrlParser: true, useUnifiedTopology: true }, connected);
    function connected(err, client){
        if(err){
            console.log('Failed connecting to the DB', err);
            return callback(err);
        }

        // Set the DB url
        dbUrl = getDbUri(`${dbUrl}/expresscart`);

        // select DB
        const dbUriObj = mongodbUri.parse(dbUrl);

        // Set the DB depending on ENV
        const db = client.db(dbUriObj.database);

        // setup the collections
        db.users = db.collection('users');
        db.categories = db.collection('categories');
        db.products = db.collection('products');
        db.variants = db.collection('variants');
        db.orders = db.collection('orders');
        db.transactions = db.collection('transactions');
        db.pages = db.collection('pages');
        db.menu = db.collection('menu');
        db.customers = db.collection('customers');
        db.cart = db.collection('cart');
        db.sessions = db.collection('sessions');
        db.discounts = db.collection('discounts');
        db.reviews = db.collection('reviews');
        db.amazonconfigs = db.collection('amazonconfigs');
        db.locationPolygon = db.collection('location-polygon');
        db.store = db.collection('store');
        db.calander = db.collection('calander');
        db.clientError = db.collection('client-error');
        db.downloadAppQr = db.collection('download-app-qr');
        db.smsHistory = db.collection('sms-history');
        db.translations = db.collection('translations');
        db.images = db.collection('images');

        _db = db;
        return callback(null, _db);
    }
};

function getDbUri(dbUrl){
    const dbUriObj = mongodbUri.parse(dbUrl);
    // if in testing, set the testing DB
    if(process.env.NODE_ENV === 'test'){
        dbUriObj.database = 'expresscart-test';
    }
    return mongodbUri.format(dbUriObj);
}

function getDb(){
    return _db;
}

module.exports = {
    getDb,
    initDb,
    getDbUri
};
