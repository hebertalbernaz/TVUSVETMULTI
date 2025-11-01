/**
 * TVUSVET Database Service - 100% Offline
 * Gerencia todo armazenamento local com localStorage
 */

class DatabaseService {
  constructor() {
    this.storage = window.localStorage;
    this.initialized = false;
  }

  // Inicializar banco de dados
  async init() {
    if (this.initialized) return;
    
    // Criar estruturas padrão se não existirem
    if (!this.storage.getItem('patients')) {
      this.storage.setItem('patients', JSON.stringify([]));
    }
    if (!this.storage.getItem('exams')) {
      this.storage.setItem('exams', JSON.stringify([]));
    }
    if (!this.storage.getItem('templates')) {
      this.initializeDefaultTemplates();
    }
    if (!this.storage.getItem('reference_values')) {
      this.initializeDefaultReferenceValues();
    }
    if (!this.storage.getItem('settings')) {
      this.storage.setItem('settings', JSON.stringify({
        id: 'global_settings',
        clinic_name: '',
        clinic_address: '',
        veterinarian_name: '',
        crmv: '',
        letterhead_path: null,
        letterhead_filename: null,
        letterhead_margins_mm: { top: 30, left: 15, right: 15, bottom: 20 },
        saved_backup_passphrase: null
      }));
    }
    
    this.initialized = true;
    console.log('✅ Database initialized (offline mode)');
  }

  // ============= PACIENTES =============
  
  async createPatient(patient) {
    const patients = this.getPatients();
    const newPatient = {
      ...patient,
      id: this.generateId(),
      created_at: new Date().toISOString()
    };
    patients.push(newPatient);
    this.storage.setItem('patients', JSON.stringify(patients));
    return newPatient;
  }

  getPatients() {
    return JSON.parse(this.storage.getItem('patients') || '[]');
  }

  async getPatient(id) {
    const patients = this.getPatients();
    return patients.find(p => p.id === id) || null;
  }

  async updatePatient(id, patientData) {
    const patients = this.getPatients();
    const index = patients.findIndex(p => p.id === id);
    if (index !== -1) {
      patients[index] = { ...patients[index], ...patientData };
      this.storage.setItem('patients', JSON.stringify(patients));
      return patients[index];
    }
    throw new Error('Patient not found');
  }

  async deletePatient(id) {
    let patients = this.getPatients();
    patients = patients.filter(p => p.id !== id);
    this.storage.setItem('patients', JSON.stringify(patients));
    
    // Deletar exames do paciente também
    let exams = this.getExams();
    exams = exams.filter(e => e.patient_id !== id);
    this.storage.setItem('exams', JSON.stringify(exams));
  }

  // ============= EXAMES =============
  
  async createExam(examData) {
    const exams = this.getExams();
    const newExam = {
      ...examData,
      id: this.generateId(),
      exam_type: examData.exam_type || 'ultrasound_abd', // Default to ultrasound abdominal
      exam_date: examData.exam_date || new Date().toISOString(),
      organs_data: examData.organs_data || [],
      images: examData.images || [],
      created_at: new Date().toISOString()
    };
    exams.push(newExam);
    this.storage.setItem('exams', JSON.stringify(exams));
    return newExam;
  }

  getExams(patientId = null) {
    const exams = JSON.parse(this.storage.getItem('exams') || '[]');
    if (patientId) {
      return exams.filter(e => e.patient_id === patientId)
        .sort((a, b) => new Date(b.exam_date) - new Date(a.exam_date));
    }
    return exams.sort((a, b) => new Date(b.exam_date) - new Date(a.exam_date));
  }

  async getExam(id) {
    const exams = this.getExams();
    return exams.find(e => e.id === id) || null;
  }

  async updateExam(id, examData) {
    const exams = this.getExams();
    const index = exams.findIndex(e => e.id === id);
    if (index !== -1) {
      exams[index] = { ...exams[index], ...examData };
      this.storage.setItem('exams', JSON.stringify(exams));
      return exams[index];
    }
    throw new Error('Exam not found');
  }

  async deleteExam(id) {
    let exams = this.getExams();
    exams = exams.filter(e => e.id !== id);
    this.storage.setItem('exams', JSON.stringify(exams));
  }

  // ============= TEMPLATES =============
  
  initializeDefaultTemplates() {
    const templates = [];
    let orderCounter = 0;
    
    // ========== ABDOMINAL ULTRASOUND TEMPLATES ==========
    const abdominalOrgans = [
      'Estômago', 'Fígado', 'Baço', 'Rim Esquerdo', 'Rim Direito',
      'Vesícula Urinária', 'Adrenal Esquerda', 'Adrenal Direita',
      'Duodeno', 'Jejuno', 'Cólon', 'Ceco', 'Íleo', 'Linfonodos',
      'Próstata', 'Corpo Uterino', 'Ovário Direito', 'Ovário Esquerdo'
    ];
    
    abdominalOrgans.forEach((organ) => {
      templates.push(
        {
          id: this.generateId(),
          organ,
          category: 'normal',
          title: 'Achado Normal',
          text: `${organ} com dimensões, contornos, ecogenicidade e ecotextura preservados.`,
          order: orderCounter++
        },
        {
          id: this.generateId(),
          organ,
          category: 'finding',
          title: 'Alteração de Ecogenicidade',
          text: `${organ} apresenta alteração de ecogenicidade, **sugestivo de** processo inflamatório.`,
          order: orderCounter++
        },
        {
          id: this.generateId(),
          organ,
          category: 'finding',
          title: 'Aumento de Dimensões',
          text: `${organ} com aumento de dimensões, medindo {MEDIDA}.`,
          order: orderCounter++
        }
      );
    });
    
    // ========== ECHOCARDIOGRAM TEMPLATES ==========
    
    // Análise 2D (Modo-B)
    templates.push(
      {
        id: this.generateId(),
        organ: 'Análise 2D (Modo-B)',
        category: 'normal',
        title: 'Análise Morfológica Normal',
        text: 'Análise morfológica das cavidades cardíacas e valvas atrioventriculares e semilunares *sem alterações* significativas. Contratilidade ventricular preservada.',
        order: orderCounter++
      },
      {
        id: this.generateId(),
        organ: 'Análise 2D (Modo-B)',
        category: 'finding',
        title: 'Hipertrofia Ventricular',
        text: 'Observa-se **hipertrofia concêntrica** do ventrículo esquerdo, com espessamento de parede livre e septo interventricular.',
        order: orderCounter++
      },
      {
        id: this.generateId(),
        organ: 'Análise 2D (Modo-B)',
        category: 'finding',
        title: 'Dilatação Atrial',
        text: 'Átrio esquerdo com **dilatação moderada**, relação AE/Ao aumentada. *Sugestivo de* sobrecarga de volume.',
        order: orderCounter++
      }
    );
    
    // Ventrículo Esquerdo (Modo-M)
    templates.push(
      {
        id: this.generateId(),
        organ: 'Ventrículo Esquerdo (Modo-M)',
        category: 'normal',
        title: 'Dimensões e Função Normais',
        text: 'Ventrículo esquerdo com dimensões e espessura de paredes dentro dos limites da normalidade. Fração de ejeção (FE) e fração de encurtamento (FS) preservadas.',
        order: orderCounter++
      },
      {
        id: this.generateId(),
        organ: 'Ventrículo Esquerdo (Modo-M)',
        category: 'finding',
        title: 'Disfunção Sistólica',
        text: 'Ventrículo esquerdo com **dilatação** e **redução da função sistólica**. FE: {MEDIDA}% (reduzida). FS: {MEDIDA}% (reduzida). *Compatível com* cardiomiopatia dilatada.',
        order: orderCounter++
      },
      {
        id: this.generateId(),
        organ: 'Ventrículo Esquerdo (Modo-M)',
        category: 'finding',
        title: 'Hipertrofia Concêntrica',
        text: 'Ventrículo esquerdo com **hipertrofia concêntrica**, espessamento do SIV e PPVE. Cavidade ventricular com dimensões normais ou reduzidas. *Sugestivo de* cardiomiopatia hipertrófica.',
        order: orderCounter++
      }
    );
    
    // Relação Aorta/Átrio Esquerdo
    templates.push(
      {
        id: this.generateId(),
        organ: 'Relação Aorta/Átrio Esquerdo (Modo-M)',
        category: 'normal',
        title: 'Relação AE/Ao Normal',
        text: 'Relação átrio esquerdo/aorta (AE/Ao) dentro dos limites da normalidade para a espécie.',
        order: orderCounter++
      },
      {
        id: this.generateId(),
        organ: 'Relação Aorta/Átrio Esquerdo (Modo-M)',
        category: 'finding',
        title: 'Aumento da Relação AE/Ao',
        text: 'Relação AE/Ao **aumentada** ({MEDIDA}), indicando dilatação atrial esquerda. *Compatível com* sobrecarga de volume ou insuficiência mitral.',
        order: orderCounter++
      }
    );
    
    // Doppler Valvas
    const valvas = [
      { name: 'Análise Doppler (Valva Mitral)', 
        normal: 'Fluxo transmitral com padrão de ondas E e A preservado. Relação E/A normal para a espécie. Ausência de regurgitação significativa.',
        disease: 'Regurgitação mitral **moderada a severa** ao Doppler colorido. Espessamento e degeneração dos folhetos valvares. *Compatível com* degeneração mixomatosa.' },
      { name: 'Análise Doppler (Valva Aórtica)',
        normal: 'Fluxo aórtico com velocidade e gradiente de pressão dentro dos limites da normalidade. Ausência de estenose ou regurgitação.',
        disease: 'Estenose aórtica detectada. Velocidade máxima: {MEDIDA} cm/s (aumentada). Gradiente de pressão: {MEDIDA} mmHg (elevado).' },
      { name: 'Análise Doppler (Valva Pulmonar)',
        normal: 'Fluxo pulmonar com padrão e velocidade normais. Ausência de estenose ou regurgitação significativa.',
        disease: 'Estenose pulmonar. Velocidade máxima: {MEDIDA} cm/s. Gradiente de pressão: {MEDIDA} mmHg.' },
      { name: 'Análise Doppler (Valva Tricúspide)',
        normal: 'Fluxo tricúspide com padrão normal. Ausência de regurgitação significativa.',
        disease: 'Regurgitação tricúspide presente. Estimativa de pressão sistólica do ventrículo direito (PSVD): {MEDIDA} mmHg. *Sugestivo de* hipertensão pulmonar.' }
    ];
    
    valvas.forEach((valva) => {
      templates.push(
        {
          id: this.generateId(),
          organ: valva.name,
          category: 'normal',
          title: 'Análise Doppler Normal',
          text: valva.normal,
          order: orderCounter++
        },
        {
          id: this.generateId(),
          organ: valva.name,
          category: 'finding',
          title: 'Alteração Valvar',
          text: valva.disease,
          order: orderCounter++
        }
      );
    });
    
    // Conclusão Ecocardiográfica
    templates.push(
      {
        id: this.generateId(),
        organ: 'Conclusão Ecocardiográfica',
        category: 'normal',
        title: 'Estudo Ecocardiográfico Normal',
        text: 'Estudo ecocardiográfico transtorácico bidimensional com Doppler *sem alterações* significativas. Função sistólica e diastólica preservadas.',
        order: orderCounter++
      },
      {
        id: this.generateId(),
        organ: 'Conclusão Ecocardiográfica',
        category: 'finding',
        title: 'Doença Valvar Degenerativa',
        text: '**Doença Valvar Degenerativa Mixomatosa** (DVDM) de valva mitral, com regurgitação moderada a severa e dilatação atrial esquerda secundária. Indicação de acompanhamento cardiológico e terapia medicamentosa.',
        order: orderCounter++
      },
      {
        id: this.generateId(),
        organ: 'Conclusão Ecocardiográfica',
        category: 'finding',
        title: 'Cardiomiopatia Dilatada',
        text: '**Cardiomiopatia Dilatada** (CMD) com disfunção sistólica severa, dilatação de câmaras esquerdas e redução acentuada da fração de ejeção. Prognóstico reservado. Indicação de terapia intensiva e reavaliação periódica.',
        order: orderCounter++
      }
    );
    
    // ========== ELECTROCARDIOGRAM TEMPLATES ==========
    
    // Ritmo e Frequência
    templates.push(
      {
        id: this.generateId(),
        organ: 'Ritmo e Frequência',
        category: 'normal',
        title: 'Ritmo Sinusal Normal',
        text: 'Ritmo sinusal regular. Frequência cardíaca: {MEDIDA} bpm. *Dentro dos limites da normalidade* para a espécie.',
        order: orderCounter++
      },
      {
        id: this.generateId(),
        organ: 'Ritmo e Frequência',
        category: 'finding',
        title: 'Arritmia Sinusal Respiratória',
        text: 'Arritmia sinusal respiratória, com variação da frequência cardíaca durante os ciclos respiratórios. Achado **fisiológico** em cães. Frequência média: {MEDIDA} bpm.',
        order: orderCounter++
      },
      {
        id: this.generateId(),
        organ: 'Ritmo e Frequência',
        category: 'finding',
        title: 'Taquicardia Sinusal',
        text: 'Taquicardia sinusal. Frequência cardíaca: {MEDIDA} bpm (elevada). *Pode ser secundária a* estresse, dor, febre ou cardiopatia.',
        order: orderCounter++
      },
      {
        id: this.generateId(),
        organ: 'Ritmo e Frequência',
        category: 'finding',
        title: 'Bradicardia Sinusal',
        text: 'Bradicardia sinusal. Frequência cardíaca: {MEDIDA} bpm (reduzida). Investigar causas metabólicas ou medicamentosas.',
        order: orderCounter++
      }
    );
    
    // Medições ECG
    templates.push(
      {
        id: this.generateId(),
        organ: 'Medições (Ondas e Intervalos)',
        category: 'normal',
        title: 'Medições Dentro da Normalidade',
        text: 'Onda P, complexo QRS, intervalos PR e QT dentro dos limites da normalidade para a espécie.',
        order: orderCounter++
      },
      {
        id: this.generateId(),
        organ: 'Medições (Ondas e Intervalos)',
        category: 'finding',
        title: 'Aumento de Onda P',
        text: 'Onda P **aumentada** em duração e/ou amplitude. *Sugestivo de* sobrecarga atrial (P-pulmonale ou P-mitrale).',
        order: orderCounter++
      },
      {
        id: this.generateId(),
        organ: 'Medições (Ondas e Intervalos)',
        category: 'finding',
        title: 'Alargamento de QRS',
        text: 'Complexo QRS **alargado** ({MEDIDA} ms). *Compatível com* distúrbio de condução intraventricular ou bloqueio de ramo.',
        order: orderCounter++
      }
    );
    
    // Conclusão ECG
    templates.push(
      {
        id: this.generateId(),
        organ: 'Conclusão Ritmológica',
        category: 'normal',
        title: 'Eletrocardiograma Normal',
        text: 'Eletrocardiograma *sem alterações* significativas. Ritmo sinusal regular, frequência cardíaca adequada, ondas e intervalos dentro dos limites da normalidade.',
        order: orderCounter++
      },
      {
        id: this.generateId(),
        organ: 'Conclusão Ritmológica',
        category: 'finding',
        title: 'Complexos Ventriculares Prematuros',
        text: 'Presença de **Complexos Ventriculares Prematuros** (CVPs) isolados. Recomenda-se investigação de causa subjacente e acompanhamento.',
        order: orderCounter++
      },
      {
        id: this.generateId(),
        organ: 'Conclusão Ritmológica',
        category: 'finding',
        title: 'Bloqueio Atrioventricular',
        text: '**Bloqueio Atrioventricular de 1º grau**. Intervalo PR prolongado ({MEDIDA} ms). Monitoramento recomendado.',
        order: orderCounter++
      },
      {
        id: this.generateId(),
        organ: 'Conclusão Ritmológica',
        category: 'finding',
        title: 'Fibrilação Atrial',
        text: '**Fibrilação Atrial** detectada. Ausência de ondas P, ritmo irregularmente irregular. Indicação de terapia antiarrítmica e anticoagulante.',
        order: orderCounter++
      }
    );
    
    // ========== RADIOGRAPHY TEMPLATES ==========
    
    // Campos Pulmonares
    templates.push(
      {
        id: this.generateId(),
        organ: 'Tórax - Campos Pulmonares',
        category: 'normal',
        title: 'Campos Pulmonares Normais',
        text: 'Campos pulmonares com radiotransparência preservada, padrão intersticial e vascular dentro da normalidade. Ausência de massas, nódulos ou consolidações.',
        order: orderCounter++
      },
      {
        id: this.generateId(),
        organ: 'Tórax - Campos Pulmonares',
        category: 'finding',
        title: 'Padrão Bronco-Intersticial',
        text: 'Padrão **bronco-intersticial difuso** em campos pulmonares. *Compatível com* bronquite crônica ou pneumonite.',
        order: orderCounter++
      },
      {
        id: this.generateId(),
        organ: 'Tórax - Campos Pulmonares',
        category: 'finding',
        title: 'Nódulo Pulmonar',
        text: 'Imagem nodular circunscrita em campo pulmonar, medindo aproximadamente {MEDIDA}. Diagnósticos diferenciais: neoplasia, granuloma, abscesso. Recomenda-se investigação complementar.',
        order: orderCounter++
      },
      {
        id: this.generateId(),
        organ: 'Tórax - Campos Pulmonares',
        category: 'finding',
        title: 'Edema Pulmonar',
        text: 'Padrão **alveolar difuso** em região perihilar, *sugestivo de* edema pulmonar cardiogênico.',
        order: orderCounter++
      }
    );
    
    // Silhueta Cardíaca
    templates.push(
      {
        id: this.generateId(),
        organ: 'Tórax - Silhueta Cardíaca',
        category: 'normal',
        title: 'Silhueta Cardíaca Normal',
        text: 'Silhueta cardíaca com dimensões e contornos preservados. VHS (Vertebral Heart Score) dentro dos limites da normalidade.',
        order: orderCounter++
      },
      {
        id: this.generateId(),
        organ: 'Tórax - Silhueta Cardíaca',
        category: 'finding',
        title: 'Cardiomegalia',
        text: '**Cardiomegalia** detectada. VHS: {MEDIDA}v (aumentado). Aumento predominante de câmaras esquerdas. *Compatível com* doença valvar ou cardiomiopatia.',
        order: orderCounter++
      },
      {
        id: this.generateId(),
        organ: 'Tórax - Silhueta Cardíaca',
        category: 'finding',
        title: 'Aumento Atrial Esquerdo',
        text: 'Aumento de átrio esquerdo, com elevação de brônquio principal esquerdo e abaulamento de borda cardíaca às 2-3 horas (projeção VD). *Sugestivo de* doença valvar mitral.',
        order: orderCounter++
      }
    );
    
    // Abdômen
    templates.push(
      {
        id: this.generateId(),
        organ: 'Abdômen - Serosas e Fígado',
        category: 'normal',
        title: 'Cavidade Abdominal Normal',
        text: 'Cavidade abdominal com contraste de serosas preservado. Fígado com dimensões e radiopacidade normais.',
        order: orderCounter++
      },
      {
        id: this.generateId(),
        organ: 'Abdômen - Serosas e Fígado',
        category: 'finding',
        title: 'Efusão Abdominal',
        text: 'Perda de definição de serosas abdominais, *sugestivo de* **efusão abdominal** (ascite). Recomenda-se abdominocentese para análise do líquido.',
        order: orderCounter++
      },
      {
        id: this.generateId(),
        organ: 'Abdômen - Serosas e Fígado',
        category: 'finding',
        title: 'Hepatomegalia',
        text: '**Hepatomegalia** radiográfica, com deslocamento caudal do estômago. Investigar causas metabólicas, congestivas ou neoplásicas.',
        order: orderCounter++
      }
    );
    
    // Sistema Musculoesquelético
    templates.push(
      {
        id: this.generateId(),
        organ: 'Sistema Musculoesquelético',
        category: 'normal',
        title: 'Estruturas Ósseas Normais',
        text: 'Estruturas ósseas com densidade, alinhamento e contornos preservados. Ausência de fraturas, luxações ou lesões líticas/blásticas.',
        order: orderCounter++
      },
      {
        id: this.generateId(),
        organ: 'Sistema Musculoesquelético',
        category: 'finding',
        title: 'Osteoartrose',
        text: 'Sinais de **osteoartrose** em articulação, com formação de osteófitos, esclerose subcondral e redução do espaço articular.',
        order: orderCounter++
      },
      {
        id: this.generateId(),
        organ: 'Sistema Musculoesquelético',
        category: 'finding',
        title: 'Fratura',
        text: 'Solução de continuidade em diáfise óssea, *compatível com* **fratura**. Recomenda-se avaliação ortopédica.',
        order: orderCounter++
      }
    );
    
    // Conclusão Radiográfica
    templates.push(
      {
        id: this.generateId(),
        organ: 'Conclusão Radiográfica',
        category: 'normal',
        title: 'Estudo Radiográfico Normal',
        text: 'Estudo radiográfico *sem alterações* significativas. Estruturas avaliadas dentro dos limites da normalidade.',
        order: orderCounter++
      }
    );
    
    // ========== TOMOGRAPHY TEMPLATES ==========
    
    templates.push(
      {
        id: this.generateId(),
        organ: 'Informações do Estudo',
        category: 'normal',
        title: 'Protocolo de Estudo',
        text: 'Estudo tomográfico de [região] realizado em planos axiais, com cortes de [espessura]mm. Fase [pré/pós-contraste].',
        order: orderCounter++
      },
      {
        id: this.generateId(),
        organ: 'Achados - Parênquima Pulmonar',
        category: 'normal',
        title: 'Parênquima Pulmonar Normal',
        text: 'Parênquima pulmonar com atenuação preservada, sem nódulos, massas ou consolidações. Árvore traqueobrônquica pérvea.',
        order: orderCounter++
      },
      {
        id: this.generateId(),
        organ: 'Achados - Parênquima Pulmonar',
        category: 'finding',
        title: 'Nódulo Pulmonar',
        text: 'Formação nodular em lobo pulmonar, medindo {MEDIDA}, com atenuação de aproximadamente {MEDIDA} HU. Diagnósticos diferenciais: neoplasia primária ou metastática, granuloma.',
        order: orderCounter++
      },
      {
        id: this.generateId(),
        organ: 'Achados - Mediastino',
        category: 'finding',
        title: 'Linfonodopatia Mediastinal',
        text: 'Linfonodos mediastinais **aumentados**, com dimensões superiores aos valores de referência. *Sugestivo de* processo inflamatório ou neoplásico.',
        order: orderCounter++
      },
      {
        id: this.generateId(),
        organ: 'Conclusão Tomográfica',
        category: 'normal',
        title: 'Estudo Tomográfico Normal',
        text: 'Estudo tomográfico *sem alterações* significativas nas estruturas avaliadas.',
        order: orderCounter++
      },
      {
        id: this.generateId(),
        organ: 'Conclusão Tomográfica',
        category: 'finding',
        title: 'Processo Neoplásico',
        text: 'Achados tomográficos **compatíveis com** processo neoplásico. Recomenda-se biópsia para diagnóstico histopatológico definitivo e estadiamento complementar.',
        order: orderCounter++
      }
    );
    
    this.storage.setItem('templates', JSON.stringify(templates));
  }

  getTemplates(organ = null) {
    const templates = JSON.parse(this.storage.getItem('templates') || '[]');
    if (organ) {
      return templates.filter(t => t.organ === organ).sort((a, b) => a.order - b.order);
    }
    return templates.sort((a, b) => a.order - b.order);
  }

  async createTemplate(templateData) {
    const templates = this.getTemplates();
    const newTemplate = {
      ...templateData,
      id: this.generateId()
    };
    templates.push(newTemplate);
    this.storage.setItem('templates', JSON.stringify(templates));
    return newTemplate;
  }

  async updateTemplate(id, templateData) {
    const templates = this.getTemplates();
    const index = templates.findIndex(t => t.id === id);
    if (index !== -1) {
      templates[index] = { ...templates[index], ...templateData };
      this.storage.setItem('templates', JSON.stringify(templates));
      return templates[index];
    }
    throw new Error('Template not found');
  }

  async deleteTemplate(id) {
    let templates = this.getTemplates();
    templates = templates.filter(t => t.id !== id);
    this.storage.setItem('templates', JSON.stringify(templates));
  }

  // ============= VALORES DE REFERÊNCIA =============
  
  initializeDefaultReferenceValues() {
    const refValues = [
      // Rins
      { organ: 'Rim Esquerdo', measurement_type: 'comprimento', species: 'dog', size: 'small', min_value: 3.5, max_value: 5.5, unit: 'cm' },
      { organ: 'Rim Esquerdo', measurement_type: 'comprimento', species: 'dog', size: 'medium', min_value: 5.0, max_value: 7.0, unit: 'cm' },
      { organ: 'Rim Esquerdo', measurement_type: 'comprimento', species: 'dog', size: 'large', min_value: 6.5, max_value: 9.0, unit: 'cm' },
      { organ: 'Rim Direito', measurement_type: 'comprimento', species: 'dog', size: 'small', min_value: 3.5, max_value: 5.5, unit: 'cm' },
      { organ: 'Rim Direito', measurement_type: 'comprimento', species: 'dog', size: 'medium', min_value: 5.0, max_value: 7.0, unit: 'cm' },
      { organ: 'Rim Direito', measurement_type: 'comprimento', species: 'dog', size: 'large', min_value: 6.5, max_value: 9.0, unit: 'cm' },
      // Fígado
      { organ: 'Fígado', measurement_type: 'espessura', species: 'dog', size: 'small', min_value: 2.0, max_value: 4.0, unit: 'cm' },
      { organ: 'Fígado', measurement_type: 'espessura', species: 'dog', size: 'medium', min_value: 3.0, max_value: 5.5, unit: 'cm' },
      { organ: 'Fígado', measurement_type: 'espessura', species: 'dog', size: 'large', min_value: 4.0, max_value: 7.0, unit: 'cm' },
      // Baço
      { organ: 'Baço', measurement_type: 'espessura', species: 'dog', size: 'small', min_value: 0.5, max_value: 1.5, unit: 'cm' },
      { organ: 'Baço', measurement_type: 'espessura', species: 'dog', size: 'medium', min_value: 1.0, max_value: 2.0, unit: 'cm' },
      { organ: 'Baço', measurement_type: 'espessura', species: 'dog', size: 'large', min_value: 1.5, max_value: 2.5, unit: 'cm' }
    ];
    
    const withIds = refValues.map(rv => ({ ...rv, id: this.generateId() }));
    this.storage.setItem('reference_values', JSON.stringify(withIds));
  }

  getReferenceValues(filters = {}) {
    const values = JSON.parse(this.storage.getItem('reference_values') || '[]');
    let filtered = values;
    
    if (filters.organ) {
      filtered = filtered.filter(v => v.organ === filters.organ);
    }
    if (filters.species) {
      filtered = filtered.filter(v => v.species === filters.species);
    }
    if (filters.size) {
      filtered = filtered.filter(v => v.size === filters.size);
    }
    
    return filtered;
  }

  async createReferenceValue(valueData) {
    const values = this.getReferenceValues();
    const newValue = {
      ...valueData,
      id: this.generateId()
    };
    values.push(newValue);
    this.storage.setItem('reference_values', JSON.stringify(values));
    return newValue;
  }

  async updateReferenceValue(id, valueData) {
    const values = this.getReferenceValues();
    const index = values.findIndex(v => v.id === id);
    if (index !== -1) {
      values[index] = { ...values[index], ...valueData };
      this.storage.setItem('reference_values', JSON.stringify(values));
      return values[index];
    }
    throw new Error('Reference value not found');
  }

  async deleteReferenceValue(id) {
    let values = this.getReferenceValues();
    values = values.filter(v => v.id !== id);
    this.storage.setItem('reference_values', JSON.stringify(values));
  }

  // ============= CONFIGURAÇÕES =============
  
  getSettings() {
    return JSON.parse(this.storage.getItem('settings') || '{}');
  }

  async updateSettings(settingsData) {
    const current = this.getSettings();
    const updated = { ...current, ...settingsData };
    this.storage.setItem('settings', JSON.stringify(updated));
    return updated;
  }

  // ============= IMAGENS =============
  
  async saveImage(examId, imageData) {
    const exam = await this.getExam(examId);
    if (!exam) throw new Error('Exam not found');
    
    const imageId = this.generateId();
    const image = {
      id: imageId,
      filename: imageData.filename,
      data: imageData.data, // Base64
      organ: imageData.organ || null
    };
    
    exam.images = exam.images || [];
    exam.images.push(image);
    await this.updateExam(examId, exam);
    
    return image;
  }

  async deleteImage(examId, imageId) {
    const exam = await this.getExam(examId);
    if (!exam) throw new Error('Exam not found');
    
    exam.images = (exam.images || []).filter(img => img.id !== imageId);
    await this.updateExam(examId, exam);
  }

  // ============= BACKUP/RESTORE =============
  
  exportBackup() {
    const data = {
      patients: this.getPatients(),
      exams: this.getExams(),
      templates: this.getTemplates(),
      reference_values: this.getReferenceValues(),
      settings: this.getSettings(),
      exported_at: new Date().toISOString(),
      version: '1.0.0'
    };
    
    return JSON.stringify(data, null, 2);
  }

  importBackup(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      
      if (data.patients) this.storage.setItem('patients', JSON.stringify(data.patients));
      if (data.exams) this.storage.setItem('exams', JSON.stringify(data.exams));
      if (data.templates) this.storage.setItem('templates', JSON.stringify(data.templates));
      if (data.reference_values) this.storage.setItem('reference_values', JSON.stringify(data.reference_values));
      if (data.settings) this.storage.setItem('settings', JSON.stringify(data.settings));
      
      return true;
    } catch (error) {
      console.error('Import error:', error);
      return false;
    }
  }

  clearAll() {
    this.storage.removeItem('patients');
    this.storage.removeItem('exams');
    this.storage.removeItem('templates');
    this.storage.removeItem('reference_values');
    this.storage.removeItem('settings');
    this.initialized = false;
  }

  // ============= UTILS =============
  
  generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton instance
export const db = new DatabaseService();
