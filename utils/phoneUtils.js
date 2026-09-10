/**
 * Phone and WhatsApp Number Normalizer
 *
 * Normalizes Pakistani numbers to E.164 standard:
 * +92XXXXXXXXXX
 *
 * Supports:
 * 03001234567
 * 3001234567
 * 923001234567
 * +923001234567
 * 00923001234567
 *
 * WhatsApp Cloud API requires digits without "+"
 * Example:
 * +923001234567 -> 923001234567
 */

/**
 * Normalize phone number
 *
 * @param {string} phone
 * @returns {string}
 */
const normalizePhoneNumber = (phone) => {
  if (!phone || typeof phone !== 'string') {
    return '';
  }

  // Remove spaces, hyphens, brackets, dots
  const cleaned = phone
    .trim()
    .replace(/[\s\-().]/g, '');

  if (!cleaned) {
    return '';
  }

  // Pakistani local mobile format
  // Example: 03001234567
  if (/^03[0-9]{9}$/.test(cleaned)) {
    return `+92${cleaned.substring(1)}`;
  }

  // Pakistani mobile without leading zero
  // Example: 3001234567
  if (/^3[0-9]{9}$/.test(cleaned)) {
    return `+92${cleaned}`;
  }

  // Pakistani international format without "+"
  // Example: 923001234567
  if (/^923[0-9]{9}$/.test(cleaned)) {
    return `+${cleaned}`;
  }

  // Pakistani international format with 00
  // Example: 00923001234567
  if (/^00923[0-9]{9}$/.test(cleaned)) {
    return `+${cleaned.substring(2)}`;
  }

  // Pakistani international format with "+"
  // Example: +923001234567
  if (/^\+923[0-9]{9}$/.test(cleaned)) {
    return cleaned;
  }

  // Other international numbers
  // Example: +14155552671
  if (/^\+[1-9][0-9]{7,14}$/.test(cleaned)) {
    return cleaned;
  }

  // International format starting with 00
  // Example: 0014155552671
  if (/^00[1-9][0-9]{7,14}$/.test(cleaned)) {
    return `+${cleaned.substring(2)}`;
  }

  // Anything else is invalid
  return '';
};

/**
 * Format phone number for WhatsApp Cloud API
 *
 * Meta requires the recipient number without "+"
 *
 * Example:
 * +923001234567
 * becomes:
 * 923001234567
 *
 * @param {string} phone
 * @returns {string}
 */
const formatForWhatsAppApi = (phone) => {
  const normalized = normalizePhoneNumber(phone);

  if (!normalized) {
    return '';
  }

  // Remove "+"
  const digits = normalized.replace(/^\+/, '');

  // Final safety validation:
  // E.164 numbers contain maximum 15 digits.
  // Minimum 8 digits is used here to reject obviously invalid
  // values such as "123".
  if (!/^[1-9][0-9]{7,14}$/.test(digits)) {
    return '';
  }

  return digits;
};

module.exports = {
  normalizePhoneNumber,
  formatForWhatsAppApi
};