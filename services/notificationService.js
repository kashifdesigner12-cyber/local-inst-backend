/**
 * Central Notification Service
 * Coordinates WhatsApp & Email dispatch and persists logs in MongoDB
 */

const Notification = require('../models/Notification');
const whatsappService = require('./whatsappService');
const emailService = require('./emailService');

class NotificationService {
  /**
   * Send WhatsApp notification when a student is marked ABSENT
   * @param {Object} student - Student document
   * @param {Date|string} date - Attendance date
   * @param {string} className
   * @param {string} section
   */
  async notifyAttendanceAbsent(student, date, className, section) {
    if (!student || !student.parentWhatsApp) {
      // Record skipped notification
      await Notification.create({
        recipientType: 'PARENT',
        student: student ? student._id : null,
        parentName: student ? student.parentName : '',
        parentPhone: student ? student.parentPhone : '',
        parentWhatsApp: student ? student.parentWhatsApp : '',
        channel: 'WHATSAPP',
        type: 'ATTENDANCE',
        message: `Absent notification for ${student ? student.name : 'student'}`,
        status: 'SKIPPED',
        error: 'Parent WhatsApp number is missing',
        sentAt: new Date()
      });
      return { success: false, reason: 'Missing WhatsApp number' };
    }

    // Call official WhatsApp Cloud API
    const waResult = await whatsappService.sendAbsentNotification({
      studentName: student.name,
      className: className || student.className,
      section: section || student.section,
      date,
      parentWhatsApp: student.parentWhatsApp
    });

    // Save notification log in MongoDB
    try {
      await Notification.create({
        recipientType: 'PARENT',
        student: student._id,
        parentName: student.parentName,
        parentPhone: student.parentPhone,
        parentWhatsApp: student.parentWhatsApp,
        channel: 'WHATSAPP',
        type: 'ATTENDANCE',
        message: waResult.readableText || `Absent notification for ${student.name} on ${date}`,
        status: waResult.success ? 'SENT' : 'FAILED',
        providerMessageId: waResult.messageId || '',
        error: waResult.error || '',
        sentAt: waResult.success ? new Date() : undefined
      });
    } catch (logErr) {
      console.error('[NotificationService Log Error]', logErr.message);
    }

    return waResult;
  }

  /**
   * Send Performance Email and optional WhatsApp summary to Parent
   * @param {Object} params
   * @param {Object} params.student
   * @param {Object} params.exam
   * @param {Array} params.results
   * @param {Object} params.summary
   */
  async notifyPerformanceReport({ student, exam, results, summary }) {
    const outcomes = { email: null, whatsapp: null };

    // 1. Send Parent Email Report
    if (student.parentEmail) {
      const emailResult = await emailService.sendParentPerformanceEmail({
        student,
        exam,
        results,
        summary
      });

      outcomes.email = emailResult;

      try {
        await Notification.create({
          recipientType: 'PARENT',
          student: student._id,
          parentName: student.parentName,
          parentEmail: student.parentEmail,
          channel: 'EMAIL',
          type: 'PERFORMANCE',
          message: `Performance Report for Exam: ${exam.name}`,
          status: emailResult.success ? 'SENT' : emailResult.skipped ? 'SKIPPED' : 'FAILED',
          providerMessageId: emailResult.messageId || '',
          error: emailResult.error || '',
          sentAt: emailResult.success ? new Date() : undefined
        });
      } catch (err) {
        console.error('[NotificationService Email Log Error]', err.message);
      }
    }

    // 2. Send WhatsApp Summary (if WhatsApp number present)
    if (student.parentWhatsApp) {
      const waResult = await whatsappService.sendPerformanceNotification({
        studentName: student.name,
        className: student.className,
        examName: exam.name,
        percentage: summary.percentage,
        grade: summary.grade,
        parentWhatsApp: student.parentWhatsApp
      });

      outcomes.whatsapp = waResult;

      try {
        await Notification.create({
          recipientType: 'PARENT',
          student: student._id,
          parentName: student.parentName,
          parentWhatsApp: student.parentWhatsApp,
          channel: 'WHATSAPP',
          type: 'PERFORMANCE',
          message: waResult.readableText || `Performance notification for ${exam.name}`,
          status: waResult.success ? 'SENT' : 'FAILED',
          providerMessageId: waResult.messageId || '',
          error: waResult.error || '',
          sentAt: waResult.success ? new Date() : undefined
        });
      } catch (err) {
        console.error('[NotificationService WA Log Error]', err.message);
      }
    }

    return outcomes;
  }
}

module.exports = new NotificationService();