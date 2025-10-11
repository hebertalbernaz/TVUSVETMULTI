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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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

const REPRODUCTIVE_ORGANS_MALE = ['Testículo Direito', 'Testículo Esquerdo', 'Próstata'];
const REPRODUCTIVE_ORGANS_FEMALE = ['Corpo Uterino', 'Corno Uterino Direito', 'Corno Uterino Esquerdo', 'Ovário Direito', 'Ovário Esquerdo'];

function HomePage() {
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewPatient, setShowNewPatient] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadPatients();
    initializeDefaults();
  }, []);

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
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50" data-testid="home-page">
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
              TVUSVET Laudos
            </h1>
            <p className="text-gray-600">Sistema de Ultrassonografia Veterinária</p>
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
              onClick={() => {setEditingPatient(null); setShowNewPatient(true);}}
              data-testid="new-patient-button"
              className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700"
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
              placeholder="Buscar paciente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="search-input"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPatients.map(patient => (
            <PatientCard 
              key={patient.id} 
              patient={patient} 
              onUpdate={loadPatients}
              onEdit={(p) => {setEditingPatient(p); setShowNewPatient(true);}}
            />
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
            <DialogTitle>{editingPatient ? 'Editar Paciente' : 'Novo Paciente'}</DialogTitle>
            <DialogDescription>
              {editingPatient ? 'Atualize os dados do paciente' : 'Cadastre um novo paciente no sistema'}
            </DialogDescription>
          </DialogHeader>
          <PatientForm 
            patient={editingPatient}
            onSuccess={() => { setShowNewPatient(false); setEditingPatient(null); loadPatients(); }} 
            onCancel={() => { setShowNewPatient(false); setEditingPatient(null); }} 
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PatientCard({ patient, onUpdate, onEdit }) {
  const [exams, setExams] = useState([]);
  const [showExams, setShowExams] = useState(false);
  const navigate = useNavigate();

  const loadExams = async () => {
    try {
      const response = await axios.get(`${API}/exams?patient_id=${patient.id}`);
      setExams(response.data);
      setShowExams(true);
    } catch (error) {
      toast.error('Erro ao carregar exames');
    }
  };

  const createNewExam = async () => {
    try {
      const response = await axios.post(`${API}/exams`, {
        patient_id: patient.id,
        exam_weight: patient.weight
      });
      navigate(`/exam/${response.data.id}`);
    } catch (error) {
      toast.error('Erro ao criar exame');
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow" data-testid={`patient-card-${patient.id}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{patient.name}</span>
          <div className="flex gap-2 items-center">
            <Button
              onClick={() => onEdit(patient)}
              variant="ghost"
              size="sm"
              data-testid={`edit-patient-${patient.id}`}
            >
              <Edit className="h-4 w-4" />
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
            className="flex-1"
            data-testid={`new-exam-button-${patient.id}`}
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo Exame
          </Button>
          <Button
            onClick={loadExams}
            variant="outline"
            className="flex-1"
            data-testid={`view-exams-button-${patient.id}`}
          >
            <FileText className="mr-2 h-4 w-4" />
            Exames ({exams.length})
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
                    <Card key={exam.id} className="p-4 hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/exam/${exam.id}`)}>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">Exame de {new Date(exam.exam_date).toLocaleDateString('pt-BR')}</p>
                          <p className="text-sm text-gray-500">
                            {exam.organs_data?.length || 0} órgãos • {exam.images?.length || 0} imagens
                          </p>
                        </div>
                        <Button variant="ghost" size="sm">
                          <FileText className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

function PatientForm({ patient, onSuccess, onCancel }) {
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
    <form onSubmit={handleSubmit} className="space-y-4" data-testid="patient-form">
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

// Continue in next part...
export default function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/exam/:examId" element={<ExamPageWrapper />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" />
    </div>
  );
}

function ExamPageWrapper() {
  return <ExamPage />;
}

function ExamPage() {
  return <div>Exam page placeholder - will be completed in next file</div>;
}

function SettingsPage() {
  return <div>Settings page placeholder</div>;
}
