const { DataTypes } = require('sequelize');
const { sequelize } = require('../databases/Sequelize');

const Setting = sequelize.define('Setting', {
  key: { type: DataTypes.STRING, primaryKey: true },
  value: { type: DataTypes.JSON, allowNull: false }
}, {
  tableName: 'settings',
  timestamps: false
});

module.exports = { Setting };
