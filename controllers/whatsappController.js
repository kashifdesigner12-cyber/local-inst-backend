const WhatsAppService = require('../services/WhatsAppService');

const sendAbsentTest = async (req, res) => {
  try {
    const {
      studentName,
      className,
      section,
      date,
      parentWhatsApp
    } = req.body;

    // Validate required fields
    if (
      !studentName ||
      !className ||
      !section ||
      !date ||
      !parentWhatsApp
    ) {
      return res.status(400).json({
        success: false,
        message:
          'studentName, className, section, date and parentWhatsApp are required'
      });
    }

    // Send WhatsApp notification
    const result = await WhatsAppService.sendAbsentNotification({
      studentName,
      className,
      section,
      date,
      parentWhatsApp
    });

    // WhatsApp API/service returned an error
    if (!result || !result.success) {
      return res.status(result?.statusCode || 400).json({
        success: false,
        message: result?.error || 'Failed to send WhatsApp notification',
        data: result || null
      });
    }

    // Success
    return res.status(200).json({
      success: true,
      message: 'WhatsApp absent notification sent successfully',
      data: result
    });

  } catch (error) {
    console.error('[WhatsApp Test Controller]', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to send WhatsApp notification',
      error: error.message
    });
  }
};

module.exports = {
  sendAbsentTest
};