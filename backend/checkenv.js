require('dotenv').config();
console.log('MONGO_URI:', !!process.env.MONGO_URI);
console.log('AUTH0_DOMAIN:', process.env.AUTH0_DOMAIN);
console.log('AUTH0_AUDIENCE:', process.env.AUTH0_AUDIENCE);
