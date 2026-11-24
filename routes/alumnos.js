const express = require('express');
const router = express.Router();
const Alumno = require('../models/Alumno');

const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'utfv2026';

const CATALOGO_CARRERAS = {
  IRD: {
    nombre_completo: 'T.S.U. en Infraestructura de Redes Digitales',
    cuatrimestre: '4°',
    tutor_grupo: 'M. en D. Arturo Hernández Jiménez',
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
    tutor_grupo: 'Mtra. Claudia Elena Ríos Mendoza',
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
    tutor_grupo: 'Ing. Roberto Carlos Domínguez Navarro',
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

function parseNum(val) {
  return val === '' || val === null || val === undefined || isNaN(Number(val))
    ? null
    : Number(val);
}

function actualizarKardexAlumno(alumno) {
  const carga = alumno.cargas_academicas?.[0];
  if (!carga) return;

  const materiasKardex = carga.materias.map((m) => {
    const p1 = m.calificaciones?.parcial_1 ?? null;
    const p2 = m.calificaciones?.parcial_2 ?? null;
    const p3 = m.calificaciones?.parcial_3 ?? null;
    const calEgo = m.calificaciones?.calificacion_ego ?? null;
    const finalVal = m.calificaciones?.final ?? null;
    const fueAEgo =
      Boolean(m.calificaciones?.ego) || calEgo !== null || (finalVal !== null && finalVal < 7.0);

    let estatusMat = 'PENDIENTE';
    if (finalVal !== null) {
      if (Number(finalVal) >= 7.0) {
        estatusMat = fueAEgo ? 'ACREDITADA (EGO)' : 'ACREDITADA';
      } else {
        estatusMat = 'EN EGO / NO ACREDITADA';
      }
    } else if (fueAEgo) {
      estatusMat = 'PENDIENTE EGO';
    }

    return {
      clave: m.clave,
      nombre: m.nombre,
      profesor: m.profesor,
      parcial_1: p1,
      parcial_2: p2,
      parcial_3: p3,
      calificacion_ego: calEgo,
      final: finalVal,
      ego: fueAEgo,
      estatus_materia: estatusMat
    };
  });

  const calificadas = materiasKardex.filter((m) => m.final !== null && !isNaN(m.final));
  const promedio =
    calificadas.length > 0
      ? Number(
          (
            calificadas.reduce((acc, item) => acc + Number(item.final), 0) /
            calificadas.length
          ).toFixed(2)
        )
      : 0;

  const registroKardex = {
    periodo: alumno.academico?.periodo || carga.periodo,
    cuatrimestre: alumno.academico?.cuatrimestre || carga.cuatrimestre,
    carrera: alumno.academico?.carrera || '',
    grupo: alumno.academico?.grupo || '',
    promedio_cuatrimestre: promedio,
    fecha_registro: new Date(),
    materias: materiasKardex
  };

  if (!Array.isArray(alumno.kardex)) {
    alumno.kardex = [];
  }

  const idx = alumno.kardex.findIndex(
    (k) => k.cuatrimestre === registroKardex.cuatrimestre && k.periodo === registroKardex.periodo
  );

  if (idx >= 0) {
    alumno.kardex[idx] = registroKardex;
  } else {
    alumno.kardex.push(registroKardex);
  }
}

// 0. Inicio de sesión Administrador
router.post('/login', (req, res) => {
  const { usuario, password } = req.body;
  if (usuario === ADMIN_USER && password === ADMIN_PASS) {
    return res.json({
      autenticado: true,
      nombre: 'Administrador Control Escolar UTFV'
    });
  }
  return res.status(401).json({ mensaje: 'Usuario o contraseña incorrectos' });
});

// 1. Obtener todos los registros
router.get('/', async (req, res) => {
  try {
    const alumnos = await Alumno.find();
    res.json(alumnos);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al consultar la base de datos', error });
  }
});

// 2. Consultar boleta / kardex por matrícula
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

// 4. Inscribir aspirante y asignar carga académica y tutor
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
        calificacion_ego: null,
        final: null,
        ego: false
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
          tutor_grupo: tutor_grupo || plan.tutor_grupo
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

    actualizarKardexAlumno(alumnoInscrito);
    await alumnoInscrito.save();

    res.json({ mensaje: 'Alumno inscrito con carga académica asignada', alumno: alumnoInscrito });
  } catch (error) {
    res.status(400).json({ mensaje: 'Error al procesar inscripción', error });
  }
});

// 5A. Guardar TODAS las calificaciones de un alumno (Boleta individual) + Calif. EGO + Kardex
router.put('/calificaciones-masivo', async (req, res) => {
  try {
    const { matricula, notas } = req.body;
    const alumno = await Alumno.findOne({ matricula });
    if (!alumno) {
      return res.status(404).json({ mensaje: 'Alumno no encontrado' });
    }

    alumno.cargas_academicas.forEach((carga) => {
      carga.materias.forEach((mat) => {
        const nuevaNota = notas[mat.clave];
        if (nuevaNota) {
          const p1 = parseNum(nuevaNota.parcial_1);
          const p2 = parseNum(nuevaNota.parcial_2);
          const p3 = parseNum(nuevaNota.parcial_3);
          const calEgo = parseNum(nuevaNota.calificacion_ego);
          const finalNum = parseNum(nuevaNota.final);

          mat.calificaciones.parcial_1 = p1;
          mat.calificaciones.parcial_2 = p2;
          mat.calificaciones.parcial_3 = p3;
          mat.calificaciones.calificacion_ego = calEgo;
          mat.calificaciones.final = finalNum;
          mat.calificaciones.ego =
            Boolean(nuevaNota.ego) || calEgo !== null || (finalNum !== null && finalNum < 7.0);
        }
      });
    });

    actualizarKardexAlumno(alumno);
    await alumno.save();

    res.json({
      mensaje: 'Calificaciones y Kardex guardados correctamente',
      alumno
    });
  } catch (error) {
    res.status(400).json({ mensaje: 'Error al guardar calificaciones', error });
  }
});

// 5B. Guardar calificaciones de forma GRUPAL para toda una materia
router.put('/calificaciones-grupo', async (req, res) => {
  try {
    const { grupo, claveMateria, registros } = req.body;
    if (!grupo || !claveMateria || !registros) {
      return res.status(400).json({ mensaje: 'Faltan datos del grupo o materia' });
    }

    const alumnosGrupo = await Alumno.find({
      estatus: 'ALUMNO_ACTIVO',
      'academico.grupo': grupo
    });

    let actualizados = 0;

    for (const alumno of alumnosGrupo) {
      const notaAlumno = registros[alumno.matricula];
      if (!notaAlumno) continue;

      let modificado = false;
      alumno.cargas_academicas.forEach((carga) => {
        carga.materias.forEach((mat) => {
          if (mat.clave === claveMateria) {
            const p1 = parseNum(notaAlumno.parcial_1);
            const p2 = parseNum(notaAlumno.parcial_2);
            const p3 = parseNum(notaAlumno.parcial_3);
            const calEgo = parseNum(notaAlumno.calificacion_ego);
            const finalNum = parseNum(notaAlumno.final);

            mat.calificaciones.parcial_1 = p1;
            mat.calificaciones.parcial_2 = p2;
            mat.calificaciones.parcial_3 = p3;
            mat.calificaciones.calificacion_ego = calEgo;
            mat.calificaciones.final = finalNum;
            mat.calificaciones.ego =
              Boolean(notaAlumno.ego) || calEgo !== null || (finalNum !== null && finalNum < 7.0);
            modificado = true;
          }
        });
      });

      if (modificado) {
        actualizarKardexAlumno(alumno);
        await alumno.save();
        actualizados++;
      }
    }

    res.json({
      mensaje: `Calificaciones grupales guardadas para ${actualizados} alumno(s) del grupo ${grupo}`,
      actualizados
    });
  } catch (error) {
    res.status(400).json({ mensaje: 'Error al guardar calificaciones del grupo', error });
  }
});

// 5C. Guardar / Consolidar registro en Kardex manualmente
router.post('/kardex/:matricula', async (req, res) => {
  try {
    const alumno = await Alumno.findOne({ matricula: req.params.matricula });
    if (!alumno) {
      return res.status(404).json({ mensaje: 'Alumno no encontrado' });
    }
    actualizarKardexAlumno(alumno);
    await alumno.save();
    res.json({ mensaje: 'Historial académico actualizado en el Kardex', alumno });
  } catch (error) {
    res.status(400).json({ mensaje: 'Error al guardar en Kardex', error });
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