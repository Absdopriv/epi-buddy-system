import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { useState, useEffect } from "react";
import { EPI } from "@/types";
import { toast } from "sonner";

interface EditEPIModalProps {
  epi: EPI | null;
  open: boolean;
  onClose: () => void;
  onUpdate: (epi: EPI) => void;
}

export const EditEPIModal = ({ epi, open, onClose, onUpdate }: EditEPIModalProps) => {
  const [formData, setFormData] = useState({
    nome: "",
    ca: "",
    validade: "",
    tipo: "",
    uso: "",
    fabricante: "",
    entrega: "",
  });

  useEffect(() => {
    if (epi) {
      setFormData({
        nome: epi.nome,
        ca: epi.ca,
        validade: epi.validade,
        tipo: epi.tipo,
        uso: epi.uso,
        fabricante: epi.fabricante,
        entrega: epi.entrega,
      });
    }
  }, [epi]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (epi) {
      onUpdate({ ...epi, ...formData });
      toast.success("EPI atualizado com sucesso!");
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader className="bg-gradient-primary -mx-6 -mt-6 px-6 py-4 mb-4 rounded-t-lg">
          <DialogTitle className="text-primary-foreground">Editar EPI</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-epi-nome">Nome</Label>
              <Input id="edit-epi-nome" value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-epi-ca">CA</Label>
              <Input id="edit-epi-ca" value={formData.ca} onChange={(e) => setFormData({ ...formData, ca: e.target.value })} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-epi-validade">Validade</Label>
              <Input id="edit-epi-validade" type="date" value={formData.validade} onChange={(e) => setFormData({ ...formData, validade: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-epi-tipo">Tipo</Label>
              <Input id="edit-epi-tipo" value={formData.tipo} onChange={(e) => setFormData({ ...formData, tipo: e.target.value })} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-epi-uso">Modo de Uso</Label>
            <Textarea id="edit-epi-uso" value={formData.uso} onChange={(e) => setFormData({ ...formData, uso: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-epi-fabricante">Fabricante</Label>
              <Input id="edit-epi-fabricante" value={formData.fabricante} onChange={(e) => setFormData({ ...formData, fabricante: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-epi-entrega">Data de Entrega</Label>
              <Input id="edit-epi-entrega" type="date" value={formData.entrega} onChange={(e) => setFormData({ ...formData, entrega: e.target.value })} />
            </div>
          </div>
          <Button type="submit" className="bg-gradient-primary w-full">
            <Save className="h-4 w-4 mr-2" />
            Salvar Alterações
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
