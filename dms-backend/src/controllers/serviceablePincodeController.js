module.exports.getAllPublic = async (req, res) => {
    try {
        const db = require('../models');
        const ServiceablePincode = db.ServiceablePincode || db.serviceablePincode;
        const pincodes = await ServiceablePincode.findAll({ where: { isActive: true } });
        res.json(pincodes);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch serviceable pincodes' });
    }
}; 