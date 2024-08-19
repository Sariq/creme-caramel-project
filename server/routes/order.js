const express = require("express");
const auth = require("./auth");
const orderid = require("order-id")("key");
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
  getId,
} = require("../lib/common");
const { paginateData } = require("../lib/paginate");
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

    let statusCount = [];
    if (ordersDate) {
      var start = moment(ordersDate).utcOffset(120);
      start.set({ hour: 0, minute: 0, second: 0, millisecond: 0 });

      var end = moment(ordersDate).utcOffset(120);
      end.set({ hour: 23, minute: 59, second: 59, millisecond: 999 });
      // filterBy["$or"] = [
      //   { orderDate: { $gte: start.format(), $lt: end.format() } },
      //   { datetime: { $gte: start.format(), $lt: end.format() } },
      // ];
      filterBy = {
        ...filterBy,
        orderDate: { $gte: start.format(), $lt: end.format() },
      };

      statusCount =  await db.orders.aggregate([
        {
          $match: {
            orderDate: {
              $gte: start.format(), $lt: end.format() 
            },
            isViewd: true
          }
        },
          {
            $group: {
              _id: "$status",
              count: { $sum: 1 }
            }
          }
        ]).toArray();
    }
    if (req.body.isNotPrinted) {
      filterBy.isPrinted = false;
    }
    let oderDirecton = 1;
    if(req.body.oderDirecton != undefined){
      oderDirecton = req.body.oderDirecton;
    }
    // Get our paginated data
    const orders = await paginateData(true, req, pageNum, "orders", filterBy, {
      orderDate: oderDirecton,
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
    // If API request, return json
    // if(req.apiAuthenticated){
    res.status(200).json({ordersList: finalOrders, totalItems: orders?.totalItems, statusCount});
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

  const orders = await db.orders
    .find({
      isViewd: false,
      status: "1",
    })
    .toArray();
    const finalOrders =[];
    for (const order of orders) {
      const customer = await db.customers.findOne({
        _id: getId(order.customerId),
      });
      if (customer) {

        finalOrders.push({
          ...order,
          customerDetails: {
            name: customer.fullName,
            phone: customer.phone,
          },
        });
      }
    }

  res.status(200).json(finalOrders);
});

router.get("/api/order/admin/all/not-viewd", async (req, res, next) => {
  const db = req.app.db;

  const orders = await db.orders
    .find({
      isViewdAdminAll: false,
      status: "1",
    })
    .toArray();
    const finalOrders =[];
    for (const order of orders) {
      const customer = await db.customers.findOne({
        _id: getId(order.customerId),
      });
      if (customer) {

        finalOrders.push({
          ...order,
          customerDetails: {
            name: customer.fullName,
            phone: customer.phone,
          },
        });
      }
    }

  res.status(200).json(finalOrders);
});

router.get("/api/order/customer-invoices",  auth.required,
async (req, res, next) => {
  const db = req.app.db;
  const customerId = req.auth.id;

  const orders = await db.orders
    .find({
      customerId: customerId,
      "order.payment_method": "CREDITCARD"
    })
    .toArray();
  res.status(200).json(orders);
});

router.get("/api/order/customer-orders",  auth.required,
async (req, res, next) => {
  const db = req.app.db;
  const customerId = req.auth.id;
  const orders = await db.orders
    .find({
      customerId: customerId,
    })
    .toArray();
  res.status(200).json(orders);
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

router.post("/api/order/addRefund", async (req, res, next) => {
  const db = req.app.db;
  const parsedBodey = req.body;

  try {
    await db.orders.updateOne(
      {
        _id: getId(parsedBodey.orderId),
      },
      {
        $push: {
          refundData: parsedBodey.refundObj,
        },
      },
      { multi: false }
    );
    res.status(200).json({msg:"refund added"});

  } catch (err) {
    res.status(400).json({ errorMessage: 'refund  failed' });
  }
})

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
      ZCreditChargeResponse: parsedBodey.ZCreditChargeResponse
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
          if (response.data.HasError) {
            // await db.orders.deleteOne({ _id: parsedBodey.orderId });
            res.status(200).json(response.data);
            return;
          }

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
          await smsService.sendSMS(customer.phone, smsContent, req);
          await smsService.sendSMS("0536660444", smsContent, req);
          await smsService.sendSMS("0542454362", smsContent, req);

          setTimeout(async () => {
            await invoiceMailService.saveInvoice(docId, req);

            await turl
              .shorten(
                `https://creme-caramel-images.fra1.cdn.digitaloceanspaces.com/invoices/doc-${docId}.pdf`
              )
              .then(async (res) => {
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

                // const invoiceSmsContent =
                //   smsService.getOrderInvoiceContent(res);
                // //smsService.sendSMS(customer.phone, smsContent, req);
                // //smsService.sendSMS("0536660444", smsContent, req);
                // smsService.sendSMS("0542454362", invoiceSmsContent, req);
              })
              .catch((err) => {
                //res.status(400).json({ errorMessage: err?.message });
              });

            // res.status(200).json(response.data);
          });
        }, 120000);
      res.status(200).json({ errorMessage: "valid invoice doc" });
    } else {
      await db.orders.updateOne(
        {
          _id: getId(parsedBodey.orderId),
        },
        {
          $set: {
            ccPaymentRefData: {
              payload: parsedBodey,
              data: 'no doc ID',
            },
            status: "0",
          },
        },
        { multi: false }
      );
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
      isViewdAdminAll: false,
      ipAddress: req.ip
    };
    try {
      const newDoc = await db.orders.insertOne(orderDoc);
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

      await db.customers.findOneAndUpdate(
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
        const currentCount = product.extras.size.options[item.size].count - item.qty;
        product.extras.size.options[item.size].count = currentCount <= 0 ? 0 : currentCount;
        updatedProduct = { ...product };
        await db.products.updateOne(
          { _id: getId(item.item_id) },
          { $set: updatedProduct },
          {}
        );
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
        await smsService.sendSMS(customer.phone, smsContent, req);
        await smsService.sendSMS("0536660444", smsContent, req);
        await smsService.sendSMS("0542454362", smsContent, req);
        websockets.fireWebscoketEvent("new order", finalOrderDoc);
      }


        res.status(200).json({
          message: "Order created successfully",
          orderId,
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
      websockets.fireWebscoketEvent("order updated", finalOrderDoc);

      indexOrders(req.app).then(() => {
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

router.post("/api/order/update", auth.required, async (req, res) => {
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
    if (updateobj?.status == "2" && updateobj?.shouldSendSms) {
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
      await smsService.sendSMS(customer.phone, smsContent, req);
      await smsService.sendSMS("0536660444", smsContent, req);
      await smsService.sendSMS("0542454362", smsContent, req);
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
    return res.status(200).json({ message: "order viewed successfully updated" });
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
      order.orderDate,
      customer.phone,
    );
    const storeData = await db.store.findOne({ id: 1 });

    await smsService.sendSMS(storeData.order_company_number, smsContent, req);
    websockets.fireWebscoketEvent("order delivery booked");
    return res.status(200).json({ message: "order delivery booked successfully" });

  } catch (ex) {
    console.info("Error order delivery booked", ex);
    return res.status(400).json({ message: "order delivery booked" });
  }
});

router.post("/api/order/printed", auth.required, async (req, res) => {
  const db = req.app.db;
  try {
    await db.orders.updateOne(
      {
        _id: getId(
          req.body?.orderId?.$oid ? req.body.orderId.$oid : req.body.orderId
        ),
      },
      { $set: { isPrinted: req.body.status } },
      { multi: false }
    );
    if(req.body.status === false){
      websockets.fireWebscoketEvent("print not printed");
    }
    return res.status(200).json({ message: "Order successfully printed" });
  } catch (ex) {
    console.info("Error updating order", ex);
    return res.status(400).json({ message: "Failed to print the order" });
  }
});
function relDiff(a, b) {
  let diff =  100 * Math.abs( ( a - b ) / ( (a+b)/2 ) );
  if(a<b){
    diff = diff * -1;
  }
  return diff.toFixed(2);
 }
router.post("/api/order/statistics/new-orders/:page?", async (req, res) => {
  const db = req.app.db;
  let pageNum = 1;
  if (req.body.pageNumber) {
    pageNum = req.body.pageNumber;
  }
  var start = moment().subtract(7, 'days').utcOffset(120);
  start.set({ hour: 0, minute: 0, second: 0, millisecond: 0 });

  var end = moment().utcOffset(120);
  end.set({ hour: 23, minute: 59, second: 59, millisecond: 999 });
  const filterBy = {
    created: { $gte: new Date(start), $lt: new Date(end) },
  };
  let newOrders = await paginateData(true, req, pageNum, "orders", filterBy, {
    created: 1,
  });

  var start2 = moment().subtract(14, 'days').utcOffset(120);
  start2.set({ hour: 0, minute: 0, second: 0, millisecond: 0 });

  var end2 = moment().subtract(8, 'days').utcOffset(120);
  end2.set({ hour: 23, minute: 59, second: 59, millisecond: 999 });
  const filterBy2 = {
    created: { $gte: new Date(start2), $lt: new Date(end2) },
  };
  const prevWeekNewOrders = await paginateData(true, req, pageNum, "orders", filterBy2, {
    created: 1,
  });
 const percentDeff = relDiff(newOrders.totalItems, prevWeekNewOrders.totalItems);
 newOrders.percentDeff = percentDeff;
  try {
    res.status(200).json(newOrders);
  } catch (ex) {
    console.error(colors.red("Failed to search customer: ", ex));
    res.status(400).json({
      message: "Customer search failed.",
    });
  }
});

module.exports = router;
