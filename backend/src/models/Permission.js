const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Permission name is required'],
      trim: true,
      maxlength: [100, 'Permission name cannot exceed 100 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Permission slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[a-z0-9_]+(\.[a-z0-9_]+)+$/,
        'Permission slug must follow module.action format (e.g., doctors.create)',
      ],
    },
    module: {
      type: String,
      required: [true, 'Permission module is required'],
      trim: true,
      maxlength: [60, 'Module name cannot exceed 60 characters'],
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: [300, 'Description cannot exceed 300 characters'],
    },
  },
  {
    timestamps: true,
    collection: 'permissions',
  }
);

permissionSchema.index({ module: 1, slug: 1 });

const Permission = mongoose.model('Permission', permissionSchema);

module.exports = Permission;
