import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import '@/App.css';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertCircle, Plus, Search, FileText, Settings, Download, Image as ImageIcon, Trash2, Edit, Save, X, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ORGANS = [
  'Estômago', 'Fígado', 'Baço', 'Rim Esquerdo', 'Rim Direito',
  'Vesícula Urinária', 'Adrenal Esquerda', 'Adrenal Direita',
  'Duodeno', 'Jejuno', 'Cólon', 'Ceco', 'Íleo', 'Linfonodos'
];

const REPRODUCTIVE_ORGANS_MALE = ['Próstata', 'Testículo Direito', 'Testículo Esquerdo'];
const REPRODUCTIVE_ORGANS_MALE_NEUTERED = ['Próstata']; // Cão castrado ainda tem próstata
const REPRODUCTIVE_ORGANS_FEMALE = ['Corpo Uterino', 'Corno Uterino Direito', 'Corno Uterino Esquerdo', 'Ovário Direito', 'Ovário Esquerdo'];

function HomePage() {
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewPatient, setShowNewPatient] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [licenseStatus, setLicenseStatus] = useState(null);
  const [showLicenseModal, setShowLicenseModal] = useState(false);
  const [licenseCode, setLicenseCode] = useState('');
  const [activating, setActivating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkLicense();
    loadPatients();
    initializeDefaults();
  }, []);

  const checkLicense = async () => {
    try {
      const response = await axios.get(`${API}/license/status`);
      setLicenseStatus(response.data);
      
      if (response.data.needs_activation) {
        setShowLicenseModal(true);
      }
    } catch (error) {
      console.error('Erro ao verificar licença:', error);
    }
  };

  const activateLicense = async () => {
    if (!licenseCode.trim()) {
      toast.error('Por favor, insira um código de licença');
      return;
    }

    setActivating(true);
    try {
      await axios.post(`${API}/license/activate?code=${encodeURIComponent(licenseCode)}`);
      toast.success('Licença ativada com sucesso!');
      setShowLicenseModal(false);
      setLicenseCode('');
      await checkLicense();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Código inválido ou já utilizado');
    } finally {
      setActivating(false);
    }
  };

  const initializeDefaults = async () => {
    try {
      await axios.post(`${API}/initialize-defaults`);
    } catch (error) {
      console.error('Error initializing defaults:', error);
    }
  };

  const loadPatients = async () => {
    try {
      const response = await axios.get(`${API}/patients`);
      setPatients(response.data);
    } catch (error) {
      toast.error('Erro ao carregar pacientes');
      console.error(error);
    }
  };

  const filteredPatients = patients.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.breed.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.owner_name && p.owner_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50" data-testid="home-page">
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <img src="/logo.svg" alt="TVUSVET Logo" className="h-16" />
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent" style={{ fontFamily: 'Manrope, sans-serif' }}>
                TVUSVET Laudos
              </h1>
              <p className="text-gray-600">Sistema de Ultrassonografia Veterinária</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => navigate('/settings')}
              variant="outline"
              data-testid="settings-button"
            >
              <Settings className="mr-2 h-4 w-4" />
              Configurações
            </Button>
            <Button
              onClick={() => setShowNewPatient(true)}
              data-testid="new-patient-button"
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 h-12 text-base px-6"
            >
              <Plus className="mr-2 h-4 w-4" />
              Novo Paciente
            </Button>
          </div>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Buscar por nome do paciente, raça ou tutor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="search-input"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPatients.map(patient => (
            <PatientCard key={patient.id} patient={patient} onUpdate={loadPatients} />
          ))}
        </div>

        {filteredPatients.length === 0 && (
          <Card className="p-12 text-center">
            <p className="text-gray-500">Nenhum paciente encontrado</p>
          </Card>
        )}
      </div>

      <Dialog open={showNewPatient} onOpenChange={setShowNewPatient}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Paciente</DialogTitle>
            <DialogDescription>Cadastre um novo paciente no sistema</DialogDescription>
          </DialogHeader>
          <NewPatientForm onSuccess={() => { setShowNewPatient(false); loadPatients(); }} onCancel={() => setShowNewPatient(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={showLicenseModal} onOpenChange={setShowLicenseModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ativação de Licença</DialogTitle>
            <DialogDescription>
              Para continuar usando o sistema, insira seu código de licença
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="license-code">Código de Licença</Label>
              <Input
                id="license-code"
                value={licenseCode}
                onChange={(e) => setLicenseCode(e.target.value)}
                placeholder="Digite seu código de licença"
                className="mt-1"
              />
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={activateLicense} 
                disabled={activating || !licenseCode.trim()}
                className="flex-1"
              >
                {activating ? 'Ativando...' : 'Ativar Licença'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PatientCard({ patient, onUpdate }) {
  const [exams, setExams] = useState([]);
  const [examsCount, setExamsCount] = useState(0);
  const [showExams, setShowExams] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showNewExamDialog, setShowNewExamDialog] = useState(false);
  const navigate = useNavigate();

  // Load exams count on mount
  useEffect(() => {
    loadExamsCount();
  }, [patient.id]);

  const loadExamsCount = async () => {
    try {
      const response = await axios.get(`${API}/exams?patient_id=${patient.id}`);
      setExamsCount(response.data.length);
      setExams(response.data);
    } catch (error) {
      console.error('Erro ao carregar contagem de exames:', error);
    }
  };

  const loadExams = async () => {
    try {
      const response = await axios.get(`${API}/exams?patient_id=${patient.id}`);
      setExams(response.data);
      setExamsCount(response.data.length);
      setShowExams(true);
    } catch (error) {
      toast.error('Erro ao carregar exames');
    }
  };

  const createNewExam = () => {
    setShowNewExamDialog(true);
  };

  return (
    <Card className="hover:shadow-lg transition-shadow" data-testid={`patient-card-${patient.id}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{patient.name}</span>
          <div className="flex gap-2 items-center">
            <Button
              onClick={() => setShowEditDialog(true)}
              variant="ghost"
              size="sm"
              data-testid={`edit-patient-${patient.id}`}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              onClick={async () => {
                if (window.confirm(`Tem certeza que deseja excluir o paciente ${patient.name}? Todos os exames deste paciente também serão excluídos. Esta ação não pode ser desfeita.`)) {
                  try {
                    // Delete all exams for this patient first
                    const examsResponse = await axios.get(`${API}/exams?patient_id=${patient.id}`);
                    for (const exam of examsResponse.data) {
                      await axios.delete(`${API}/exams/${exam.id}`);
                    }
                    // Delete patient
                    await axios.delete(`${API}/patients/${patient.id}`);
                    toast.success('Paciente excluído com sucesso');
                    onUpdate();
                  } catch (error) {
                    toast.error('Erro ao excluir paciente');
                  }
                }
              }}
              variant="ghost"
              size="sm"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              data-testid={`delete-patient-${patient.id}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Badge variant={patient.species === 'dog' ? 'default' : 'secondary'}>
              {patient.species === 'dog' ? 'Cão' : 'Gato'}
            </Badge>
          </div>
        </CardTitle>
        <CardDescription>
          {patient.breed} • {patient.weight}kg • {patient.size === 'small' ? 'Pequeno' : patient.size === 'medium' ? 'Médio' : 'Grande'}
          {patient.owner_name && ` • Tutor: ${patient.owner_name}`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Button
            onClick={createNewExam}
            className="flex-1 h-12 text-base"
            data-testid={`new-exam-button-${patient.id}`}
          >
            <Plus className="mr-2 h-5 w-5" />
            Novo Exame
          </Button>
          <Button
            onClick={loadExams}
            variant="outline"
            className="flex-1 h-12 text-base"
            data-testid={`view-exams-button-${patient.id}`}
          >
            <FileText className="mr-2 h-5 w-5" />
            Ver Exames ({examsCount})
          </Button>
        </div>

        <Dialog open={showExams} onOpenChange={setShowExams}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Exames de {patient.name}</DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh]">
              {exams.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Nenhum exame realizado</p>
              ) : (
                <div className="space-y-3">
                  {exams.map(exam => (
                    <Card key={exam.id} className="p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-center">
                        <div className="flex-1 cursor-pointer" onClick={() => navigate(`/exam/${exam.id}`)}>
                          <p className="font-medium">Exame de {new Date(exam.exam_date).toLocaleDateString('pt-BR')}</p>
                          <p className="text-sm text-gray-500">
                            {exam.organs_data?.length || 0} órgãos • {exam.images?.length || 0} imagens
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => navigate(`/exam/${exam.id}`)}
                            data-testid={`open-exam-${exam.id}`}
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (window.confirm('Tem certeza que deseja excluir este exame? Esta ação não pode ser desfeita.')) {
                                try {
                                  await axios.delete(`${API}/exams/${exam.id}`);
                                  toast.success('Exame excluído com sucesso');
                                  loadExams();
                                } catch (error) {
                                  toast.error('Erro ao excluir exame');
                                }
                              }
                            }}
                            data-testid={`delete-exam-${exam.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </DialogContent>
        </Dialog>

        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Paciente</DialogTitle>
              <DialogDescription>Atualize os dados do paciente</DialogDescription>
            </DialogHeader>
            <NewPatientForm 
              patient={patient}
              onSuccess={() => { setShowEditDialog(false); onUpdate(); }} 
              onCancel={() => setShowEditDialog(false)} 
            />
          </DialogContent>
        </Dialog>

        <Dialog open={showNewExamDialog} onOpenChange={setShowNewExamDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Exame</DialogTitle>
              <DialogDescription>Configure a data e peso do exame</DialogDescription>
            </DialogHeader>
            <NewExamForm 
              patient={patient}
              onSuccess={(examId) => {
                setShowNewExamDialog(false);
                navigate(`/exam/${examId}`);
              }} 
              onCancel={() => setShowNewExamDialog(false)} 
            />
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

function NewExamForm({ patient, onSuccess, onCancel }) {
  const [examDate, setExamDate] = useState(new Date().toISOString().split('T')[0]);
  const [examWeight, setExamWeight] = useState(patient.weight);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API}/exams`, {
        patient_id: patient.id,
        exam_date: new Date(examDate).toISOString(),
        exam_weight: parseFloat(examWeight)
      });
      toast.success('Exame criado com sucesso!');
      onSuccess(response.data.id);
    } catch (error) {
      toast.error('Erro ao criar exame');
      console.error(error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" data-testid="new-exam-form">
      <div>
        <Label htmlFor="exam_date">Data do Exame *</Label>
        <Input
          id="exam_date"
          type="date"
          value={examDate}
          onChange={(e) => setExamDate(e.target.value)}
          required
          className="h-12"
          data-testid="exam-date-input"
        />
      </div>

      <div>
        <Label htmlFor="exam_weight">Peso do Animal (kg) *</Label>
        <Input
          id="exam_weight"
          type="number"
          step="0.1"
          value={examWeight}
          onChange={(e) => setExamWeight(e.target.value)}
          required
          className="h-12"
          data-testid="exam-weight-form-input"
        />
        <p className="text-sm text-gray-500 mt-1">
          Peso cadastrado: {patient.weight} kg
        </p>
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" className="flex-1 h-12" data-testid="create-exam-button">
          Criar Exame
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1 h-12">
          Cancelar
        </Button>
      </div>
    </form>
  );
}

function NewPatientForm({ patient, onSuccess, onCancel }) {
  const [formData, setFormData] = useState(patient || {
    name: '',
    species: 'dog',
    breed: '',
    weight: '',
    size: 'medium',
    sex: 'male',
    is_neutered: false,
    owner_name: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        weight: parseFloat(formData.weight)
      };
      
      if (patient) {
        await axios.put(`${API}/patients/${patient.id}`, data);
        toast.success('Paciente atualizado com sucesso!');
      } else {
        await axios.post(`${API}/patients`, data);
        toast.success('Paciente cadastrado com sucesso!');
      }
      onSuccess();
    } catch (error) {
      toast.error(`Erro ao ${patient ? 'atualizar' : 'cadastrar'} paciente`);
      console.error(error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" data-testid="new-patient-form">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Nome do Paciente *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            data-testid="patient-name-input"
          />
        </div>
        <div>
          <Label htmlFor="owner_name">Nome do Tutor</Label>
          <Input
            id="owner_name"
            value={formData.owner_name}
            onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
            data-testid="owner-name-input"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="species">Espécie *</Label>
          <Select value={formData.species} onValueChange={(value) => setFormData({ ...formData, species: value })}>
            <SelectTrigger data-testid="species-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dog">Cão</SelectItem>
              <SelectItem value="cat">Gato</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="breed">Raça *</Label>
          <Input
            id="breed"
            value={formData.breed}
            onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
            required
            data-testid="breed-input"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="weight">Peso (kg) *</Label>
          <Input
            id="weight"
            type="number"
            step="0.1"
            value={formData.weight}
            onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
            required
            data-testid="weight-input"
          />
        </div>
        <div>
          <Label htmlFor="size">Porte *</Label>
          <Select value={formData.size} onValueChange={(value) => setFormData({ ...formData, size: value })}>
            <SelectTrigger data-testid="size-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="small">Pequeno</SelectItem>
              <SelectItem value="medium">Médio</SelectItem>
              <SelectItem value="large">Grande</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="sex">Sexo *</Label>
          <Select value={formData.sex} onValueChange={(value) => setFormData({ ...formData, sex: value })}>
            <SelectTrigger data-testid="sex-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Macho</SelectItem>
              <SelectItem value="female">Fêmea</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="is_neutered"
          checked={formData.is_neutered}
          onChange={(e) => setFormData({ ...formData, is_neutered: e.target.checked })}
          className="rounded"
          data-testid="neutered-checkbox"
        />
        <Label htmlFor="is_neutered">Paciente Castrado</Label>
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" className="flex-1" data-testid="save-patient-button">
          {patient ? 'Atualizar' : 'Salvar'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">Cancelar</Button>
      </div>
    </form>
  );
}

function ExamPage() {
  const { examId } = useParams();
  const [exam, setExam] = useState(null);
  const [patient, setPatient] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [referenceValues, setReferenceValues] = useState([]);
  const [organsData, setOrgansData] = useState([]);
  const [currentOrganIndex, setCurrentOrganIndex] = useState(0);
  const [examWeight, setExamWeight] = useState('');
  const [examImages, setExamImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadExamData();
  }, [examId]);

  const loadExamData = async () => {
    try {
      const examRes = await axios.get(`${API}/exams/${examId}`);
      setExam(examRes.data);
      setExamWeight(examRes.data.exam_weight || '');
      setExamImages(examRes.data.images || []);

      const patientRes = await axios.get(`${API}/patients/${examRes.data.patient_id}`);
      setPatient(patientRes.data);

      const templatesRes = await axios.get(`${API}/templates`);
      setTemplates(templatesRes.data);

      const refValuesRes = await axios.get(`${API}/reference-values`);
      setReferenceValues(refValuesRes.data);

      // Initialize organs data
      const allOrgans = [...ORGANS];
      // For males: include prostate even if neutered, testicles only if not neutered
      if (patientRes.data.sex === 'male') {
        if (patientRes.data.is_neutered) {
          allOrgans.push(...REPRODUCTIVE_ORGANS_MALE_NEUTERED);
        } else {
          allOrgans.push(...REPRODUCTIVE_ORGANS_MALE);
        }
      } else {
        // For females: only add reproductive organs if not neutered
        if (!patientRes.data.is_neutered) {
          allOrgans.push(...REPRODUCTIVE_ORGANS_FEMALE);
        }
      }

      const initialOrgansData = allOrgans.map(organ => ({
        organ_name: organ,
        measurements: {},
        selected_findings: [],
        custom_notes: '',
        report_text: ''
      }));

      if (examRes.data.organs_data && examRes.data.organs_data.length > 0) {
        setOrgansData(examRes.data.organs_data);
      } else {
        setOrgansData(initialOrgansData);
      }
    } catch (error) {
      toast.error('Erro ao carregar dados do exame');
      console.error(error);
    }
  };

  const saveExam = async () => {
    try {
      await axios.put(`${API}/exams/${examId}`, {
        organs_data: organsData,
        exam_weight: examWeight ? parseFloat(examWeight) : null
      });
      toast.success('Exame salvo com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar exame');
      console.error(error);
    }
  };

  const handleImageUpload = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (let file of files) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await axios.post(
          `${API}/exams/${examId}/images`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          }
        );
        
        setExamImages(prev => [...prev, response.data]);
      }
      toast.success('Imagens adicionadas com sucesso!');
      await loadExamData(); // Reload to get updated images
    } catch (error) {
      toast.error('Erro ao fazer upload de imagens');
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (imageId) => {
    try {
      await axios.delete(`${API}/exams/${examId}/images/${imageId}`);
      setExamImages(prev => prev.filter(img => img.id !== imageId));
      toast.success('Imagem removida');
    } catch (error) {
      toast.error('Erro ao remover imagem');
    }
  };

  const updateOrganData = (index, field, value) => {
    const newOrgansData = [...organsData];
    newOrgansData[index] = {
      ...newOrgansData[index],
      [field]: value
    };
    setOrgansData(newOrgansData);
  };

  const exportToDocx = async () => {
    try {
      await saveExam();
      const response = await axios.get(`${API}/exams/${examId}/export`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `laudo_${patient?.name || 'paciente'}.docx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Laudo exportado com sucesso!');
    } catch (error) {
      toast.error('Erro ao exportar laudo');
      console.error(error);
    }
  };

  if (!exam || !patient) {
    return <div className="flex items-center justify-center h-screen">Carregando...</div>;
  }

  const currentOrgan = organsData[currentOrganIndex];
  const organTemplates = templates.filter(t => t.organ === currentOrgan?.organ_name);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50" data-testid="exam-page">
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Exame de {patient.name}
            </h1>
            <p className="text-gray-600 mb-3">
              {patient.breed} • {new Date(exam.exam_date).toLocaleDateString('pt-BR')}
            </p>
            <div className="flex items-center gap-2">
              <Label htmlFor="exam-weight" className="text-sm">Peso no exame (kg):</Label>
              <Input
                id="exam-weight"
                type="number"
                step="0.1"
                value={examWeight}
                onChange={(e) => setExamWeight(e.target.value)}
                className="w-32"
                placeholder={patient.weight}
                data-testid="exam-weight-input"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={saveExam} variant="outline" className="h-12 text-base px-6" data-testid="save-exam-button">
              <Save className="mr-2 h-5 w-5" />
              Salvar
            </Button>
            <Button onClick={exportToDocx} className="h-12 text-base px-6" data-testid="export-button">
              <Download className="mr-2 h-5 w-5" />
              Exportar Laudo
            </Button>
            <Button onClick={() => navigate('/')} variant="outline" className="h-12 text-base px-6">
              <X className="mr-2 h-5 w-5" />
              Fechar
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4">
          {/* Área de Imagens - À ESQUERDA */}
          <div className="col-span-5">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>Imagens ({examImages.length})</span>
                  <label htmlFor="image-upload">
                    <Button
                      size="default"
                      variant="outline"
                      onClick={() => document.getElementById('image-upload').click()}
                      disabled={uploading}
                      className="h-10"
                      data-testid="upload-images-button"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {uploading ? 'Enviando...' : 'Adicionar'}
                    </Button>
                  </label>
                  <input
                    id="image-upload"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                <ScrollArea className="h-[calc(100vh-300px)]">
                  <div className="space-y-3">
                    {examImages.map((image) => (
                      <div key={image.id} className="relative group">
                        <img
                          src={`${API}/images/${image.id}`}
                          alt={image.organ || 'Exam image'}
                          className="w-full h-auto max-h-96 object-contain rounded-lg border-2 border-gray-200 hover:border-purple-400 transition-colors bg-gray-50"
                        />
                        <Button
                          size="sm"
                          variant="destructive"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 rounded-full shadow-lg"
                          onClick={() => handleDeleteImage(image.id)}
                          data-testid={`delete-image-${image.id}`}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        {image.organ && (
                          <div className="mt-2 p-2 bg-purple-50 rounded text-center">
                            <p className="text-sm font-medium text-purple-900">{image.organ}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  {examImages.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <ImageIcon className="h-20 w-20 text-gray-300 mb-4" />
                      <p className="text-base text-gray-600 font-medium">
                        Nenhuma imagem adicionada
                      </p>
                      <p className="text-sm text-gray-400 mt-2">
                        Clique em "Adicionar" para fazer upload
                      </p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Editor de Órgão - AO CENTRO */}
          <div className="col-span-5">
            {currentOrgan && (
              <OrganEditor
                organ={currentOrgan}
                templates={organTemplates}
                referenceValues={referenceValues.filter(rv => rv.organ === currentOrgan.organ_name && rv.species === patient.species && rv.size === patient.size)}
                onChange={(field, value) => updateOrganData(currentOrganIndex, field, value)}
              />
            )}
          </div>

          {/* Sidebar de Órgãos - À DIREITA */}
          <div className="col-span-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Órgãos</CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <ScrollArea className="h-[calc(100vh-300px)]">
                  <div className="space-y-1">
                    {organsData.map((organ, idx) => (
                      <Button
                        key={idx}
                        variant={currentOrganIndex === idx ? 'default' : 'ghost'}
                        className="w-full justify-start text-left text-xs py-3 h-auto min-h-[44px]"
                        onClick={() => setCurrentOrganIndex(idx)}
                        data-testid={`organ-button-${idx}`}
                      >
                        {organ.organ_name}
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function OrganEditor({ organ, templates, referenceValues, onChange }) {
  const [measurements, setMeasurements] = useState(organ.measurements || {});
  const [reportText, setReportText] = useState(organ.report_text || '');

  // Update reportText when organ changes
  useEffect(() => {
    setReportText(organ.report_text || '');
    setMeasurements(organ.measurements || {});
  }, [organ.organ_name]); // Only reset when organ changes

  const addMeasurement = (type, value, unit) => {
    const newMeasurements = {
      ...measurements,
      [type]: {
        value: parseFloat(value),
        unit,
        is_abnormal: checkIfAbnormal(type, parseFloat(value), unit)
      }
    };
    setMeasurements(newMeasurements);
    onChange('measurements', newMeasurements);
  };

  const checkIfAbnormal = (type, value, unit) => {
    const ref = referenceValues.find(rv => rv.measurement_type === type && rv.unit === unit);
    if (!ref) return false;
    return value < ref.min_value || value > ref.max_value;
  };

  const insertTemplate = (templateText) => {
    const newText = reportText ? `${reportText}\n${templateText}` : templateText;
    setReportText(newText);
    onChange('report_text', newText);
  };

  return (
    <Card data-testid="organ-editor">
      <CardHeader>
        <CardTitle>{organ.organ_name}</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="measurements">
          <TabsList className="grid w-full grid-cols-3 h-12">
            <TabsTrigger value="measurements" className="text-base">Medidas</TabsTrigger>
            <TabsTrigger value="findings" className="text-base">Achados</TabsTrigger>
            <TabsTrigger value="report" className="text-base">Laudo</TabsTrigger>
          </TabsList>

          <TabsContent value="measurements" className="space-y-4">
            <div className="space-y-4">
              <h3 className="font-medium text-lg">Adicionar Medida</h3>
              <MeasurementInput 
                onAdd={addMeasurement} 
                existingMeasurementsCount={Object.keys(measurements).length}
              />

              {Object.keys(measurements).length > 0 && (
                <div className="space-y-3 mt-6">
                  <h4 className="font-medium text-lg">Medidas Registradas</h4>
                  {Object.entries(measurements).map(([type, data], index) => (
                    <div key={type} className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <div>
                        <span className="font-semibold text-purple-900">Medida {index + 1}: </span>
                        <span className="text-lg">{data.value} cm</span>
                      </div>
                      {data.is_abnormal && (
                        <Badge variant="destructive" className="flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Fora do padrão
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="findings" className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-medium text-lg mb-3">Achados Pré-definidos</h3>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {templates.map(template => (
                    <Button
                      key={template.id}
                      variant="outline"
                      className="w-full justify-start text-left h-auto py-3 px-4"
                      onClick={() => insertTemplate(template.text)}
                      data-testid={`template-button-${template.id}`}
                    >
                      <div className="flex flex-col items-start w-full">
                        <span className="font-semibold text-purple-900">{template.title || template.text.substring(0, 50)}</span>
                        <span className="text-xs text-gray-500 mt-1">{template.category}</span>
                      </div>
                    </Button>
                  ))}
                  {templates.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-8">
                      Nenhum texto pré-definido para este órgão
                    </p>
                  )}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="report" className="space-y-4">
            <div>
              <Label htmlFor="report-text">Texto do Laudo</Label>
              <Textarea
                id="report-text"
                value={reportText}
                onChange={(e) => {
                  setReportText(e.target.value);
                  onChange('report_text', e.target.value);
                }}
                rows={15}
                placeholder="Digite ou selecione textos pré-definidos..."
                className="mt-2"
                data-testid="report-textarea"
              />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function MeasurementInput({ onAdd, existingMeasurementsCount }) {
  const [value, setValue] = useState('');

  const handleAdd = () => {
    if (value) {
      const measurementNumber = existingMeasurementsCount + 1;
      onAdd(`medida_${measurementNumber}`, value, 'cm');
      setValue('');
    }
  };

  return (
    <div className="grid grid-cols-12 gap-3">
      <div className="col-span-8">
        <Label className="text-base">Medida {existingMeasurementsCount + 1} (cm)</Label>
        <Input
          type="number"
          step="0.1"
          placeholder="Digite o valor em cm"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="h-12 text-base"
          data-testid="measurement-value-input"
        />
      </div>
      <div className="col-span-4">
        <Label>&nbsp;</Label>
        <Button onClick={handleAdd} className="w-full h-12 text-base" data-testid="add-measurement-button">
          <Plus className="h-5 w-5 mr-2" />
          Adicionar
        </Button>
      </div>
    </div>
  );
}

function SettingsPage() {
  const [settings, setSettings] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [referenceValues, setReferenceValues] = useState([]);
  const [activeTab, setActiveTab] = useState('clinic');
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadSettings();
    loadTemplates();
    loadReferenceValues();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await axios.get(`${API}/settings`);
      setSettings(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const loadTemplates = async () => {
    try {
      const response = await axios.get(`${API}/templates`);
      setTemplates(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const loadReferenceValues = async () => {
    try {
      const response = await axios.get(`${API}/reference-values`);
      setReferenceValues(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const saveSettings = async (data) => {
    try {
      await axios.put(`${API}/settings`, data);
      toast.success('Configurações salvas!');
      loadSettings();
    } catch (error) {
      toast.error('Erro ao salvar configurações');
    }
  };

  const deleteAllData = async () => {
    if (!window.confirm('⚠️ ATENÇÃO: Tem certeza que deseja excluir TODOS os pacientes e exames? Esta ação é IRREVERSÍVEL!')) {
      return;
    }

    if (!window.confirm('Esta é sua última chance! Confirma a exclusão de TODOS os dados?')) {
      return;
    }

    setIsDeleting(true);
    try {
      // Get all patients
      const patientsRes = await axios.get(`${API}/patients`);
      const patients = patientsRes.data;

      // Delete all exams for each patient
      for (const patient of patients) {
        const examsRes = await axios.get(`${API}/exams?patient_id=${patient.id}`);
        for (const exam of examsRes.data) {
          await axios.delete(`${API}/exams/${exam.id}`);
        }
        // Delete patient
        await axios.delete(`${API}/patients/${patient.id}`);
      }

      toast.success('Todos os dados foram excluídos com sucesso');
      navigate('/');
    } catch (error) {
      toast.error('Erro ao excluir dados');
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50" data-testid="settings-page">
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent" style={{ fontFamily: 'Manrope, sans-serif' }}>Configurações</h1>
          <Button onClick={() => navigate('/')} variant="outline">
            <X className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="clinic">Dados da Clínica</TabsTrigger>
            <TabsTrigger value="letterhead">Timbrado</TabsTrigger>
            <TabsTrigger value="templates">Textos Padrão</TabsTrigger>
            <TabsTrigger value="references">Valores de Referência</TabsTrigger>
            <TabsTrigger value="danger" className="text-red-600">Zona de Perigo</TabsTrigger>
          </TabsList>

          <TabsContent value="clinic">
            {settings && <ClinicSettings settings={settings} onSave={saveSettings} />}
          </TabsContent>

          <TabsContent value="letterhead">
            {settings && <LetterheadSettings settings={settings} onSave={saveSettings} />}
          </TabsContent>

          <TabsContent value="templates">
            <TemplatesManager templates={templates} onUpdate={loadTemplates} />
          </TabsContent>

          <TabsContent value="references">
            <ReferenceValuesManager values={referenceValues} onUpdate={loadReferenceValues} />
          </TabsContent>

          <TabsContent value="danger">
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-red-600">⚠️ Zona de Perigo</CardTitle>
                <CardDescription>
                  Ações irreversíveis que excluirão permanentemente seus dados
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h3 className="font-semibold text-red-900 mb-2">Excluir Todos os Dados</h3>
                  <p className="text-sm text-red-700 mb-4">
                    Esta ação irá excluir permanentemente TODOS os pacientes, exames e imagens do sistema. 
                    Esta ação NÃO pode ser desfeita!
                  </p>
                  <Button
                    onClick={deleteAllData}
                    disabled={isDeleting}
                    variant="destructive"
                    className="w-full h-12 text-base"
                    data-testid="delete-all-data-button"
                  >
                    {isDeleting ? 'Excluindo...' : 'Excluir Todos os Pacientes e Exames'}
                  </Button>
                </div>

                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Backup Recomendado</h3>
                  <p className="text-sm text-gray-600">
                    Antes de excluir dados, recomendamos exportar todos os laudos importantes. 
                    Uma vez excluídos, os dados não podem ser recuperados.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function ClinicSettings({ settings, onSave }) {
  const [formData, setFormData] = useState(settings);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informações da Clínica</CardTitle>
        <CardDescription>Configure os dados que aparecerão no cabeçalho dos laudos</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="clinic_name">Nome da Clínica</Label>
            <Input
              id="clinic_name"
              value={formData.clinic_name || ''}
              onChange={(e) => setFormData({ ...formData, clinic_name: e.target.value })}
              data-testid="clinic-name-input"
            />
          </div>
          <div>
            <Label htmlFor="clinic_address">Endereço</Label>
            <Input
              id="clinic_address"
              value={formData.clinic_address || ''}
              onChange={(e) => setFormData({ ...formData, clinic_address: e.target.value })}
              data-testid="clinic-address-input"
            />
          </div>
          <div>
            <Label htmlFor="veterinarian_name">Nome do Veterinário</Label>
            <Input
              id="veterinarian_name"
              value={formData.veterinarian_name || ''}
              onChange={(e) => setFormData({ ...formData, veterinarian_name: e.target.value })}
              data-testid="vet-name-input"
            />
          </div>
          <div>
            <Label htmlFor="crmv">CRMV</Label>
            <Input
              id="crmv"
              value={formData.crmv || ''}
              onChange={(e) => setFormData({ ...formData, crmv: e.target.value })}
              data-testid="crmv-input"
            />
          </div>
          <Button type="submit" data-testid="save-clinic-settings-button">Salvar Configurações</Button>
        </form>
      </CardContent>
    </Card>
  );
}

function LetterheadSettings({ settings, onSave }) {
  const [uploading, setUploading] = useState(false);
  const [letterheadFile, setLetterheadFile] = useState(null);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(`${API}/upload-letterhead`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Update settings with letterhead path
      await onSave({
        ...settings,
        letterhead_path: response.data.path
      });

      setLetterheadFile(file.name);
      toast.success('Timbrado carregado com sucesso!');
    } catch (error) {
      toast.error('Erro ao fazer upload do timbrado');
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveLetterhead = async () => {
    if (window.confirm('Tem certeza que deseja remover o timbrado configurado?')) {
      try {
        await onSave({
          ...settings,
          letterhead_path: null
        });
        setLetterheadFile(null);
        toast.success('Timbrado removido com sucesso!');
      } catch (error) {
        toast.error('Erro ao remover timbrado');
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Timbrado do Laudo</CardTitle>
        <CardDescription>
          Configure o cabeçalho que aparecerá nos laudos exportados
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="letterhead-upload">Upload do Timbrado (PDF/DOCX)</Label>
          <p className="text-sm text-gray-500 mb-2">
            Faça upload de um arquivo com o cabeçalho da sua clínica
          </p>
          <div className="flex gap-2">
            <Input
              id="letterhead-upload"
              type="file"
              accept=".pdf,.docx,.doc"
              onChange={handleFileUpload}
              disabled={uploading}
              data-testid="letterhead-upload-input"
            />
            {uploading && <span className="text-sm text-gray-500">Carregando...</span>}
          </div>
          {settings.letterhead_path && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700 font-medium">
                  ✓ Timbrado Configurado
                </p>
                <p className="text-xs text-green-600 mt-1">
                  {settings.letterhead_path.split('/').pop()}
                </p>
              </div>
              <Button
                onClick={handleRemoveLetterhead}
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                data-testid="remove-letterhead-button"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Remover
              </Button>
            </div>
          )}
        </div>

        <Separator />

        <div>
          <p className="text-sm text-gray-600 mb-3">
            <strong>Nota:</strong> O sistema utilizará as informações dos "Dados da Clínica" 
            para criar o cabeçalho do laudo automaticamente. Você pode personalizar esses dados na aba anterior.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function TemplatesManager({ templates, onUpdate }) {
  const [showNew, setShowNew] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ organ: '', category: 'normal', title: '', text: '' });

  const createTemplate = async () => {
    try {
      await axios.post(`${API}/templates`, newTemplate);
      toast.success('Texto adicionado!');
      setShowNew(false);
      setNewTemplate({ organ: '', category: 'normal', text: '' });
      onUpdate();
    } catch (error) {
      toast.error('Erro ao adicionar texto');
    }
  };

  const deleteTemplate = async (id) => {
    try {
      await axios.delete(`${API}/templates/${id}`);
      toast.success('Texto removido!');
      onUpdate();
    } catch (error) {
      toast.error('Erro ao remover texto');
    }
  };

  const groupedTemplates = templates.reduce((acc, template) => {
    if (!acc[template.organ]) {
      acc[template.organ] = [];
    }
    acc[template.organ].push(template);
    return acc;
  }, {});

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Textos Padrão por Órgão</span>
          <Button onClick={() => setShowNew(!showNew)} size="sm" data-testid="add-template-button">
            <Plus className="mr-2 h-4 w-4" />
            Adicionar
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {showNew && (
          <Card className="mb-4 p-4 bg-purple-50 border-purple-200">
            <div className="space-y-3">
              <Select value={newTemplate.organ} onValueChange={(value) => setNewTemplate({ ...newTemplate, organ: value })}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Selecione o órgão" />
                </SelectTrigger>
                <SelectContent>
                  {ORGANS.map(organ => (
                    <SelectItem key={organ} value={organ}>{organ}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div>
                <Label>Título (aparece na lista)</Label>
                <Input
                  placeholder="Ex: Normal, Alteração de ecogenicidade..."
                  value={newTemplate.title}
                  onChange={(e) => setNewTemplate({ ...newTemplate, title: e.target.value })}
                  className="h-12 mt-1"
                />
              </div>
              
              <div>
                <Label>Texto Completo (aparece no laudo)</Label>
                <div className="mt-1 space-y-2">
                  {/* Toolbar de Formatação */}
                  <div className="flex gap-2 p-2 bg-white rounded-lg border">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const textarea = document.getElementById('template-text');
                        const start = textarea.selectionStart;
                        const end = textarea.selectionEnd;
                        const selectedText = newTemplate.text.substring(start, end);
                        if (selectedText) {
                          const newText = newTemplate.text.substring(0, start) + 
                                        `**${selectedText}**` + 
                                        newTemplate.text.substring(end);
                          setNewTemplate({ ...newTemplate, text: newText });
                        }
                      }}
                      className="h-8"
                      title="Negrito"
                    >
                      <strong>N</strong>
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const textarea = document.getElementById('template-text');
                        const start = textarea.selectionStart;
                        const end = textarea.selectionEnd;
                        const selectedText = newTemplate.text.substring(start, end);
                        if (selectedText) {
                          const newText = newTemplate.text.substring(0, start) + 
                                        `*${selectedText}*` + 
                                        newTemplate.text.substring(end);
                          setNewTemplate({ ...newTemplate, text: newText });
                        }
                      }}
                      className="h-8"
                      title="Itálico"
                    >
                      <em>I</em>
                    </Button>
                    <Separator orientation="vertical" className="h-6" />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const textarea = document.getElementById('template-text');
                        const start = textarea.selectionStart;
                        const newText = newTemplate.text.substring(0, start) + 
                                      '{MEDIDA}' + 
                                      newTemplate.text.substring(start);
                        setNewTemplate({ ...newTemplate, text: newText });
                      }}
                      className="h-8 text-purple-600"
                      title="Inserir placeholder de medida"
                    >
                      + Valor de Medida
                    </Button>
                  </div>
                  
                  <Textarea
                    id="template-text"
                    placeholder="Digite o texto detalhado. Use {MEDIDA} para inserir valores de medidas automaticamente..."
                    value={newTemplate.text}
                    onChange={(e) => setNewTemplate({ ...newTemplate, text: e.target.value })}
                    rows={6}
                  />
                  <p className="text-xs text-gray-500">
                    <strong>Dica:</strong> Use ** para negrito, * para itálico, e {'{MEDIDA}'} para inserir medidas automaticamente
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button onClick={createTemplate} size="default" className="h-10">Salvar</Button>
                <Button onClick={() => setShowNew(false)} variant="outline" size="default" className="h-10">Cancelar</Button>
              </div>
            </div>
          </Card>
        )}

        <ScrollArea className="h-[500px]">
          <div className="space-y-4">
            {Object.entries(groupedTemplates).map(([organ, organTemplates]) => (
              <div key={organ}>
                <h3 className="font-semibold text-lg mb-2">{organ}</h3>
                <div className="space-y-2 ml-4">
                  {organTemplates.map(template => (
                    <div key={template.id} className="flex justify-between items-start p-3 bg-purple-50 rounded-lg border border-purple-200">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-purple-900 mb-1">{template.title || 'Sem título'}</p>
                        <p className="text-sm text-gray-700">{template.text}</p>
                        <p className="text-xs text-gray-500 mt-1">Categoria: {template.category}</p>
                      </div>
                      <Button
                        onClick={() => deleteTemplate(template.id)}
                        variant="ghost"
                        size="sm"
                        className="ml-2"
                        data-testid={`delete-template-${template.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Separator className="mt-4" />
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function ReferenceValuesManager({ values, onUpdate }) {
  const [showNew, setShowNew] = useState(false);
  const [newValue, setNewValue] = useState({
    organ: '',
    measurement_type: '',
    species: 'dog',
    size: 'medium',
    min_value: '',
    max_value: '',
    unit: 'cm'
  });

  const createReferenceValue = async () => {
    try {
      await axios.post(`${API}/reference-values`, {
        ...newValue,
        min_value: parseFloat(newValue.min_value),
        max_value: parseFloat(newValue.max_value)
      });
      toast.success('Valor de referência adicionado!');
      setShowNew(false);
      setNewValue({ organ: '', measurement_type: '', species: 'dog', size: 'medium', min_value: '', max_value: '', unit: 'cm' });
      onUpdate();
    } catch (error) {
      toast.error('Erro ao adicionar valor de referência');
    }
  };

  const deleteReferenceValue = async (id) => {
    try {
      await axios.delete(`${API}/reference-values/${id}`);
      toast.success('Valor removido!');
      onUpdate();
    } catch (error) {
      toast.error('Erro ao remover valor');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Valores de Referência</span>
          <Button onClick={() => setShowNew(!showNew)} size="sm" data-testid="add-reference-button">
            <Plus className="mr-2 h-4 w-4" />
            Adicionar
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {showNew && (
          <Card className="mb-4 p-4 bg-blue-50">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Select value={newValue.organ} onValueChange={(value) => setNewValue({ ...newValue, organ: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Órgão" />
                  </SelectTrigger>
                  <SelectContent>
                    {ORGANS.map(organ => (
                      <SelectItem key={organ} value={organ}>{organ}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Tipo de medida (ex: comprimento)"
                  value={newValue.measurement_type}
                  onChange={(e) => setNewValue({ ...newValue, measurement_type: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Select value={newValue.species} onValueChange={(value) => setNewValue({ ...newValue, species: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dog">Cão</SelectItem>
                    <SelectItem value="cat">Gato</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={newValue.size} onValueChange={(value) => setNewValue({ ...newValue, size: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Pequeno</SelectItem>
                    <SelectItem value="medium">Médio</SelectItem>
                    <SelectItem value="large">Grande</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Input
                  type="number"
                  step="0.1"
                  placeholder="Valor mínimo"
                  value={newValue.min_value}
                  onChange={(e) => setNewValue({ ...newValue, min_value: e.target.value })}
                />
                <Input
                  type="number"
                  step="0.1"
                  placeholder="Valor máximo"
                  value={newValue.max_value}
                  onChange={(e) => setNewValue({ ...newValue, max_value: e.target.value })}
                />
                <Select value={newValue.unit} onValueChange={(value) => setNewValue({ ...newValue, unit: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cm">cm</SelectItem>
                    <SelectItem value="mm">mm</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button onClick={createReferenceValue} size="sm">Salvar</Button>
                <Button onClick={() => setShowNew(false)} variant="outline" size="sm">Cancelar</Button>
              </div>
            </div>
          </Card>
        )}

        <ScrollArea className="h-[500px]">
          <div className="space-y-2">
            {values.map(value => (
              <div key={value.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <span className="font-medium">{value.organ}</span>
                  <span className="text-sm text-gray-600 ml-2">
                    {value.measurement_type} • {value.species === 'dog' ? 'Cão' : 'Gato'} • {value.size === 'small' ? 'Pequeno' : value.size === 'medium' ? 'Médio' : 'Grande'}
                  </span>
                  <div className="text-sm mt-1">
                    <Badge variant="outline">{value.min_value} - {value.max_value} {value.unit}</Badge>
                  </div>
                </div>
                <Button
                  onClick={() => deleteReferenceValue(value.id)}
                  variant="ghost"
                  size="sm"
                  data-testid={`delete-reference-${value.id}`}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/exam/:examId" element={<ExamPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" />
    </div>
  );
}

export default App;