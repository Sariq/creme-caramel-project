const express = require('express');
const {
    clearSessionValue,
    getCountryList,
    getId,
    sendEmail,
    getEmailTemplate,
    clearCustomer,
    sanitize
} = require('../lib/common');
const {
    paginateData
} = require('../lib/paginate');
const {
    emptyCart
} = require('../lib/cart');
const { restrict, checkAccess } = require('../lib/auth');
const { indexOrders } = require('../lib/indexing');
const router = express.Router();

// Show orders
router.get('/api/order/admin/orders/:page?', async (req, res, next) => {
    let pageNum = 1;
    if(req.params.page){
        pageNum = req.params.page;
    }

    // Get our paginated data
    const orders = await paginateData(false, req, pageNum, 'orders', {}, { orderDate: -1 });

    // If API request, return json
    // if(req.apiAuthenticated){
        res.status(200).json({
            orders
        });
        return;
    // }
});

// Admin section
router.get('/admin/orders/bystatus/:orderstatus', restrict, async (req, res, next) => {
    const db = req.app.db;

    if(typeof req.params.orderstatus === 'undefined'){
        res.redirect('/admin/orders');
        return;
    }

    // case insensitive search
    const regex = new RegExp(['^', req.params.orderstatus, '$'].join(''), 'i');
    const orders = await db.orders.find({ orderStatus: regex }).sort({ orderDate: -1 }).limit(10).toArray();

    // If API request, return json
    if(req.apiAuthenticated){
        res.status(200).json({
            orders
        });
        return;
    }

    res.render('orders', {
        title: 'Cart',
        orders: orders,
        admin: true,
        filteredOrders: true,
        filteredStatus: req.params.orderstatus,
        config: req.app.config,
        session: req.session,
        message: clearSessionValue(req.session, 'message'),
        messageType: clearSessionValue(req.session, 'messageType'),
        helpers: req.handlebars.helpers
    });
});

// render the editor
router.get('/admin/order/view/:id', restrict, async (req, res) => {
    const db = req.app.db;
    const order = await db.orders.findOne({ _id: getId(req.params.id) });
    const transaction = await db.transactions.findOne({ _id: getId(order.transaction) });

    res.render('order', {
        title: 'View order',
        result: order,
        transaction,
        config: req.app.config,
        session: req.session,
        message: clearSessionValue(req.session, 'message'),
        messageType: clearSessionValue(req.session, 'messageType'),
        editor: true,
        admin: true,
        helpers: req.handlebars.helpers
    });
});

// render the editor
router.get('/admin/order/create', restrict, async (req, res) => {
    res.render('order-create', {
        title: 'Create order',
        config: req.app.config,
        session: req.session,
        message: clearSessionValue(req.session, 'message'),
        messageType: clearSessionValue(req.session, 'messageType'),
        countryList: getCountryList(),
        editor: true,
        admin: true,
        helpers: req.handlebars.helpers
    });
});

router.post('/api/order/create', async (req, res, next) => {
    const db = req.app.db;
    const config = req.app.config;

    // // Check if cart is empty
    // if(!req.session.cart){
    //     res.status(400).json({
    //         message: 'The cart is empty. You will need to add items to the cart first.'
    //     });
    // }
    const orderDoc = {...req.body}
    console.log("orderDoc",orderDoc)
    // insert order into DB
    try{
        const newDoc = await db.orders.insertOne(orderDoc);

        // get the new ID
        const orderId = newDoc.insertedId;

        // add to lunr index
        indexOrders(req.app)
        .then(() => {
          
            // send the email with the response
            // TODO: Should fix this to properly handle result
            //sendEmail(req.session.paymentEmailAddr, `Your order with ${config.cartTitle}`, getEmailTemplate(paymentResults));

            // redirect to outcome
            res.status(200).json({
                message: 'Order created successfully',
                orderId
            });
        });
    }catch(ex){
        console.log(ex)
        res.status(400).json({ err: 'Your order declined. Please try again' });
    }
});

// Admin section
router.get('/admin/orders/filter/:search', restrict, async (req, res, next) => {
    const db = req.app.db;
    const searchTerm = req.params.search;
    const ordersIndex = req.app.ordersIndex;

    const lunrIdArray = [];
    ordersIndex.search(searchTerm).forEach((id) => {
        lunrIdArray.push(getId(id.ref));
    });

    // we search on the lunr indexes
    const orders = await db.orders.find({ _id: { $in: lunrIdArray } }).toArray();

    // If API request, return json
    if(req.apiAuthenticated){
        res.status(200).json({
            orders
        });
        return;
    }

    res.render('orders', {
        title: 'Order results',
        orders: orders,
        admin: true,
        config: req.app.config,
        session: req.session,
        searchTerm: searchTerm,
        message: clearSessionValue(req.session, 'message'),
        messageType: clearSessionValue(req.session, 'messageType'),
        helpers: req.handlebars.helpers
    });
});

// order product
router.get('/admin/order/delete/:id', async(req, res) => {
    const db = req.app.db;

    // remove the order
    try{
        await db.orders.deleteOne({ _id: getId(req.params.id) });

        // remove the index
        indexOrders(req.app)
        .then(() => {
                res.status(200).json({
                    message: 'Order successfully deleted'
                });
                return;
        });
    }catch(ex){
        console.log('Cannot delete order', ex);
            res.status(200).json({
                message: 'Error deleting order'
            });
            return;

    }
});

// update order
router.post('/admin/order/updateorder', restrict, checkAccess, async (req, res) => {
    const db = req.app.db;
    try{
        const updateobj = { orderStatus: req.body.status };
        if(req.body.trackingNumber){
            // add tracking number
            updateobj.trackingNumber = req.body.trackingNumber;
        }
        await db.orders.updateOne({
            _id: getId(req.body.order_id) },
            { $set: updateobj }, { multi: false });
        return res.status(200).json({ message: 'Order successfully updated' });
    }catch(ex){
        console.info('Error updating order', ex);
        return res.status(400).json({ message: 'Failed to update the order' });
    }
});

module.exports = router;
