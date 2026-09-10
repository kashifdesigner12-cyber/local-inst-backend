/**
 * Official Meta WhatsApp Cloud API Service
 * Meta Graph API:
 * POST https://graph.facebook.com/{API_VERSION}/{PHONE_NUMBER_ID}/messages
 */

const axios = require('axios');
const config = require('../config/env');
const { formatForWhatsAppApi } = require('../utils/phoneUtils');

class WhatsAppService {
  constructor() {
    this.accessToken = config.whatsapp.accessToken;
    this.phoneNumberId = config.whatsapp.phoneNumberId;
    this.apiVersion = config.whatsapp.apiVersion || 'v25.0';

    // Template names
    this.absentTemplate = config.whatsapp.templates.absent || 'attendance_absent';
    this.presentTemplate = config.whatsapp.templates.present || 'attendance_present';
    this.performanceTemplate =
      config.whatsapp.templates.performance || 'performance_report';
  }

  /**
   * Check WhatsApp credentials
   */
  isConfigured() {
    return Boolean(
      this.accessToken &&
      this.phoneNumberId &&
      !this.accessToken.includes('your_meta')
    );
  }

  /**
   * Send payload to Meta WhatsApp Cloud API
   */
  async sendMessagePayload(payload) {
    if (!this.isConfigured()) {
      const msg =
        'WhatsApp Cloud API credentials are not configured or placeholder in .env';

      console.warn(`[WhatsAppService] ${msg}`);

      return {
        success: false,
        error: msg,
        isMocked: true
      };
    }

    const url =
      `https://graph.facebook.com/${this.apiVersion}/` +
      `${this.phoneNumberId}/messages`;

    try {
      console.log('[WhatsAppService] Sending WhatsApp payload:');
      console.log(JSON.stringify({
        ...payload,
        // Never log the access token
      }, null, 2));

      const response = await axios.post(url, payload, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      const messageId =
        response.data?.messages?.[0]?.id || 'WA_SENT';

      console.log(
        `[WhatsAppService] Message accepted by Meta: ${messageId}`
      );

      return {
        success: true,
        messageId,
        raw: response.data
      };

    } catch (error) {
      const errorDetail =
        error.response?.data?.error?.message ||
        error.response?.data?.error?.error_user_msg ||
        error.message ||
        'Failed to send WhatsApp message via Meta Cloud API';

      console.error(
        `[WhatsAppService Error] Status: ${error.response?.status} - ${errorDetail}`
      );

      return {
        success: false,
        error: errorDetail,
        statusCode: error.response?.status,
        raw: error.response?.data
      };
    }
  }

  /**
   * SEND ABSENT NOTIFICATION
   *
   * Meta Template:
   * attendance_absent
   *
   * Variables:
   * {{1}} = Student name
   * {{2}} = Class + section
   * {{3}} = Date
   */
  async sendAbsentNotification({
    studentName,
    className,
    section,
    date,
    parentWhatsApp
  }) {
    const formattedRecipient =
      formatForWhatsAppApi(parentWhatsApp);

    if (!formattedRecipient) {
      return {
        success: false,
        error: 'Invalid or missing parent WhatsApp phone number'
      };
    }

    const formattedDate = new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });

    const classWithSection = `${className}-${section}`;

    // IMPORTANT:
    // This is the actual WhatsApp template sent to Meta.
    const templatePayload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: formattedRecipient,

      type: 'template',

      template: {
        // MUST match Meta template name
        name: this.absentTemplate,

        language: {
          code: 'en_US'
        },

        components: [
          {
            type: 'body',

            parameters: [
              {
                type: 'text',
                text: String(studentName)
              },
              {
                type: 'text',
                text: String(classWithSection)
              },
              {
                type: 'text',
                text: String(formattedDate)
              }
            ]
          }
        ]
      }
    };

    // This is only for your system logs/audit.
    const readableText =
      `Dear Parent,\n\n` +
      `Your child ${studentName} was marked ABSENT today.\n\n` +
      `Class: ${classWithSection}\n` +
      `Date: ${formattedDate}\n\n` +
      `Regards,\n` +
      `Local Pro 1 Institute`;

    const result =
      await this.sendMessagePayload(templatePayload);

    return {
      ...result,
      readableText,
      recipient: formattedRecipient,
      template: this.absentTemplate
    };
  }

  /**
   * SEND PRESENT NOTIFICATION
   */
  async sendPresentNotification({
    studentName,
    className,
    section,
    date,
    parentWhatsApp
  }) {
    const formattedRecipient =
      formatForWhatsAppApi(parentWhatsApp);

    if (!formattedRecipient) {
      return {
        success: false,
        error: 'Invalid parent WhatsApp number'
      };
    }

    const formattedDate = new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });

    const templatePayload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: formattedRecipient,

      type: 'template',

      template: {
        name: this.presentTemplate,

        language: {
          code: 'en_US'
        },

        components: [
          {
            type: 'body',
            parameters: [
              {
                type: 'text',
                text: String(studentName)
              },
              {
                type: 'text',
                text: `${className}-${section}`
              },
              {
                type: 'text',
                text: String(formattedDate)
              }
            ]
          }
        ]
      }
    };

    const readableText =
      `Dear Parent,\n\n` +
      `Your child ${studentName} attended school today.\n\n` +
      `Class: ${className}-${section}\n` +
      `Date: ${formattedDate}\n\n` +
      `Regards,\n` +
      `Local Pro 1 Institute`;

    const result =
      await this.sendMessagePayload(templatePayload);

    return {
      ...result,
      readableText,
      recipient: formattedRecipient,
      template: this.presentTemplate
    };
  }

  /**
   * SEND PERFORMANCE NOTIFICATION
   */
  async sendPerformanceNotification({
    studentName,
    className,
    examName,
    percentage,
    grade,
    parentWhatsApp
  }) {
    const formattedRecipient =
      formatForWhatsAppApi(parentWhatsApp);

    if (!formattedRecipient) {
      return {
        success: false,
        error: 'Invalid parent WhatsApp number'
      };
    }

    const templatePayload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: formattedRecipient,

      type: 'template',

      template: {
        name: this.performanceTemplate,

        language: {
          code: 'en_US'
        },

        components: [
          {
            type: 'body',
            parameters: [
              {
                type: 'text',
                text: String(studentName)
              },
              {
                type: 'text',
                text: String(examName)
              },
              {
                type: 'text',
                text: `${percentage}%`
              },
              {
                type: 'text',
                text: String(grade)
              }
            ]
          }
        ]
      }
    };

    const readableText =
      `Dear Parent,\n\n` +
      `Performance results for ${studentName} are published.\n\n` +
      `Exam: ${examName}\n` +
      `Percentage: ${percentage}%\n` +
      `Grade: ${grade}\n\n` +
      `Regards,\n` +
      `Local Pro 1 Institute`;

    const result =
      await this.sendMessagePayload(templatePayload);

    return {
      ...result,
      readableText,
      recipient: formattedRecipient,
      template: this.performanceTemplate
    };
  }
}

module.exports = new WhatsAppService();