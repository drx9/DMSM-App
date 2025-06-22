const bcrypt = require('bcryptjs');
const password = 'admin123';

bcrypt.genSalt(10, function (err, salt) {
    bcrypt.hash(password, salt, function (err, hash) {
        if (err) throw err;
        console.log('bcrypt hash for "admin123":', hash);
    });
}); 