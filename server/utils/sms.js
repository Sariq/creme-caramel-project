const axios = require('axios');
const moment = require("moment");
const apiPath = 'https://webapi.mymarketing.co.il/api/smscampaign/OperationalMessage';

sendSMS = async function ( phoneNumber, smsContent, req) {
  const activeTrailSecret = await req.app.db.amazonconfigs.findOne({app: "activetrail"});
  const activeTrailSecretKey = activeTrailSecret.SECRET_KEY;
  console.log("activeTrailSecretKey", activeTrailSecretKey);
    const smsData = {
        "details": {
          "name": "AAAA",
          "from_name": "CremeCarame",
          "sms_sending_profile_id": 0,
          "content": smsContent
        },
        "scheduling": {
          "send_now": true,
        },
        "mobiles": [
          {
            "phone_number": phoneNumber
          }
        ]
      };
    // return axios.post(apiPath, smsData, { 
    //     headers: {
    //         "Authorization": activeTrailSecretKey,
    //       }
    //  })
    // .then((response) => {
    //     if(response.status === 200){
    //         console.info('Successfully sent sms');
    //     }
    // })
    // .catch((err) => {
    //     console.log('Error sending sms:', err);
    // });
    
};



getOrderRecivedContent = function (customerName, totalAmount, shippingMethod, orderId, lang) {
    const orderIdSplit = orderId.split("-");
    const idPart2 = orderIdSplit[2];
    return `היי ${customerName} \u{1F60A} \n ` 
    + `ההזמנה התקבלה בהצלחה \n `
    + ` - שיטת איסוף ${shippingMethod == "TAKEAWAY" ? "איסוף עצמי" : "משלוח"} \n `
    + `מספר הזמנה ${idPart2} \n`
    + `סה״כ ${totalAmount} `
}

getOrderTakeawayReadyContent = function (customerName, orderId, lang) {
  const orderIdSplit = orderId.split("-");
  const idPart2 = orderIdSplit[2];
  return `היי ${customerName} \u{1F60A} \n ` 
  + `ההזמנה מוכנה לאיסוף \n`
  + `מספר הזמנה ${idPart2} \n`
}

getOrderDeliveryReadyContent = function (customerName, orderId, lang) {
  const orderIdSplit = orderId.split("-");
  const idPart2 = orderIdSplit[2];
  return `היי ${customerName} \u{1F60A} \n ` 
  + `ההזמנה מוכנה, השליח בדרך אליך \n`
  + `מספר הזמנה ${idPart2} \n`
}

getOrderDeliveryCompanyContent = function (customerName, orderId, lang,orderDate) {
  const orderIdSplit = orderId.split("-");
  const idPart2 = orderIdSplit[2];
  return `היי \n ` 
  + `ההזמנה מוכנה לאיסוף \n`
  + `שעת מסיר: ${moment(orderDate).format('HH:mm')}\n`
  + `מספר הזמנה ${idPart2} \n`
  + `שם הלקוח ${customerName} \n`
}


getVerifyCodeContent = function (verifyCode) {
    return `קוד האימות שלך הוא: ${verifyCode}`;
}

getOrderInvoiceContent = function (invoiceUrl) {
  return `מצורף לינק לחשבונית לצפייה: ${invoiceUrl}`;
}

const smsService = {
    sendSMS: sendSMS,
    getOrderRecivedContent: getOrderRecivedContent,
    getOrderInvoiceContent: getOrderInvoiceContent,
    getVerifyCodeContent: getVerifyCodeContent,
    getOrderTakeawayReadyContent: getOrderTakeawayReadyContent,
    getOrderDeliveryReadyContent: getOrderDeliveryReadyContent,
    getOrderDeliveryCompanyContent: getOrderDeliveryCompanyContent,
};
module.exports = smsService;
