const axios = require('axios');
const moment = require("moment");
const cron = require("node-cron");

const apiPath = 'https://api.sms4free.co.il/ApiSMS/SendSMS';
const apiBalance = 'https://api.sms4free.co.il/ApiSMS/AvailableSMS';

const key = "gDXTIsRwF";
const user = "0542454362";
const pass = "48840537";
const sender = "CremeCarame";

sendSMS = async function ( phoneNumber, smsContent, req, db = null) {
  let sms4freeSecret = null;
  if(req){
     sms4freeSecret = await req.app.db.amazonconfigs.findOne({app: "sms4free"});
  }else{
    sms4freeSecret = await db.amazonconfigs.findOne({app: "sms4free"});
  }
  const key = sms4freeSecret.SECRET_KEY;
  const user = sms4freeSecret.USER;
  const pass = sms4freeSecret.PASSWORD;
  const sender = "0536660444";// sms4freeSecret.SENDER_NAME;

  const requestObject = {
    key ,
    user,
    pass,
    sender,
    recipient: phoneNumber,
    msg: smsContent
    }
    return axios.post(apiPath, requestObject, { 
        headers: {
          "Content-Type": 'application/json',
        }
     })
    .then((response) => {
        if(response.status === 200){
            console.info('Successfully sent sms');
        }
    })
    .catch((err) => {
        console.log('Error sending sms:', err);
    });
    
};

checkSMSBalance = async function (db) {

  const sms4freeSecret = await db.amazonconfigs.findOne({app: "sms4free"});
  const key = sms4freeSecret.SECRET_KEY;
  const user = sms4freeSecret.USER;
  const pass = sms4freeSecret.PASSWORD;

const requestObject = {
key,
user,
pass,
}

  // const activeTrailSecret = await db.amazonconfigs.findOne({app: "activetrail"});
  // const activeTrailSecretKey = activeTrailSecret.SECRET_KEY;
  // console.log("activeTrailSecretKey", activeTrailSecretKey);
    return axios.post(apiBalance, requestObject, { 
        headers: {
            "Content-Type": 'application/json',
          }
     })
    .then((response) => {
        if(response.status === 200){
            console.info('check sms balance', response);
            if(response.data< 300){
              const smsContent = getSMSBalanceContent(
                response.data
              );
              //smsService.sendSMS(customer.phone, smsContent, req);
              sendSMS("0542454362", smsContent, null, db);
            }
        }
    })
    .catch((err) => {
        console.log('Error sending sms:', err);
    });
}




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

getSMSBalanceContent = function (credits) {
    return `עדכן את חבילת ה סמס, נשארו: ${credits}`;
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
    checkSMSBalance: checkSMSBalance,
};
module.exports = smsService;
