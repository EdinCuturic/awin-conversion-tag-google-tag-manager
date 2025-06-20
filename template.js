// Enter your template code here.
const log = require('logToConsole');
const injectScript = require('injectScript');
const window = require('setInWindow');
const readCookie = require('getCookieValues');
const appendPixel = require('sendPixel');
const encodeUriComponent = require('encodeUriComponent');
const getType = require('getType');
const getUrl = require('getUrl');
const version = '1.0.7';
const copyFromWindow = require('copyFromWindow');
const existingAwinObject = copyFromWindow('AWIN');

function enc(data) {
  data = data || '';
  return encodeUriComponent(data);
}

var AWIN = existingAwinObject || {};
AWIN.Tracking = AWIN.Tracking || {};
AWIN.Tracking.Sale = {};
AWIN.Tracking.Sale.orderRef = enc(data.orderRef);
AWIN.Tracking.Sale.amount = enc(data.amount);
if (data.cg.indexOf(":") != -1) {
  AWIN.Tracking.Sale.parts = enc(data.cg);
} else {
  AWIN.Tracking.Sale.parts = enc(data.cg + ":" + data.amount);
}
AWIN.Tracking.Sale.currency = enc(data.currency);
AWIN.Tracking.Sale.channel = enc(data.channel);
AWIN.Tracking.Sale.voucher = enc(data.voucher);
AWIN.Tracking.Sale.customerAcquisition = enc(data.customerAcquisition);
AWIN.Tracking.Sale.test = enc(data.test);
AWIN.Tracking.Sale.custom = [];
AWIN.Tracking.Sale.custom[0] = "gtmPlugin_" + version;
if (AWIN.Tracking.gtmConsentSignals) {
  AWIN.Tracking.Sale.custom[0] += AWIN.Tracking.gtmConsentSignals;
}
if (data.custom && getType(data.custom) == "array") {
  var index = 1;
  for (var i = 0; i < data.custom.length; i++) {
    AWIN.Tracking.Sale.custom[index] = enc(data.custom[i]);
    index++;
  }
}
//set testmode to 1 if url is appspot.com
if (getUrl().search('appspot.com') != -1) {
  AWIN.Tracking.Sale.test = 1;
}

window('AWIN', AWIN, true);

//zx_products to support mastertag plugin product data
if (typeof data.plt == "object") {
  var zx_products = [];
  for (var i = 0; i < data.plt.length; i++) {
    var o = {};
    o.identifier = data.plt[i].id;
    o.quantity = data.plt[i].quantity;
    o.amount = data.plt[i].amount;
    zx_products.push(o);
  }
}
window('zx_products', zx_products, true);

var buildNs = function () {
  //build the URL: 
  var url = "https://www.awin1.com/sread.img?tt=ns&tv=2&merchant=" + enc(data.advertiserId) + "&amount=" + AWIN.Tracking.Sale.amount + "&cr=" + AWIN.Tracking.Sale.currency + "&ref=" + AWIN.Tracking.Sale.orderRef + "&parts=" + AWIN.Tracking.Sale.parts + "&vc=" + AWIN.Tracking.Sale.voucher + "&customeracquisition=" + AWIN.Tracking.Sale.customerAcquisition + "&t=" + AWIN.Tracking.Sale.test + "&ch=" + AWIN.Tracking.Sale.channel + "&cks=" + readAwcCookie(AWIN.Tracking.AdvertiserConsent);

  if (AWIN.Tracking.AdvertiserConsent !== undefined) {
    url += "&cons=" + (AWIN.Tracking.AdvertiserConsent ? "1" : "0");
  }

  var customParams = AWIN.Tracking.Sale.custom.map(function (value, index) {
    return "&p" + (index + 1) + "=" + value;
  }).join("");
  url += customParams;

  return url;
};

const nsUrl = buildNs();
appendPixel(nsUrl);

//PLT
//unpack multiple cgs into a json
if (data.cg.indexOf('|') > 0) {
  var individualParts = data.cg.split("|");
  var invertedPartsObject = individualParts.reduce(function (obj, item) {
    var parts = item.split(":");
    //invert the key-value pair so that we can access the cg code using the price as key
    var key = parts[1];
    var value = parts[0];
    obj[key] = value;
    return obj;
  }, {});
}

let productId = data.productId;
let productName = data.productName;
let productPrice = data.productPrice;
let productQuantity = data.productQuantity;
let productSku = data.productSku;
let productCg = data.productCg;
let productCategory = data.productCategory;

if (typeof data.plt == "object") {
  for (var i = 0; i < data.plt.length; i++) {
    var plt = "";
    var price = (data.plt[i][productPrice] || data.plt[i].price);
    //set the cg according to price  
    if (invertedPartsObject) {
      var cgPerProduct = invertedPartsObject[price];
    }

    plt += "AW:P|" + data.advertiserId + "|" + AWIN.Tracking.Sale.orderRef + "|" +
      (data.plt[i][productId] || data.plt[i].id || data.plt[i].item_id) + "|" +
      (data.plt[i][productName] || data.plt[i].name || data.plt[i].item_name) + "|" +
      price + "|" +
      (data.plt[i][productQuantity] || data.plt[i].quantity) + "|" +
      (data.plt[i][productSku] || data.plt[i].sku || data.plt[i].item_id) + "|" +
      (data.plt[i][productCg] || data.plt[i].cGroup || productCg || cgPerProduct || "DEFAULT") + "|" +
      (data.plt[i][productCategory] || data.plt[i].category || data.plt[i].item_category);
    appendPixel("https://www.awin1.com/basket.php?product_line=" + encodeUriComponent(plt));
  }
}

const url = 'https://www.dwin1.com/' + data.advertiserId + '.js';

function readAwcCookie(consentStatus) {
  //read cookies
  var regularCookie = readCookie('_aw_m_' + data.advertiserId).toString();
  var snCookie = readCookie('_aw_sn_' + data.advertiserId).toString();
  //if snCookie is present then add it to cookieString
  var cookieString = snCookie;
  //if consent, then try to read normal cookie
  if (evaluateConsent(consentStatus) && regularCookie.length > 0) {
    // If regularCookie is not empty, then concatenate it with a comma
    cookieString += (cookieString.length > 0 ? ',' : '') + regularCookie;
  }

  return cookieString;
}

//function to evaluate the consent state
function evaluateConsent(consent) {
  if (typeof consent === 'string') {
    if (consent.toLowerCase() === 'true' || consent === '1') {
      return true;
    } else if (consent.toLowerCase() === 'false' || consent === '0') {
      return false;
    }
  } else if (consent == true || consent == false) {
    return consent == true;
  }
  return true;
}
injectScript(url, data.gtmOnSuccess(), data.gtmOnFailure());
