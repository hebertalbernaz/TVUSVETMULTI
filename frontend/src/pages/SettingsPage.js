import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { db } from '@/services/database';
import { TemplatesManager } from '@/components/TemplatesManager';
import { ReferenceValuesManager } from '@/components/ReferenceValuesManager';
import { LetterheadSettings } from '@/components/LetterheadSettings';

export default function SettingsPage() {
  const [settings, setSettings] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [referenceValues, setReferenceValues] = useState([]);
  const [activeTab, setActiveTab] = useState('clinic');
  const navigate = useNavigate();

  useEffect(() => {
    loadSettings();
    loadTemplates();
    loadReferenceValues();
  }, []);

  const loadSettings = () => {
    const s = db.getSettings();
    setSettings(s);
  };

  const loadTemplates = () => {
    const t = db.getTemplates();
    setTemplates(t);
  };

  const loadReferenceValues = () => {
    const rv = db.getReferenceValues();
    setReferenceValues(rv);
  };

  const saveSettings = async (data) => {
    try {
      await db.updateSettings(data);
      toast.success('Configurações salvas!');
      loadSettings();
    } catch (error) {
      toast.error('Erro ao salvar configurações');
    }
  };

  const importBackup = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const success = db.importBackup(e.target.result);
        if (success) {
          toast.success('Backup importado com sucesso!');
          loadTemplates();
          loadReferenceValues();
          loadSettings();
        } else {
          toast.error('Erro ao importar backup');
        }
      } catch (error) {
        toast.error('Arquivo inválido');
      }
    };
    reader.readAsText(file);
  };

  if (!settings) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50" data-testid="settings-page">
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Configurações
          </h1>
          <div className="flex gap-2">
            <label htmlFor="import-backup">
              <input
                id="import-backup"
                type="file"
                accept=".json"
                onChange={importBackup}
                className="hidden"
              />
              <Button variant="outline" as="span" className="cursor-pointer">
                <Upload className="mr-2 h-4 w-4" />
                Importar Backup
              </Button>
            </label>
            <Button onClick={() => navigate('/')} variant="outline">
              <X className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="clinic">Dados da Clínica</TabsTrigger>
            <TabsTrigger value="letterhead">Timbrado</TabsTrigger>
            <TabsTrigger value="backup">Backup</TabsTrigger>
            <TabsTrigger value="templates">Textos Padrão</TabsTrigger>
            <TabsTrigger value="references">Valores de Referência</TabsTrigger>
          </TabsList>

          <TabsContent value="clinic">
            <ClinicSettings settings={settings} onSave={saveSettings} />
          </TabsContent>

          <TabsContent value="letterhead">
            <LetterheadSettings settings={settings} onSave={saveSettings} />
          </TabsContent>

          <TabsContent value="templates">
            <TemplatesManager templates={templates} onUpdate={loadTemplates} />
          </TabsContent>

          <TabsContent value="references">
            <ReferenceValuesManager values={referenceValues} onUpdate={loadReferenceValues} />
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
          <Button type="submit" data-testid="save-clinic-settings-button">
            Salvar Configurações
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
