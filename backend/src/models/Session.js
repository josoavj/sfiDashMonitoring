const { DataTypes } = require('sequelize');
const { sequelize } = require('../databases/Sequelize');

const Session = sequelize.define('Session', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  userAgent: { type: DataTypes.STRING, allowNull: true },
  ipAddress: { type: DataTypes.STRING, allowNull: true },
  revoked: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  expiresAt: { type: DataTypes.DATE, allowNull: true },
  // Nouveau: hash du refresh token (sécurité - ne pas stocker le token en clair)
  refreshTokenHash: { type: DataTypes.STRING(64), allowNull: true }, // SHA256 = 64 chars 
  refreshToken: { type: DataTypes.STRING, allowNull: true }
}, {
  modelName: 'Session',
  tableName: 'sessions',
  timestamps: false
});

module.exports = { Session };
