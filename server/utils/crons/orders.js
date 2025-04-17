const { getId } = require("../../lib/common");
const smsService = require("../sms");
const websockets = require("../websockets");


async function checkOrderStatusZeroCC(appDb) {
  try {
    
    const db = appDb;
    const resultZeroStatusCC = await db.orders
      .find(
        {
          status: "0",
          isViewd: false,
          "order.payment_method": "CREDITCARD",
          ccPaymentRefData: { $exists: false } 
          },
        ).toArray();

      console.log(
        `Matched Takeaway ${resultZeroStatusCC?.length} documents and updated ${resultZeroStatusCC?.length} documents`
      );

      for (const order of resultZeroStatusCC) {
        let isShippingPaid = false;
        if(order.order.receipt_method === 'DELIVERY'){
          isShippingPaid = true;
        }
        await db.orders.updateOne(
          { _id: order._id },
          { $set: { status: "1", "ccPaymentRefData.data":{note:"edited manually", StatusCode: "1"}, isShippingPaid } }
        );
        await db.customers.findOne({
          _id: getId(order.customerId),
        });
        let smsContent = "CC order updated manually" + "-" + order?._id;
        await smsService.sendSMS("0542454362", smsContent, null, appDb, 'creme-caramel');
      }
      if (resultZeroStatusCC.length) {
        websockets.fireWebscoketEvent("orders updated by cron");
      }
  } catch (err) {
    console.error("Error cron updating orders:", err);
  }
}

const cronOrdersService = {
  checkOrderStatusZeroCC: checkOrderStatusZeroCC
};
module.exports = cronOrdersService;
