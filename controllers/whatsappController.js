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

    if (
      !studentName ||
      !className ||
      !section ||
      !date ||
      !parentWhatsApp
    ) {
      return res.status(400).json({
        success: false,
        message: 'studentName, className, section, date and parentWhatsApp are required'
      });
    }

    const result = await WhatsAppService.sendAbsentNotification({
      studentName,
      className,
      section,
      date,
      parentWhatsApp
    });

    if (!result.success) {
      return res.status(result.statusCode || 400).json({
        success: false,
        message: result.error,
        data: result
      });
    }

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