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
  const parsePackSizeRe = /([\d]+[\s]?)([xX\/]?[\s]?)([+?-?\d+(\.\d+)?$]*[\s]?)([\w\#]*)/g;
  const groups = parsePackSizeRe.exec(packSize);

  return {
    quantity: groups[1],
    measure: groups[3],
    unit: groups[4].toLowerCase(),
  };
}

/**
 * Returns the total price parsed into a data structure.
 * @param   {TotalPriceString} totalPrice
 * @returns {ParsedTotalPrice}
 */
function parseTotalPrice(totalPrice = '') {
  return {
    currencyCode: totalPrice.substring(0, 1),
    amount: parseInt(totalPrice.substring(1), 10),
  };
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
  const {amount, currencyCode} = parseTotalPrice(totalPrice);
  const pricePerUnitCalculation = (amount / quantity / measure).toFixed(2);
  const message = `${currencyCode}${pricePerUnitCalculation} per ${unit}`;

  console.log('[UNFIBUY]: parsed price per unit:', message);

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
<<<<<<< Updated upstream
  const totalPriceCellIndex = headersArray.findIndex(header => {
    return header.dataset.title === 'Total<br></th>Price';
  });
  const productDescriptionCellIndex = headersArray.findIndex(header => {
=======
  const totalPriceCellIndex = headersArray.findIndex((header) => {
    return header.dataset.title.match(/Total(.*)Price/g);
    });
  const productDescriptionCellIndex = headersArray.findIndex((header) => {
>>>>>>> Stashed changes
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
