// ==UserScript==
// @name         UNFIBUY ES6-Userscript
// @namespace    https://github.com/cbfx/unfibuy
// @version      0.1
// @description  Deciphers unit notation, computes pricing, and displays the unit prices
// @author       You
// @require      https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/6.18.2/babel.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/babel-polyfill/6.16.0/polyfill.js
// @match        https://customers.unfi.com/*
// ==/UserScript==]

/**
 * The "Pack Size" string from UNFI product grid.
 * @typedef {string} PackSizeString
 */

/**
 * The "Total Price" string from UNFI product grid.
 * @typedef {string} TotalPriceString
 */

/**
 * An object that defines the data structure when parsing a PackSize string.
 * @typedef {Object} ParsedPackSize
 * @property {number} quantity - The count of items in a pack.
 * @property {number} measure - The weight of each item in a pack.
 * @property {string} unit - The unit of measure for each item in a pack.
 */

/**
 * An object that defines the data structure when parsing a TotalPrice string.
 * @typedef {Object} ParsedTotalPrice
 * @property {string} currencyCode - The currency symbol for the price.
 * @property {number} amount - The cost of the line item.
 */

/**
 * Returns a best guess at quantity, measure, and units from UNFI Pack Size.
 * @param   {PackSizeString} packSize
 * @returns {ParsedPackSize}
 *          Parsed quantity, measure, and unit from Pack Size string.
 */
function parsePackSize(packSize = '') {
  const parsePackSizeRe = /([\d\.]+[\s]?)([xX\/]?[\s]?)([+?-?\d+(\.\d+)?$]*[\s]?)([\w\#]*)/g;
  const groups = parsePackSizeRe.exec(packSize);
  console.log(groups)
  if (groups[3] == "") {
      console.log("[UNFIBUY]: No case count/quantity for item, thus this is a one-per-case item.")
  }
  return {
    // if there is no "quantity", theres just 1 in the "case"
    quantity: !groups[3] ? 1 : groups[1],
    // if there is no groups[3], there's no "case count", so just 1 in the case
    // and thus the measure of that item is all we have
    measure: groups[3] ? groups[3] : groups[1],
    unit: groups[4].toLowerCase(),
  };
}

/**
 * Returns the total price parsed into a data structure.
 * @param   {TotalPriceString} totalPrice
 * @returns {ParsedTotalPrice}
 */
function parseTotalPrice(totalPrice = '') {
  console.log('totalPrice:', totalPrice);
  return {
    currencyCode: totalPrice.substring(0, 1),
    amount: parseFloat(totalPrice.substring(1), 10),
  };
}

function upNearestQuarter(value) {
  return (Math.round(value * 4) / 4).toFixed(2)
}


/**
 * Returns the total price parsed into a data structure.
 * @param   {PackSizeString} packSize
 * @param   {TotalPriceString} totalPrice
 * @returns {string}
 *          A display message to indicate the price per units of measure.
 */
function getPricePerUnit(packSize, totalPrice) {
  const {measure, quantity, unit} = parsePackSize(packSize);
  console.log('[UNFIBUY]: measure:', measure);
  console.log('[UNFIBUY]: quantity:', quantity);
  console.log('[UNFIBUY]: unit:', unit);
  const {amount, currencyCode} = parseTotalPrice(totalPrice);
  console.log('[UNFIBUY]: price:', amount);
  console.log('[UNFIBUY]: currencyCode:', currencyCode);
  // sometimes, there is only 1 package, implied by no measure, no delimiter
  let pricePerUnitCalculation;
  if (measure != "") {
    pricePerUnitCalculation = (amount / quantity / measure).toFixed(3);
  } else {
    pricePerUnitCalculation = (amount / quantity).toFixed(3);
  }

  let message = `${currencyCode}${pricePerUnitCalculation} per ${unit} (cost)`;
  switch (unit) {
    case "lb":
    case "LB":
    case "#":
      var pricePerOunce = (pricePerUnitCalculation / 16).toFixed(3)
      message += ` | ${currencyCode}${pricePerOunce} per oz (cost)`;
      break;
  }

  console.log('[UNFIBUY]: parsed price per unit:', message);

  // calculate cost per item
  // this is equal to the total price if there is no 'quantity' or quantity is 1
  console.log('[UNFIBUY]: parsed cost per "case":', amount);
  console.log('[UNFIBUY]: parsed count/quantity:', quantity);
  let costPerItem = (amount / quantity).toFixed(3)
  console.log('[UNFIBUY]: parsed cost per item:', costPerItem);
  message += ` | ${currencyCode}${costPerItem} per item (cost)`;
  let markups = {};
  for (let m = 1.4; m <= 2.0; m+=.1) {
    markups[`x${m.toFixed(1)}`] = upNearestQuarter(costPerItem * m);
  };
  console.log(`[UNFIBUY]: Markups --> ${JSON.stringify(markups)}`);

  // we are weird and give 18% on bulk pre-orders
  let caseDiscountEachItem = (markups["x1.6"] * .82);
  let caseDiscountTotal = caseDiscountEachItem * quantity;
  console.log(`[UNFIBUY]: Case Discount Each Item --> ${caseDiscountEachItem}`);
  console.log(`[UNFIBUY]: Case Discount Total --> ${caseDiscountTotal}`);
  message += ` | Case Discount Price --> ${currencyCode}${caseDiscountTotal} (${currencyCode}${caseDiscountEachItem} / each)`;

  message += ` | Price Markups: ${JSON.stringify(markups)}`;
  return message;
}

function mutateDataGrid() {
  const headers = document.querySelectorAll(
    '[data-role="grid"] table thead th',
  );
  const rows = document.querySelectorAll('[data-role="grid"] table tbody tr');
  const headersArray = Array.prototype.slice.call(headers);
  const priceCellIndex = headersArray.findIndex(header => {
    return header.dataset.field === 'PackSize';
  });
  const totalPriceCellIndex = headersArray.findIndex(header => {
    return header.innerHTML.match(/Total(.*)Price/g);
  });
  const productDescriptionCellIndex = headersArray.findIndex(header => {
    return header.dataset.field === 'ProductName';
  });

  rows.forEach(row => {
    const packSizeCell = row.cells[priceCellIndex];
    const totalPriceCell = row.cells[totalPriceCellIndex];
    const productDescriptionCell = row.cells[productDescriptionCellIndex];
    const packSize = packSizeCell.innerText || '';
    const totalPrice = totalPriceCell.innerText || '';
    const pricePerUnit = getPricePerUnit(packSize, totalPrice);


    console.log('[UNFIBUY]: parsed row data:', packSize, totalPrice);

    productDescriptionCell.innerHTML = `${
      productDescriptionCell.innerText
    }<br /><span style="font-size: 11px; color: gray">${pricePerUnit}</span>`;
  });
}

const dataGrid = document.querySelector('[data-role="grid"] table tbody');
const mutationConfig = {attributes: true, childList: true};
const dataGridObserver = new MutationObserver(function(mutationsList) {
  for (var mutation of mutationsList) {
    if (mutation.type == 'childList') {
      mutateDataGrid();
    }
  }
});

dataGridObserver.observe(dataGrid, mutationConfig);
