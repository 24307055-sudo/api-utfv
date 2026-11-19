const mongoose = require('mongoose');

const CalificacionSchema = new mongoose.Schema({
  parcial_1: { type: Number, default: null },
  parcial_2: { type: Number, default: null },
  parcial_3: { type: Number, default: null },
  final: { type: Number, default: null }
}, { _id: false });

const MateriaSchema = new mongoose.Schema({
  clave: { type: String, required: true },
  nombre: { type: String, required: true },
  profesor: { type: String, required: true },
  calificaciones: { type: CalificacionSchema, default: () => ({}) }
}, { _id: false });

const CargaAcademicaSchema = new mongoose.Schema({
  periodo: { type: String, required: true },
  cuatrimestre: { type: String, required: true },
  materias: [MateriaSchema]
}, { _id: false });

const AlumnoSchema = new mongoose.Schema({
  estatus: { type: String, enum: ['ASPIRANTE', 'ALUMNO_ACTIVO'], default: 'ASPIRANTE' },
  matricula: { type: String, unique: true, sparse: true },
  nombre: { type: String, required: true },
  apellido_p: { type: String, required: true },
  apellido_m: { type: String, required: true },
  edad: { type: Number },
  peso: { type: Number },
  estatura: { type: Number },
  genero: { type: String },
  telefono: { type: String },
  correo: { type: String },
  direccion: {
    calle: String,
    colonia: String,
    no: Number,
    c_p: Number,
    municipio: String
  },
  academico: {
    carrera: String,
    grupo: String,
    cuatrimestre: String,
    periodo: String,
    tutor_grupo: String
  },
  cargas_academicas: [CargaAcademicaSchema]
}, { timestamps: true, collection: 'aspirantes' });

module.exports = mongoose.model('Alumno', AlumnoSchema, 'aspirantes');
