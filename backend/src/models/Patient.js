const mongoose = require('mongoose');

const PATIENT_GENDERS = ['Male', 'Female', 'Other'];
const PATIENT_STATUSES = [
  'Active',
  'Under Observation',
  'Recovered',
  'Critical',
  'Discharged',
];

const patientSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Patient name is required'],
      trim: true,
      minlength: [2, 'Patient name must be at least 2 characters'],
      maxlength: [120, 'Patient name cannot exceed 120 characters'],
    },
    age: {
      type: Number,
      required: [true, 'Patient age is required'],
      min: [0, 'Age cannot be negative'],
      max: [150, 'Age cannot exceed 150'],
    },
    gender: {
      type: String,
      required: [true, 'Gender is required'],
      enum: {
        values: PATIENT_GENDERS,
        message: 'Gender must be Male, Female, or Other',
      },
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      maxlength: [30, 'Phone number cannot exceed 30 characters'],
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      default: '',
      validate: {
        validator: (val) => !val || /^\S+@\S+\.\S+$/.test(val),
        message: 'Please provide a valid email address',
      },
    },
    condition: {
      type: String,
      required: [true, 'Medical condition is required'],
      trim: true,
      maxlength: [150, 'Condition cannot exceed 150 characters'],
    },
    status: {
      type: String,
      enum: {
        values: PATIENT_STATUSES,
        message: 'Invalid patient status',
      },
      default: 'Active',
    },
    admissionDate: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      default: null,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'patients',
  }
);

patientSchema.index({ doctor: 1, createdAt: -1 });
patientSchema.index({ condition: 1 });
patientSchema.index({ status: 1 });
patientSchema.index({ admissionDate: -1 });
patientSchema.index({ createdAt: -1 });
patientSchema.index({ user: 1 });
patientSchema.index({ email: 1 });
patientSchema.index({ name: 1 });

const Patient = mongoose.model('Patient', patientSchema);

module.exports = {
  Patient,
  PATIENT_GENDERS,
  PATIENT_STATUSES,
};
