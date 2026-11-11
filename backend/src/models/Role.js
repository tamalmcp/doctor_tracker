const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Role name is required'],
      unique: true,
      trim: true,
      minlength: [2, 'Role name must be at least 2 characters'],
      maxlength: [60, 'Role name cannot exceed 60 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Role slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        'Role slug must be lowercase kebab-case (e.g., clinic-manager)',
      ],
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: [300, 'Description cannot exceed 300 characters'],
    },
    permissions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Permission',
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    isSystem: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: 'roles',
  }
);

roleSchema.index({ isActive: 1 });
roleSchema.index({ createdAt: -1 });

const Role = mongoose.model('Role', roleSchema);

module.exports = Role;
