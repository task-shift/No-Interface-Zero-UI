const express = require('express');
const userRoutes = require('./routes/userRoutes');

const app = express();

// Use the user routes
app.use('/api', userRoutes);

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
