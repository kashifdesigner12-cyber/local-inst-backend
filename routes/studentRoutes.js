/**
 * Student Management Routes
 */

const express = require('express');
const router = express.Router();

const studentController = require('../controllers/studentController');

const {
  protect
} = require('../middleware/authMiddleware');

const {
  requireAdminOrTeacher,
  requireAdmin
} = require('../middleware/roleMiddleware');

const {
  uploadStudentPhoto,
  uploadStudentDocument
} = require('../middleware/uploadMiddleware');

// -----------------------------------------------------
// All Student Routes Require Authentication
// -----------------------------------------------------

router.use(protect);

// -----------------------------------------------------
// Student CRUD
// -----------------------------------------------------

router
  .route('/')
  .post(
    requireAdminOrTeacher,
    uploadStudentPhoto,
    studentController.createStudent
  )
  .get(
    requireAdminOrTeacher,
    studentController.getStudents
  );

router
  .route('/:id')
  .get(
    requireAdminOrTeacher,
    studentController.getStudentById
  )
  .put(
    requireAdminOrTeacher,
    uploadStudentPhoto,
    studentController.updateStudent
  )
  .delete(
    requireAdmin,
    studentController.deleteStudent
  );

// -----------------------------------------------------
// Student Documents
// -----------------------------------------------------

// Add a document to a student
router.post(
  '/:id/documents',
  requireAdminOrTeacher,
  uploadStudentDocument,
  studentController.addStudentDocument
);

// Get all documents of a student
router.get(
  '/:id/documents',
  requireAdminOrTeacher,
  studentController.getStudentDocuments
);

// Delete a student document
router.delete(
  '/:id/documents/:documentId',
  requireAdminOrTeacher,
  studentController.deleteStudentDocument
);

module.exports = router;