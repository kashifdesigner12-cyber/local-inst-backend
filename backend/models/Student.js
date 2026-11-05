const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true
    },

    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true
    },

    name: {
      type: String,
      trim: true
    },

    // CNIC / B-Form (Mandatory)
    cnic: {
      type: String,
      required: [true, 'CNIC / B-Form is required'],
      trim: true
    },

    // Courses Details / Enrolled Courses (Mandatory: select at least one course)
    courses: {
      type: [String],
      required: [true, 'At least one course is required'],
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length > 0;
        },
        message: 'Please select at least one course'
      }
    },

    // -----------------------------------------------------------------
    // ALL OTHER FIELDS ARE OPTIONAL / NON-MANDATORY
    // -----------------------------------------------------------------

    admissionNo: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      uppercase: true
    },

    className: {
      type: String,
      trim: true,
      default: ''
    },

    courseDuration: {
      type: String,
      trim: true,
      default: '3 Months'
    },

    section: {
      type: String,
      trim: true,
      uppercase: true,
      default: 'MORNING'
    },

    rollNo: {
      type: String,
      trim: true,
      default: ''
    },

    gender: {
      type: String,
      enum: {
        values: ['MALE', 'FEMALE', 'OTHER', 'Male', 'Female', 'Other', ''],
        message: '{VALUE} is not valid. Allowed: Male, Female, Other'
      },
      default: 'Male'
    },

    status: {
      type: String,
      enum: {
        values: ['ACTIVE', 'INACTIVE', 'Active', 'Inactive', ''],
        message: '{VALUE} is not valid. Allowed: Active, Inactive'
      },
      default: 'Active'
    },

    idCardPhoto: {
      type: String,
      trim: true,
      default: ''
    },

    photo: {
      type: String,
      default: ''
    },

    documents: [
      {
        type: {
          type: String,
          required: true,
          trim: true
        },

        name: {
          type: String,
          required: true,
          trim: true
        },

        fileUrl: {
          type: String,
          required: true,
          trim: true
        },

        mimeType: {
          type: String,
          default: ''
        },

        uploadedAt: {
          type: Date,
          default: Date.now
        }
      }
    ],

    parentName: {
      type: String,
      trim: true,
      default: ''
    },

    parentPhone: {
      type: String,
      trim: true,
      default: ''
    },

    studentPhone: {
      type: String,
      trim: true,
      default: ''
    },

    parentEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: ''
    },

    dateOfBirth: {
      type: Date
    },

    address: {
      type: String,
      trim: true,
      default: ''
    },

    admissionDate: {
      type: Date,
      default: Date.now
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
);

/**
 * Pre-validation Middleware to automatically synchronize
 * firstName + lastName <-> name, courses <-> className, and admissionNo
 */
studentSchema.pre('validate', function () {
  // Synchronize name
  if (this.firstName || this.lastName) {
    this.name = `${this.firstName || ''} ${this.lastName || ''}`.trim();
  } else if (this.name) {
    const parts = String(this.name).trim().split(/\s+/);
    this.firstName = parts[0] || 'Student';
    this.lastName = parts.slice(1).join(' ') || '.';
  }

  // Synchronize className from courses if missing
  if (!this.className && Array.isArray(this.courses) && this.courses.length > 0) {
    this.className = this.courses.join(', ');
  }

  // Synchronize courses from className if missing
  if ((!this.courses || this.courses.length === 0) && this.className) {
    this.courses = String(this.className)
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);
  }

  // Generate admission number if not provided
  if (!this.admissionNo) {
    this.admissionNo = `ADM-${Date.now().toString().slice(-6)}`;
  }
});

/**
 * Indexes for fast lookup and reporting
 */
studentSchema.index({ className: 1, section: 1 });
studentSchema.index({ status: 1 });
studentSchema.index({ cnic: 1 });
studentSchema.index({
  name: 'text',
  parentName: 'text',
  admissionNo: 'text'
});

const Student = mongoose.model('Student', studentSchema);

module.exports = Student;
