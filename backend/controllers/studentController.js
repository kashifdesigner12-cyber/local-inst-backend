const Student = require('../models/Student');
const ApiResponse = require('../utils/apiResponse');
const { isValidObjectId } = require('../utils/validators');
const { logAction } = require('../services/auditService');

/**
 * -----------------------------------------------------
 * Helper
 * -----------------------------------------------------
 */

const escapeRegex = (value) => {
  return String(value).replace(
    /[.*+?^${}()|[\]\\]/g,
    '\\$&'
  );
};

/**
 * -----------------------------------------------------
 * Create Student
 * -----------------------------------------------------
 *
 * POST /api/students
 * Access: Admin, Teacher
 *
 * Required fields:
 * - First Name (or derived from Name)
 * - Last Name (or derived from Name)
 * - CNIC / B-Form
 * - Courses Details / Enrolled Courses (at least one course selected)
 *
 * All other fields are optional.
 */
const createStudent = async (req, res, next) => {
  try {
    const {
      name,
      firstName,
      lastName,
      admissionNo,
      className,
      courses,
      enrolledCourses,
      courseDuration,
      section,
      rollNo,
      rollNumber,
      gender,
      status,
      cnic,
      bForm,
      parentName,
      fatherName,
      parentPhone,
      parentWhatsApp,
      studentPhone,
      parentEmail,
      dateOfBirth,
      dob,
      address,
      admissionDate
    } = req.body || {};

    // -------------------------------------------------------------
    // Required Fields Only: First Name, Last Name, CNIC, Courses
    // -------------------------------------------------------------

    // 1. First Name
    const resolvedFirstName = String(
      firstName || (name ? String(name).trim().split(/\s+/)[0] : '')
    ).trim();

    if (!resolvedFirstName) {
      return ApiResponse.error(res, 400, 'First name is required');
    }

    // 2. Last Name
    const resolvedLastName = String(
      lastName || (name ? String(name).trim().split(/\s+/).slice(1).join(' ') : '')
    ).trim();

    if (!resolvedLastName) {
      return ApiResponse.error(res, 400, 'Last name is required');
    }

    // 3. CNIC / B-Form
    const resolvedCnic = String(cnic || bForm || '').trim();
    if (!resolvedCnic) {
      return ApiResponse.error(res, 400, 'CNIC / B-Form is required');
    }

    // 4. Courses Details / Enrolled Courses (Select at least one course)
    let courseList = courses || enrolledCourses;
    if (typeof courseList === 'string') {
      courseList = courseList
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean);
    } else if (!Array.isArray(courseList) && className) {
      courseList = String(className)
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean);
    }

    if (!courseList || !Array.isArray(courseList) || courseList.length === 0) {
      return ApiResponse.error(
        res,
        400,
        'Please select at least one course (Courses Details / Enrolled Courses is required)'
      );
    }

    // -------------------------------------------------------------
    // All other fields are OPTIONAL / NON-MANDATORY
    // -------------------------------------------------------------
    let normalizedAdmissionNo = admissionNo
      ? String(admissionNo).trim().toUpperCase()
      : '';

    if (normalizedAdmissionNo) {
      const existingStudent = await Student.findOne({
        admissionNo: normalizedAdmissionNo
      });

      if (existingStudent) {
        return ApiResponse.error(
          res,
          409,
          `Student with admission number '${normalizedAdmissionNo}' already exists`
        );
      }
    } else {
      normalizedAdmissionNo = `ADM-${Date.now().toString().slice(-6)}`;
    }

    // Photo extraction (Supports both req.files.photo and req.file)
    let photoPath = '';
    if (req.files?.photo?.[0]) {
      photoPath = `/uploads/students/${req.files.photo[0].filename}`;
    } else if (req.file) {
      photoPath = `/uploads/students/${req.file.filename}`;
    } else if (req.body?.photo) {
      photoPath = String(req.body.photo).trim();
    }

    // ID Card extraction (Supports req.files.idCard and req.body.idCardPhoto)
    let idCardPath = '';
    if (req.files?.idCard?.[0]) {
      idCardPath = `/uploads/students/${req.files.idCard[0].filename}`;
    } else if (req.body?.idCardPhoto) {
      idCardPath = String(req.body.idCardPhoto).trim();
    }

    const resolvedParentName = String(parentName || fatherName || '').trim();
    const resolvedParentPhone = String(parentPhone || parentWhatsApp || '').trim();
    const resolvedClassName = className
      ? String(className).trim()
      : courseList.join(', ');

    const student = await Student.create({
      firstName: resolvedFirstName,
      lastName: resolvedLastName,
      name: `${resolvedFirstName} ${resolvedLastName}`.trim(),
      admissionNo: normalizedAdmissionNo,
      className: resolvedClassName,
      courses: courseList,
      courseDuration: courseDuration ? String(courseDuration).trim() : '3 Months',
      section: section ? String(section).trim().toUpperCase() : 'MORNING',
      rollNo: rollNo || rollNumber ? String(rollNo || rollNumber).trim() : '',
      gender: gender ? String(gender).trim() : 'Male',
      status: status ? String(status).trim() : 'Active',
      cnic: resolvedCnic,
      photo: photoPath,
      idCardPhoto: idCardPath,
      parentName: resolvedParentName,
      parentPhone: resolvedParentPhone,
      studentPhone: studentPhone ? String(studentPhone).trim() : '',
      parentEmail: parentEmail ? String(parentEmail).trim().toLowerCase() : '',
      dateOfBirth: dateOfBirth || dob ? new Date(dateOfBirth || dob) : undefined,
      address: address ? String(address).trim() : '',
      admissionDate: admissionDate ? new Date(admissionDate) : Date.now(),
      createdBy: req.user._id
    });

    await logAction({
      user: req.user._id,
      action: 'STUDENT_CREATED',
      entity: 'Student',
      entityId: student._id.toString(),
      details: {
        admissionNo: student.admissionNo,
        name: student.name,
        className: student.className
      },
      ip: req.ip
    });

    return ApiResponse.success(
      res,
      201,
      'Student created successfully',
      {
        student
      }
    );
  } catch (error) {
    next(error);
  }
};

/**
 * -----------------------------------------------------
 * Get Students
 * -----------------------------------------------------
 *
 * GET /api/students
 * Access: Admin, Teacher
 */
const getStudents = async (req, res, next) => {
  try {
    const page = Math.max(
      parseInt(req.query.page, 10) || 1,
      1
    );

    const limit = Math.min(
      Math.max(
        parseInt(req.query.limit, 10) || 20,
        1
      ),
      100
    );

    const skip = (page - 1) * limit;

    const {
      search,
      className,
      section,
      status,
      gender,
      sortBy = 'createdAt',
      order = 'desc'
    } = req.query;

    const query = {};

    if (className && String(className).trim()) {
      query.className = new RegExp(
        escapeRegex(String(className).trim()),
        'i'
      );
    }

    if (section && String(section).trim()) {
      query.section = new RegExp(
        `^${escapeRegex(String(section).trim())}$`,
        'i'
      );
    }

    if (status && String(status).trim()) {
      query.status = String(status)
        .trim()
        .toUpperCase();
    }

    if (gender && String(gender).trim()) {
      query.gender = String(gender)
        .trim()
        .toUpperCase();
    }

    if (search && String(search).trim()) {
      const searchRegex = new RegExp(
        escapeRegex(String(search).trim()),
        'i'
      );

      query.$or = [
        { name: searchRegex },
        { firstName: searchRegex },
        { lastName: searchRegex },
        { admissionNo: searchRegex },
        { parentName: searchRegex },
        { parentPhone: searchRegex },
        { cnic: searchRegex }
      ];
    }

    const allowedSortFields = [
      'name',
      'admissionNo',
      'className',
      'courseDuration',
      'section',
      'rollNo',
      'gender',
      'status',
      'createdAt',
      'updatedAt'
    ];

    const safeSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : 'createdAt';

    const sortOrder = order === 'asc'
      ? 1
      : -1;

    const sort = {
      [safeSortBy]: sortOrder
    };

    const [students, total] = await Promise.all([
      Student.find(query)
        .populate(
          'createdBy',
          'name email role'
        )
        .sort(sort)
        .skip(skip)
        .limit(limit),

      Student.countDocuments(query)
    ]);

    const totalPages = Math.ceil(
      total / limit
    );

    return ApiResponse.success(
      res,
      200,
      'Students retrieved successfully',
      {
        students
      },
      {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    );
  } catch (error) {
    next(error);
  }
};

/**
 * -----------------------------------------------------
 * Get Student By ID
 * -----------------------------------------------------
 *
 * GET /api/students/:id
 * Access: Admin, Teacher
 */
const getStudentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return ApiResponse.error(
        res,
        400,
        'Invalid student ID format'
      );
    }

    const student = await Student.findById(id)
      .populate(
        'createdBy',
        'name email role'
      );

    if (!student) {
      return ApiResponse.error(
        res,
        404,
        'Student not found'
      );
    }

    return ApiResponse.success(
      res,
      200,
      'Student details retrieved',
      {
        student
      }
    );
  } catch (error) {
    next(error);
  }
};

/**
 * -----------------------------------------------------
 * Update Student
 * -----------------------------------------------------
 *
 * PUT /api/students/:id
 * Access: Admin, Teacher
 */
const updateStudent = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return ApiResponse.error(
        res,
        400,
        'Invalid student ID format'
      );
    }

    const student = await Student.findById(id);

    if (!student) {
      return ApiResponse.error(
        res,
        404,
        'Student not found'
      );
    }

    if (
      req.body?.admissionNo &&
      String(req.body.admissionNo)
        .trim()
        .toUpperCase() !== student.admissionNo
    ) {
      const normalizedAdmissionNo = String(
        req.body.admissionNo
      )
        .trim()
        .toUpperCase();

      const duplicate = await Student.findOne({
        admissionNo: normalizedAdmissionNo,
        _id: {
          $ne: id
        }
      });

      if (duplicate) {
        return ApiResponse.error(
          res,
          409,
          `Admission number '${normalizedAdmissionNo}' is already taken`
        );
      }
    }

    const allowedFields = [
      'name',
      'firstName',
      'lastName',
      'admissionNo',
      'className',
      'courses',
      'courseDuration',
      'section',
      'rollNo',
      'gender',
      'status',
      'cnic',
      'parentName',
      'parentPhone',
      'studentPhone',
      'parentEmail',
      'dateOfBirth',
      'address',
      'admissionDate'
    ];

    const updates = {};

    allowedFields.forEach((field) => {
      if (req.body?.[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (req.files?.photo?.[0]) {
      updates.photo = `/uploads/students/${req.files.photo[0].filename}`;
    } else if (req.file) {
      updates.photo = `/uploads/students/${req.file.filename}`;
    }

    if (req.files?.idCard?.[0]) {
      updates.idCardPhoto = `/uploads/students/${req.files.idCard[0].filename}`;
    } else if (req.body?.idCardPhoto) {
      updates.idCardPhoto = String(req.body.idCardPhoto).trim();
    }

    if (updates.name !== undefined) {
      updates.name = String(updates.name).trim();
    }

    if (updates.firstName !== undefined || updates.lastName !== undefined) {
      const f = updates.firstName !== undefined ? updates.firstName : student.firstName;
      const l = updates.lastName !== undefined ? updates.lastName : student.lastName;
      updates.name = `${f || ''} ${l || ''}`.trim();
    }

    if (updates.courses !== undefined && !updates.className) {
      if (Array.isArray(updates.courses)) {
        updates.className = updates.courses.join(', ');
      }
    }

    if (updates.admissionNo !== undefined) {
      updates.admissionNo = String(updates.admissionNo)
        .trim()
        .toUpperCase();
    }

    if (updates.className !== undefined) {
      updates.className = String(updates.className).trim();
    }

    if (updates.courseDuration !== undefined) {
      updates.courseDuration = String(updates.courseDuration).trim();
    }

    if (updates.section !== undefined) {
      updates.section = String(updates.section)
        .trim()
        .toUpperCase();
    }

    if (updates.rollNo !== undefined) {
      updates.rollNo = String(updates.rollNo).trim();
    }

    if (updates.gender !== undefined) {
      updates.gender = String(updates.gender)
        .trim()
        .toUpperCase();
    }

    if (updates.status !== undefined) {
      updates.status = String(updates.status)
        .trim()
        .toUpperCase();
    }

    if (updates.cnic !== undefined) {
      updates.cnic = String(updates.cnic).trim();
    }

    if (updates.parentName !== undefined) {
      updates.parentName = String(updates.parentName).trim();
    }

    if (updates.parentPhone !== undefined) {
      updates.parentPhone = String(updates.parentPhone).trim();
    }

    if (updates.studentPhone !== undefined) {
      updates.studentPhone = String(updates.studentPhone).trim();
    }

    if (updates.parentEmail !== undefined) {
      updates.parentEmail = String(updates.parentEmail)
        .trim()
        .toLowerCase();
    }

    if (updates.address !== undefined) {
      updates.address = String(updates.address).trim();
    }

    if (updates.dateOfBirth !== undefined) {
      updates.dateOfBirth = new Date(updates.dateOfBirth);
    }

    if (updates.admissionDate !== undefined) {
      updates.admissionDate = new Date(updates.admissionDate);
    }

    if (Object.keys(updates).length === 0) {
      return ApiResponse.error(
        res,
        400,
        'Please provide at least one field to update'
      );
    }

    const updatedStudent =
      await Student.findByIdAndUpdate(
        id,
        updates,
        {
          new: true,
          runValidators: true
        }
      ).populate(
        'createdBy',
        'name email role'
      );

    await logAction({
      user: req.user._id,
      action: 'STUDENT_UPDATED',
      entity: 'Student',
      entityId: id,
      details: updates,
      ip: req.ip
    });

    return ApiResponse.success(
      res,
      200,
      'Student updated successfully',
      {
        student: updatedStudent
      }
    );
  } catch (error) {
    next(error);
  }
};

/**
 * -----------------------------------------------------
 * Delete Student
 * -----------------------------------------------------
 *
 * DELETE /api/students/:id
 * Access: Admin
 */
const deleteStudent = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return ApiResponse.error(
        res,
        400,
        'Invalid student ID format'
      );
    }

    const student = await Student.findById(id);

    if (!student) {
      return ApiResponse.error(
        res,
        404,
        'Student not found'
      );
    }

    await Student.findByIdAndDelete(id);

    await logAction({
      user: req.user._id,
      action: 'STUDENT_DELETED',
      entity: 'Student',
      entityId: id,
      details: {
        admissionNo: student.admissionNo,
        name: student.name
      },
      ip: req.ip
    });

    return ApiResponse.success(
      res,
      200,
      'Student deleted successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * -----------------------------------------------------
 * Add Student Document
 * -----------------------------------------------------
 *
 * POST /api/students/:id/documents
 * Access: Admin, Teacher
 */
const addStudentDocument = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return ApiResponse.error(
        res,
        400,
        'Invalid student ID format'
      );
    }

    let documentType = '';

    if (
      req.body &&
      Object.prototype.hasOwnProperty.call(
        req.body,
        'documentType'
      )
    ) {
      documentType = req.body.documentType;
    }

    if (Array.isArray(documentType)) {
      documentType = documentType[0];
    }

    if (
      documentType !== null &&
      documentType !== undefined
    ) {
      documentType = String(documentType);
    } else {
      documentType = '';
    }

    documentType = documentType.trim();

    if (!documentType) {
      return ApiResponse.error(
        res,
        400,
        'Document type is required'
      );
    }

    const uploadedFile = req.file;

    if (!uploadedFile) {
      return ApiResponse.error(
        res,
        400,
        'Please upload a document'
      );
    }

    const student = await Student.findById(id);

    if (!student) {
      return ApiResponse.error(
        res,
        404,
        'Student not found'
      );
    }

    const document = {
      type: documentType.toUpperCase(),
      name: uploadedFile.originalname,
      fileUrl:
        `/uploads/students/documents/${uploadedFile.filename}`,
      mimeType:
        uploadedFile.mimetype || '',
      uploadedAt: new Date()
    };

    student.documents.push(document);

    await student.save();

    const addedDocument =
      student.documents[
        student.documents.length - 1
      ];

    await logAction({
      user: req.user._id,
      action: 'STUDENT_DOCUMENT_ADDED',
      entity: 'Student',
      entityId: id,
      details: {
        documentId:
          addedDocument._id.toString(),
        documentType:
          addedDocument.type,
        fileName:
          addedDocument.name
      },
      ip: req.ip
    });

    return ApiResponse.success(
      res,
      201,
      'Student document uploaded successfully',
      {
        document: addedDocument
      }
    );
  } catch (error) {
    next(error);
  }
};

/**
 * -----------------------------------------------------
 * Get Student Documents
 * -----------------------------------------------------
 *
 * GET /api/students/:id/documents
 * Access: Admin, Teacher
 */
const getStudentDocuments = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return ApiResponse.error(
        res,
        400,
        'Invalid student ID format'
      );
    }

    const student = await Student.findById(id)
      .select(
        'name admissionNo documents'
      );

    if (!student) {
      return ApiResponse.error(
        res,
        404,
        'Student not found'
      );
    }

    return ApiResponse.success(
      res,
      200,
      'Student documents retrieved successfully',
      {
        studentId: student._id,
        studentName: student.name,
        admissionNo: student.admissionNo,
        documents: student.documents
      }
    );
  } catch (error) {
    next(error);
  }
};

/**
 * -----------------------------------------------------
 * Delete Student Document
 * -----------------------------------------------------
 *
 * DELETE /api/students/:id/documents/:documentId
 * Access: Admin, Teacher
 */
const deleteStudentDocument = async (
  req,
  res,
  next
) => {
  try {
    const {
      id,
      documentId
    } = req.params;

    if (!isValidObjectId(id)) {
      return ApiResponse.error(
        res,
        400,
        'Invalid student ID format'
      );
    }

    if (!isValidObjectId(documentId)) {
      return ApiResponse.error(
        res,
        400,
        'Invalid document ID format'
      );
    }

    const student = await Student.findById(id);

    if (!student) {
      return ApiResponse.error(
        res,
        404,
        'Student not found'
      );
    }

    const document =
      student.documents.id(documentId);

    if (!document) {
      return ApiResponse.error(
        res,
        404,
        'Student document not found'
      );
    }

    const documentDetails = {
      documentId:
        document._id.toString(),
      type:
        document.type,
      name:
        document.name
    };

    document.deleteOne();

    await student.save();

    await logAction({
      user: req.user._id,
      action: 'STUDENT_DOCUMENT_DELETED',
      entity: 'Student',
      entityId: id,
      details: documentDetails,
      ip: req.ip
    });

    return ApiResponse.success(
      res,
      200,
      'Student document deleted successfully'
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createStudent,
  getStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
  addStudentDocument,
  getStudentDocuments,
  deleteStudentDocument
};
