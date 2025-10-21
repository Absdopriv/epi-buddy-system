import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { EPI } from "@/types";
import { toast } from "sonner";

interface EPITableProps {
  epis: EPI[];
  onDelete: (id: string) => void;
  onUpdateCA: (epi: EPI) => void;
}

export const EPITable = ({ epis, onDelete, onUpdateCA }: EPITableProps) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR");
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este EPI?")) {
      onDelete(id);
      toast.success("EPI excluído com sucesso!");
    }
  };

  return (
    <Card className="animate-in fade-in duration-500">
      <CardHeader className="bg-gradient-primary">
        <CardTitle className="text-primary-foreground">Lista de EPIs</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Validade</TableHead>
                <TableHead>CA</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Fabricante</TableHead>
                <TableHead>Data Entrega</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {epis.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    Nenhum EPI cadastrado
                  </TableCell>
                </TableRow>
              ) : (
                epis.map((epi) => (
                  <TableRow key={epi.id}>
                    <TableCell className="font-medium">{epi.nome}</TableCell>
                    <TableCell>{formatDate(epi.validade)}</TableCell>
                    <TableCell>{epi.ca}</TableCell>
                    <TableCell>{epi.tipo}</TableCell>
                    <TableCell>{epi.fabricante}</TableCell>
                    <TableCell>{formatDate(epi.entrega)}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onUpdateCA(epi)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(epi.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
