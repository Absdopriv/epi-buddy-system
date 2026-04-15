import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { EPI } from "@/types";

interface ViewEPIModalProps {
  epi: EPI | null;
  open: boolean;
  onClose: () => void;
}

export const ViewEPIModal = ({ epi, open, onClose }: ViewEPIModalProps) => {
  if (!epi) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader className="bg-gradient-primary -mx-6 -mt-6 px-6 py-4 mb-4 rounded-t-lg">
          <DialogTitle className="text-primary-foreground">Detalhes do EPI</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Nome</p>
              <p className="font-medium">{epi.nome}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">CA</p>
              <Badge variant="outline">{epi.ca}</Badge>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Validade</p>
              <p className="font-medium">{formatDate(epi.validade)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tipo (Finalidade)</p>
              <p className="font-medium">{epi.tipo}</p>
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Modo de Uso</p>
            <p className="font-medium">{epi.uso || "—"}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Fabricante</p>
              <p className="font-medium">{epi.fabricante || "—"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Data de Entrega</p>
              <p className="font-medium">{formatDate(epi.entrega)}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
