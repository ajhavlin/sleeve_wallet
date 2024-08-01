const crypto = require('crypto');

// Params
const m = 256;
const w = 4;
const l1 = Math.ceil(m / Math.log(w));
const l2 = Math.floor(Math.log(l1 * (w - 1)) / Math.log(w)) + 1;
const l = l1 + l2;
const n = l + w - 1;
const path = "m/44'/60'/0'/0/0";

/**
 * Converts a hexadecimal number to base-w representation.
 * @param {string} x - The hexadecimal number as a string.
 * @param {number} length - The length of the base-w representation.
 * @returns {number[]} - The base-w representation of the number.
 */
function convertToBaseW(x, length) {
  let number = parseInt(x, 16);
  const baseW = [];
  for (let i = 0; i < length; i++) {
    baseW.push(number % w);
    number = Math.floor(number / w);
  }
  return baseW.reverse();
}

/**
 * Computes the checksum of a message in base-w representation.
 * @param {number[]} msg - The message in base-w representation.
 * @returns {string} - The checksum as a hexadecimal string.
 */
function computeChecksum(msg) {
  let checksum = 0;
  for (let i = 0; i < l1; i++) {
    checksum += (w - 1 - msg[i]);
  }
  return checksum.toString(16);
}

/**
 * Chaining function as defined in Hulsing, A. and Kudinov, M. (2022) 'Recovering the tight security proof of SPHINCS+', p. 7.
 * @param {number} i - The chain index, i ∈ [0, l - 1].
 * @param {number} j - The iteration step, j ∈ [0, w - 2].
 * @param {string[]} seeds - The array of seed values.
 * @param {string[]} tweaks - The array of tweak values.
 * @returns {string} - The resulting hash value.
 */
function chainingFunctionRecursive(i, j, seeds, tweaks) {
  if (j <= 0) {
    return seeds[i];
  }

  const previousValue = chainingFunctionRecursive(i, j - 1, seeds, tweaks);
  const hash = crypto.createHmac('sha256', previousValue);
  hash.update(tweaks[j - 1]); // adjust 1-indexing to 0-indexing
  return hash.digest('hex');
}

/**
 * Main chaining function.
 * @param {number} i - The chain index.
 * @param {number} k - The iteration counter.
 * @param {string[]} seeds - The array of seed values.
 * @param {string[]} tweaks - The array of tweak values.
 * @returns {string} - The resulting hash value.
 */
function chainingFunction(i, k, seeds, tweaks) {
  const result = chainingFunctionRecursive(i, k, seeds, tweaks); 
  return result; 
}

/**
 * Checks if a number has an even parity (even number of 1s in its binary representation).
 * @param {number} value - The number to check.
 * @returns {boolean} - True if the number has even parity, false otherwise.
 */
function hasEvenParity(value) {
  const binaryRepresentation = value.toString(2);
  const numberOfOnes = binaryRepresentation.split('1').length - 1;
  return numberOfOnes % 2 === 0;
}

module.exports = {
  m,
  w,
  l1,
  l2,
  l,
  n,
  path,
  convertToBaseW,
  computeChecksum,
  chainingFunctionRecursive,
  chainingFunction,
  hasEvenParity
};
