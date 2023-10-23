const express = require("express");
const auth = require("./auth");
const orderid = require("order-id")("key");
const textToImage = require("text-to-image");
const websockets = require("../utils/websockets");
const smsService = require("../utils/sms");
const invoiceMailService = require("../utils/invoice-mail");
const imagesService = require("../utils/images-service");
var multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
const turl = require("turl");
var QRCode = require("qrcode");

const axios = require("axios");

const {
  clearSessionValue,
  getCountryList,
  getId,
  sendEmail,
  getEmailTemplate,
  clearCustomer,
  sanitize,
} = require("../lib/common");
const { paginateData } = require("../lib/paginate");
const { emptyCart } = require("../lib/cart");
const { restrict, checkAccess } = require("../lib/auth");
const { indexOrders } = require("../lib/indexing");
const moment = require("moment");
const router = express.Router();

const generateQR = async (latitude, longitude) => {
  try {
    const qrCodeURI = await QRCode.toDataURL(
      `https://www.waze.com/ul?ll=${latitude},${longitude}&navigate=yes&zoom=17`
    );
    return qrCodeURI;
  } catch (err) {
    console.error(err);
  }
};

// Show orders
router.post(
  "/api/order/admin/orders/:page?",
  auth.required,
  async (req, res, next) => {
    const db = req.app.db;
    let finalOrders = [];

    let pageNum = 1;
    if (req.body.pageNumber) {
      pageNum = req.body.pageNumber;
    }

    let statusList = ["1", "2", "3", "4", "5"];
    if (req.body.statusList) {
      statusList = req.body.statusList;
    }
    let ordersDate = null;
    if (req.body.ordersDate) {
      ordersDate = req.body.ordersDate;
    }
    let filterBy = {
      status: { $in: statusList },
    };
    if (ordersDate) {
      var start = moment(ordersDate);
      start.set({ hour: 0, minute: 0, second: 0, millisecond: 0 });

      var end = moment(ordersDate);
      end.set({ hour: 23, minute: 59, second: 59, millisecond: 999 });
      // filterBy["$or"] = [
      //   { orderDate: { $gte: start.format(), $lt: end.format() } },
      //   { datetime: { $gte: start.format(), $lt: end.format() } },
      // ];
      filterBy = {
        ...filterBy,
        orderDate: { $gte: start.format(), $lt: end.format() },
      };
    }
    if (req.body.isNotPrinted) {
      filterBy.isPrinted = false;
    }
    // Get our paginated data
    const orders = await paginateData(true, req, pageNum, "orders", filterBy, {
      orderDate: 1,
    });
    // orders?.data?.forEach(async (order)=>{
    for (const order of orders?.data) {
      const customer = await db.customers.findOne({
        _id: getId(order.customerId),
      });
      if (customer) {
        // const dataUri = await textToImage.generate(customer.fullName, {
        //   maxWidth: 200,
        //   textAlign: "center",
        // });
        finalOrders.push({
          ...order,
          customerDetails: {
            name: customer.fullName,
            phone: customer.phone,
            // recipetName: dataUri,
          },
        });
      }
    }
    console.log("finalOrders", finalOrders);
    // If API request, return json
    // if(req.apiAuthenticated){
    res.status(200).json(finalOrders);
    // }
  }
);

router.get("/api/order/admin/not-printed", async (req, res, next) => {
  const db = req.app.db;
  let finalOrders = [];

  finalOrders = await db.orders
    .find({
      isPrinted: false,
    })
    .toArray();

  res.status(200).json(finalOrders);
});

router.get("/api/order/admin/not-viewd", async (req, res, next) => {
  const db = req.app.db;
  let finalOrders = [];

  finalOrders = await db.orders
    .find({
      isViewd: false,
      status: "1",
    })
    .toArray();

  res.status(200).json(finalOrders);
});

router.post("/api/order/byDate", async (req, res, next) => {
  const db = req.app.db;
  let finalOrders = [];

  finalOrders = await db.orders
    .find({
      created: {
        $gte: new Date(req.body.startDate),
        $lt: new Date(req.body.endDate),
      },
    })
    .toArray();

  res.status(200).json(finalOrders);
});

// Admin section
router.get(
  "/admin/orders/bystatus/:orderstatus",
  restrict,
  async (req, res, next) => {
    const db = req.app.db;

    if (typeof req.params.orderstatus === "undefined") {
      res.redirect("/admin/orders");
      return;
    }

    // case insensitive search
    const regex = new RegExp(["^", req.params.orderstatus, "$"].join(""), "i");
    const orders = await db.orders
      .find({ orderStatus: regex })
      .sort({ orderDate: -1 })
      .limit(10)
      .toArray();

    // If API request, return json
    if (req.apiAuthenticated) {
      res.status(200).json({
        orders,
      });
      return;
    }

    res.render("orders", {
      title: "Cart",
      orders: orders,
      admin: true,
      filteredOrders: true,
      filteredStatus: req.params.orderstatus,
      config: req.app.config,
      session: req.session,
      message: clearSessionValue(req.session, "message"),
      messageType: clearSessionValue(req.session, "messageType"),
      helpers: req.handlebars.helpers,
    });
  }
);

// render the editor
router.get("/admin/order/view/:id", restrict, async (req, res) => {
  const db = req.app.db;
  const order = await db.orders.findOne({ _id: getId(req.params.id) });
  const transaction = await db.transactions.findOne({
    _id: getId(order.transaction),
  });

  res.render("order", {
    title: "View order",
    result: order,
    transaction,
    config: req.app.config,
    session: req.session,
    message: clearSessionValue(req.session, "message"),
    messageType: clearSessionValue(req.session, "messageType"),
    editor: true,
    admin: true,
    helpers: req.handlebars.helpers,
  });
});

// render the editor
router.get("/admin/order/create", restrict, async (req, res) => {
  res.render("order-create", {
    title: "Create order",
    config: req.app.config,
    session: req.session,
    message: clearSessionValue(req.session, "message"),
    messageType: clearSessionValue(req.session, "messageType"),
    countryList: getCountryList(),
    editor: true,
    admin: true,
    helpers: req.handlebars.helpers,
  });
});

router.post("/api/order/updateCCPayment", async (req, res, next) => {
  const db = req.app.db;
  const parsedBodey = req.body;

  try {
    const storeData = await db.store.findOne({ id: 1 });
    const orderDoc = await db.orders.findOne({
      _id: getId(parsedBodey.orderId),
    });
    const customerId = orderDoc.customerId;
    const customer = await db.customers.findOne({
      _id: getId(customerId),
    });
    if (!customer) {
      res.status(400).json({
        message: "Customer not found",
      });
      return;
    }

    const zdCreditCredentials = storeData.credentials;

    const data = {
      TerminalNumber: zdCreditCredentials.credentials_terminal_number,
      Password: zdCreditCredentials.credentials_password,
      ReferenceID: parsedBodey.creditcard_ReferenceNumber,
    };
    const docId = parsedBodey?.ZCreditInvoiceReceiptResponse?.DocumentID;
    if (docId) {
      axios
        .post(
          "https://pci.zcredit.co.il/ZCreditWS/api/Transaction/GetTransactionStatusByReferenceId",
          data,
          { responseType: "application/json" }
        )
        .then(async (response) => {
          if (response.data.HasError) {
            await db.orders.deleteOne({ _id: parsedBodey.orderId });
            res.status(200).json(response.data);
            return;
          }
          await db.orders.updateOne(
            {
              _id: getId(parsedBodey.orderId),
            },
            {
              $set: {
                ccPaymentRefData: {
                  payload: parsedBodey,
                  data: response.data,
                },
                status: "1",
              },
            },
            { multi: false }
          );
          const finalOrderDoc = {
            ...orderDoc,
            customerDetails: {
              name: customer.fullName,
              phone: customer.phone,
            },
          };
          websockets.fireWebscoketEvent("new order", finalOrderDoc);

          const smsContent = smsService.getOrderRecivedContent(
            customer.fullName,
            orderDoc.total,
            orderDoc.order.receipt_method,
            orderDoc.orderId,
            orderDoc.app_language
          );
          // //smsService.sendSMS(customer.phone, smsContent, req);
          smsService.sendSMS("0536660444", smsContent, req);
          smsService.sendSMS("0542454362", smsContent, req);

          setTimeout(async () => {
            await invoiceMailService.saveInvoice(docId, req);

            await turl
              .shorten(
                `https://creme-caramel-images.fra1.cdn.digitaloceanspaces.com/invoices/doc-${docId}.pdf`
              )
              .then(async (res) => {
                console.log(res);
                await db.orders.updateOne(
                  {
                    _id: getId(parsedBodey.orderId),
                  },
                  {
                    $set: {
                      ccPaymentRefData: {
                        payload: parsedBodey,
                        data: response.data,
                        url: res,
                      },
                    },
                  },
                  { multi: false }
                );

                const invoiceSmsContent =
                  smsService.getOrderInvoiceContent(res);
                //smsService.sendSMS(customer.phone, smsContent, req);
                //smsService.sendSMS("0536660444", smsContent, req);
                smsService.sendSMS("0542454362", invoiceSmsContent, req);
              })
              .catch((err) => {
                //res.status(400).json({ errorMessage: err?.message });
              });

            // res.status(200).json(response.data);
          });
        }, 60000);
      res.status(200).json({ errorMessage: "no invoice doc" });
    } else {
      res.status(200).json({ errorMessage: "no invoice doc" });
    }
  } catch (err) {
    res.status(400).json({ errorMessage: err?.message });
  }
});

router.post(
  "/api/order/create",
  upload.array("img"),
  auth.required,
  async (req, res, next) => {
    const db = req.app.db;
    const config = req.app.config;
    const parsedBodey = JSON.parse(req.body.body);
    const customerId = parsedBodey.customerId || req.auth.id;
    const isCreditCardPay = parsedBodey.order.payment_method == "CREDITCARD";
    // // Check if cart is empty
    // if(!req.session.cart){
    //     res.status(400).json({
    //         message: 'The cart is empty. You will need to add items to the cart first.'
    //     });
    // }
    const generatedOrderId = orderid.generate();
    let imagesList = [];
    if (req.files && req.files.length > 0) {
      imagesList = await imagesService.uploadImage(req.files, req, "orders");
    }
    let imageIndex = 0;
    let updatedItemsWithImages = [];
    if (imagesList?.length > 0) {
      updatedItemsWithImages = parsedBodey.order.items.map((item) => {
        if (item.clienImage) {
          imageIndex++;
          return {
            ...item,
            clienImage: imagesList[imageIndex - 1],
          };
        }
        return {
          ...item,
          clienImage: null,
        };
      });
    }
    let locationQrCode = null;
    if (parsedBodey.order.receipt_method == "DELIVERY") {
      locationQrCode = await generateQR(
        parsedBodey?.order?.geo_positioning?.latitude,
        parsedBodey?.order?.geo_positioning?.longitude
      );
    }
    const orderDoc = {
      ...parsedBodey,
      order: {
        ...parsedBodey.order,
        items:
          updatedItemsWithImages?.length > 0
            ? updatedItemsWithImages
            : parsedBodey.order.items,
        geo_positioning: {
          ...parsedBodey.order.geo_positioning,
          qrURI: locationQrCode,
        },
      },
      created: new Date(),
      customerId,
      orderId: generatedOrderId,
      status: isCreditCardPay ? "0" : "1",
      isPrinted: false,
      isViewd: false,
    };

    // insert order into DB
    try {
      const newDoc = await db.orders.insertOne(orderDoc);

      // get the new ID
      const orderId = newDoc.insertedId;
      const customer = await db.customers.findOne({
        _id: getId(customerId),
      });
      if (!customer) {
        res.status(400).json({
          message: "Customer not found",
        });
        return;
      }

      const updatedCustomer = await db.customers.findOneAndUpdate(
        { _id: getId(customerId) },
        {
          $set: {
            ...customer,
            orders: customer.orders ? [...customer.orders, orderId] : [orderId],
          },
        },
        { multi: false, returnOriginal: false }
      );
      orderDoc.order.items.forEach(async (item) => {
        const product = await db.products.findOne({
          _id: getId(item.item_id),
        });

        let updatedProduct = {};
        product.extras.size.options[item.size].count =
          product.extras.size.options[item.size].count - item.qty;
        updatedProduct = { ...product };
        await db.products.updateOne(
          { _id: getId(item.item_id) },
          { $set: updatedProduct },
          {}
        );
        // Update the index
        //     indexProducts(req.app).then(() => {
        //       res
        //         .status(200)
        //         .json({ message: "Successfully saved", product: productDoc });
        //     });
        //   } catch (ex) {
        //     res.status(400).json({ message: "Failed to save. Please try again" });
        //   }
      });

      console.log("fire websocket order");
      const dataUri = await textToImage.generate(customer.fullName, {
        maxWidth: 200,
        textAlign: "center",
      });
      const finalOrderDoc = {
        ...orderDoc,
        customerDetails: {
          name: customer.fullName,
          phone: customer.phone,
        },
      };
      if (!isCreditCardPay) {
        const smsContent = smsService.getOrderRecivedContent(
          customer.fullName,
          orderDoc.total,
          orderDoc.order.receipt_method,
          generatedOrderId,
          orderDoc.app_language
        );
        //smsService.sendSMS(customer.phone, smsContent, req);
        smsService.sendSMS("0536660444", smsContent, req);
        smsService.sendSMS("0542454362", smsContent, req);
        websockets.fireWebscoketEvent("new order", finalOrderDoc);
      }

      // https://www.waze.com/ul?ll=32.23930691837541,34.95049682449079&navigate=yes&zoom=17
      // add to lunr index
      indexOrders(req.app).then(() => {
        // send the email with the response
        // TODO: Should fix this to properly handle result
        //sendEmail(req.session.paymentEmailAddr, `Your order with ${config.cartTitle}`, getEmailTemplate(paymentResults));
        // redirect to outcome
        res.status(200).json({
          message: "Order created successfully",
          orderId,
        });
      });
    } catch (ex) {
      console.log(ex);
      res.status(400).json({ err: "Your order declined. Please try again" });
    }
  }
);

router.post(
  "/api/order/update/all",
  upload.array("img"),
  auth.required,
  async (req, res, next) => {
    const db = req.app.db;
    const config = req.app.config;
    const parsedBodey = JSON.parse(req.body.body);
    const customerId = parsedBodey.customerId || req.auth.id;
    const db_orderId = parsedBodey.db_orderId;
    const orderId = parsedBodey.orderId;

    // // Check if cart is empty
    // if(!req.session.cart){
    //     res.status(400).json({
    //         message: 'The cart is empty. You will need to add items to the cart first.'
    //     });
    // }
    let imagesList = [];
    if (req.files && req.files.length > 0) {
      imagesList = await imagesService.uploadImage(req.files, req, "orders");
    }
    let imageIndex = 0;
    let updatedItemsWithImages = [];
    if (imagesList?.length > 0) {
      updatedItemsWithImages = parsedBodey.order.items.map((item) => {
        if (item.clienImage) {
          imageIndex++;
          return {
            ...item,
            clienImage: imagesList[imageIndex - 1],
          };
        }
        return {
          ...item,
          clienImage: null,
        };
      });
    }

    const orderDoc = {
      ...parsedBodey,
      order: {
        ...parsedBodey.order,
        items:
          updatedItemsWithImages?.length > 0
            ? updatedItemsWithImages
            : parsedBodey.order.items,
      },
      created: new Date(),
      customerId,
      orderId: orderId,
      status: "1",
      isPrinted: false,
    };

    // insert order into DB
    try {
      await db.orders.updateOne(
        {
          _id: getId(db_orderId),
        },
        { $set: orderDoc },
        { multi: false }
      );

      const customer = await db.customers.findOne({
        _id: getId(customerId),
      });
      if (!customer) {
        res.status(400).json({
          message: "Customer not found",
        });
        return;
      }

      // const smsContent = smsService.getOrderRecivedContent(
      //   customer.fullName,
      //   orderDoc.total,
      //   orderDoc.order.receipt_method,
      //   generatedOrderId,
      //   orderDoc.app_language
      // );
      //smsService.sendSMS(customer.phone, smsContent, req);
      // smsService.sendSMS("0536660444", smsContent, req);
      // smsService.sendSMS("0542454362", smsContent, req);

      const finalOrderDoc = {
        ...orderDoc,
        customerDetails: {
          name: customer.fullName,
          phone: customer.phone,
        },
      };
      websockets.fireWebscoketEvent("new order", finalOrderDoc);

      // https://www.waze.com/ul?ll=32.23930691837541,34.95049682449079&navigate=yes&zoom=17
      // add to lunr index
      indexOrders(req.app).then(() => {
        // send the email with the response
        // TODO: Should fix this to properly handle result
        //sendEmail(req.session.paymentEmailAddr, `Your order with ${config.cartTitle}`, getEmailTemplate(paymentResults));
        // redirect to outcome
        res.status(200).json({
          message: "Order created successfully",
        });
      });
    } catch (ex) {
      console.log(ex);
      res.status(400).json({ err: "Your order declined. Please try again" });
    }
  }
);

// Admin section
router.get("/admin/orders/filter/:search", restrict, async (req, res, next) => {
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
  if (req.apiAuthenticated) {
    res.status(200).json({
      orders,
    });
    return;
  }

  res.render("orders", {
    title: "Order results",
    orders: orders,
    admin: true,
    config: req.app.config,
    session: req.session,
    searchTerm: searchTerm,
    message: clearSessionValue(req.session, "message"),
    messageType: clearSessionValue(req.session, "messageType"),
    helpers: req.handlebars.helpers,
  });
});

// order product
router.get("/admin/order/delete/:id", async (req, res) => {
  const db = req.app.db;

  // remove the order
  try {
    await db.orders.deleteOne({ _id: getId(req.params.id) });

    // remove the index
    indexOrders(req.app).then(() => {
      res.status(200).json({
        message: "Order successfully deleted",
      });
      return;
    });
  } catch (ex) {
    console.log("Cannot delete order", ex);
    res.status(200).json({
      message: "Error deleting order",
    });
    return;
  }
});

// update order
router.post("/api/order/update", auth.required, async (req, res) => {
  const db = req.app.db;
  try {
    const updateobj = req.body.updateData;
    console.log("XXX", updateobj);

    await db.orders.updateOne(
      {
        _id: getId(req.body.orderId),
      },
      { $set: updateobj },
      { multi: false }
    );
    const order = await db.orders.findOne({ _id: getId(req.body.orderId) });
    const customerId = order.customerId;
    websockets.fireWebscoketEvent("order status updated", updateobj);
    const customer = await db.customers.findOne({
      _id: getId(order.customerId),
    });
    if (!customer) {
      res.status(400).json({
        message: "Customer not found",
      });
      return;
    }
    if (updateobj?.status == "2") {
      let smsContent = "";
      switch (order.order.receipt_method) {
        case "TAKEAWAY":
          smsContent = smsService.getOrderTakeawayReadyContent(
            customer.fullName,
            order.orderId,
            order.app_language
          );
          break;
        case "DELIVERY":
          smsContent = smsService.getOrderDeliveryReadyContent(
            customer.fullName,
            order.orderId,
            order.app_language
          );
      }
      // //smsService.sendSMS(customer.phone, smsContent, req);
      smsService.sendSMS("0536660444", smsContent, req);
      smsService.sendSMS("0542454362", smsContent, req);
    }

    // if (updateobj?.status == "3") {
    //   const smsContent = smsService.getOrderDeliveryCompanyContent(
    //     customer.fullName,
    //     order.orderId,
    //     order.app_language,
    //     order.orderDate
    //   );
    //   smsService.sendSMS("0536660444", smsContent, req);
    //   smsService.sendSMS("0542454362", smsContent, req);
    // }

    return res.status(200).json({ message: "Order successfully updated" });
  } catch (ex) {
    console.info("Error updating order", ex);
    return res.status(400).json({ message: "Failed to update the order" });
  }
});

router.post("/api/order/update/viewd", auth.required, async (req, res) => {
  const db = req.app.db;
  try {
    const updateobj = req.body.updateData;

    await db.orders.updateOne(
      {
        _id: getId(req.body.orderId),
      },
      { $set: updateobj },
      { multi: false }
    );
    websockets.fireWebscoketEvent("order viewed updated");
  } catch (ex) {
    console.info("Error updating order", ex);
    return res.status(400).json({ message: "Failed to update the order" });
  }
});

router.post("/api/order/book-delivery", auth.required, async (req, res) => {
  const db = req.app.db;
  try {
    const updateobj = req.body.updateData;

    await db.orders.updateOne(
      {
        _id: getId(req.body.orderId),
      },
      { $set: updateobj },
      { multi: false }
    );
    const order = await db.orders.findOne({ _id: getId(req.body.orderId) });
    const customerId = order.customerId;
    websockets.fireWebscoketEvent("order status updated", updateobj);
    const customer = await db.customers.findOne({
      _id: getId(order.customerId),
    });
    if (!customer) {
      res.status(400).json({
        message: "Customer not found",
      });
      return;
    }
    const smsContent = smsService.getOrderDeliveryCompanyContent(
      customer.fullName,
      order.orderId,
      order.app_language,
      order.orderDate
    );
    smsService.sendSMS("0536660444", smsContent, req);
    smsService.sendSMS("0542454362", smsContent, req);
    websockets.fireWebscoketEvent("order delivery booked");
  } catch (ex) {
    console.info("Error order delivery booked", ex);
    return res.status(400).json({ message: "order delivery booked" });
  }
});

router.post("/api/order/printed", auth.required, async (req, res) => {
  const db = req.app.db;
  try {
    console.log("PRINTED", req.body.orderId);
    await db.orders.updateOne(
      {
        _id: getId(
          req.body?.orderId?.$oid ? req.body.orderId.$oid : req.body.orderId
        ),
      },
      { $set: { isPrinted: true } },
      { multi: false }
    );
    return res.status(200).json({ message: "Order successfully printed" });
  } catch (ex) {
    console.info("Error updating order", ex);
    return res.status(400).json({ message: "Failed to print the order" });
  }
});

module.exports = router;
