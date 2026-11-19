const express = require('express');
const router = express.Router();
const Alumno = require('../models/Alumno');

// Catálogo de carreras y tiras de materias automáticas
const CATALOGO_CARRERAS = {
  IRD: {
    nombre_completo: 'T.S.U. en Infraestructura de Redes Digitales',
    cuatrimestre: '4°',
    periodo_texto: '03 DE SEPTIEMBRE AL 18 DE DICIEMBRE',
    periodo_clave: '2026-3',
    materias: [
      { clave: 'ING-401', nombre: 'Inglés IV', profesor: 'Lic. María López' },
      { clave: 'ETH-402', nombre: 'Ética profesional', profesor: 'Lic. Jorge Ramírez' },
      { clave: 'MAT-403', nombre: 'Cálculo de varias variables', profesor: 'Ing. Carlos Pérez' },
      { clave: 'RED-404', nombre: 'Escalabilidad de redes', profesor: 'Ing. Roberto Gómez' },
      { clave: 'PRG-405', nombre: 'Programación de redes', profesor: 'Ing. Ana Martínez' },
      { clave: 'DAT-406', nombre: 'Centro de datos', profesor: 'M. en D. Arturo Hernández Jiménez' },
      { clave: 'INF-407', nombre: 'Infraestructura de redes de datos', profesor: 'M. en D. Arturo Hernández Jiménez' }
    ]
  },
  LITIID: {
    nombre_completo: 'Licenciatura en Ingeniería en Tecnologías de la Información e Innovación Digital',
    cuatrimestre: '7°',
    periodo_texto: '03 DE SEPTIEMBRE AL 18 DE DICIEMBRE',
    periodo_clave: '2026-3',
    materias: [
      { clave: 'ITI-701', nombre: 'Inglés VI', profesor: 'Lic. Patricia Mendoza' },
      { clave: 'ITI-702', nombre: 'Habilidades gerenciales', profesor: 'Mtra. Claudia Ríos' },
      { clave: 'ITI-703', nombre: 'Formulación de proyectos de tecnologías', profesor: 'Ing. Fernando Morales' },
      { clave: 'ITI-704', nombre: 'Fundamentos de inteligencia artificial', profesor: 'Dr. Alejandro Navarro' },
      { clave: 'ITI-705', nombre: 'Ética y legislación en tecnologías de la información', profesor: 'Lic. Jorge Ramírez' },
      { clave: 'ITI-706', nombre: 'Optativa I', profesor: 'Ing. Ana Martínez' },
      { clave: 'ITI-707', nombre: 'Seguridad informática', profesor: 'M. en D. Arturo Hernández Jiménez' }
    ]
  },
  IRIC: {
    nombre_completo: 'Ingeniería en Redes Inteligentes y Ciberseguridad',
    cuatrimestre: '10°',
    periodo_texto: '03 DE SEPTIEMBRE AL 18 DE DICIEMBRE',
    periodo_clave: '2026-3',
    materias: [
      { clave: 'IRC-1001', nombre: 'Automatización de infraestructura digital II', profesor: 'Ing. Roberto Gómez' },
      { clave: 'IRC-1002', nombre: 'Informática forense', profesor: 'M. en D. Arturo Hernández Jiménez' },
      { clave: 'IRC-1003', nombre: 'Administración de redes empresariales', profesor: 'Ing. Carlos Pérez' },
      { clave: 'IRC-1004', nombre: 'Integradora I', profesor: 'Mtra. Claudia Ríos' },
      { clave: 'IRC-1005', nombre: 'Inglés IX', profesor: 'Lic. María López' },
      { clave: 'IRC-1006', nombre: 'Negociación empresarial', profesor: 'Lic. Patricia Mendoza' }
    ]
  }
};

// 1. Obtener todos los registros
router.get('/', async (req, res) => {
  try {
    const alumnos = await Alumno.find();
    res.json(alumnos);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al consultar la base de datos', error });
  }
});

// 2. Consultar boleta por matrícula
router.get('/boleta/:matricula', async (req, res) => {
  try {
    const alumno = await Alumno.findOne({ matricula: req.params.matricula });
    if (!alumno) {
      return res.status(404).json({ mensaje: 'Alumno no encontrado con esa matrícula' });
    }
    res.json(alumno);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al consultar boleta', error });
  }
});

// 3. Registrar un nuevo aspirante
router.post('/aspirantes', async (req, res) => {
  try {
    const nuevoAspirante = new Alumno({
      ...req.body,
      estatus: 'ASPIRANTE'
    });
    const aspiranteGuardado = await nuevoAspirante.save();
    res.status(201).json({ mensaje: 'Aspirante registrado con éxito', alumno: aspiranteGuardado });
  } catch (error) {
    res.status(400).json({ mensaje: 'Error al registrar aspirante', error });
  }
});

// 4. Inscribir aspirante y asignar automáticamente su tira de materias por carrera
router.put('/:id/inscribir', async (req, res) => {
  try {
    const { matricula, claveCarrera, grupo, tutor_grupo } = req.body;
    const plan = CATALOGO_CARRERAS[claveCarrera];

    if (!plan) {
      return res.status(400).json({ mensaje: 'Carrera no válida en el catálogo' });
    }

    const materiasInicializadas = plan.materias.map((m) => ({
      clave: m.clave,
      nombre: m.nombre,
      profesor: m.profesor,
      calificaciones: {
        parcial_1: null,
        parcial_2: null,
        parcial_3: null,
        final: null
      }
    }));

    const alumnoInscrito = await Alumno.findByIdAndUpdate(
      req.params.id,
      {
        estatus: 'ALUMNO_ACTIVO',
        matricula,
        academico: {
          carrera: plan.nombre_completo,
          grupo,
          cuatrimestre: plan.cuatrimestre,
          periodo: plan.periodo_texto,
          tutor_grupo
        },
        cargas_academicas: [
          {
            periodo: plan.periodo_clave,
            cuatrimestre: plan.cuatrimestre,
            materias: materiasInicializadas
          }
        ]
      },
      { new: true }
    );

    if (!alumnoInscrito) {
      return res.status(404).json({ mensaje: 'Aspirante no encontrado' });
    }

    res.json({ mensaje: 'Alumno inscrito con carga académica asignada', alumno: alumnoInscrito });
  } catch (error) {
    res.status(400).json({ mensaje: 'Error al procesar inscripción', error });
  }
});

// 5. Actualizar calificación parcial
router.put('/calificaciones', async (req, res) => {
  try {
    const { matricula, claveMateria, numeroParcial, calificacion } = req.body;
    const alumno = await Alumno.findOne({ matricula });
    if (!alumno) {
      return res.status(404).json({ mensaje: 'Alumno no encontrado' });
    }

    const campoParcial = numeroParcial === 'final' ? 'final' : `parcial_${numeroParcial}`;
    let encontrada = false;

    alumno.cargas_academicas.forEach((carga) => {
      carga.materias.forEach((mat) => {
        if (mat.clave === claveMateria) {
          mat.calificaciones[campoParcial] = calificacion;
          encontrada = true;
        }
      });
    });

    if (!encontrada) {
      return res.status(404).json({ mensaje: 'Materia no encontrada' });
    }

    await alumno.save();
    res.json({ mensaje: `Parcial ${numeroParcial} actualizado correctamente` });
  } catch (error) {
    res.status(400).json({ mensaje: 'Error al actualizar calificación', error });
  }
});

// 6. Eliminar registro
router.delete('/:id', async (req, res) => {
  try {
    const eliminado = await Alumno.findByIdAndDelete(req.params.id);
    res.json({ mensaje: 'Registro eliminado con éxito', alumno: eliminado });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al eliminar', error });
  }
});

module.exports = router;