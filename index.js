require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const alumnosRoutes = require('./routes/alumnos');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/alumnos', alumnosRoutes);

app.get('/', (req, res) => {
  res.send('API del Sistema Académico UTFV funcionando correctamente');
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Conectado con éxito a MongoDB Atlas (utfv_nosql)');
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Error al conectar a MongoDB Atlas:', error.message);
  });