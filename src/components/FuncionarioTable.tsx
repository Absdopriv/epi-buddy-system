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
import { Trash2 } from "lucide-react";
import { Funcionario } from "@/types";
import { toast } from "sonner";

interface FuncionarioTableProps {
  funcionarios: Funcionario[];
  onDelete: (id: string) => void;
}

export const FuncionarioTable = ({ funcionarios, onDelete }: FuncionarioTableProps) => {
  const handleDelete = (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este funcionário?")) {
      onDelete(id);
      toast.success("Funcionário excluído com sucesso!");
    }
  };

  return (
    <Card className="animate-in fade-in duration-500">
      <CardHeader className="bg-gradient-primary">
        <CardTitle className="text-primary-foreground">Lista de Funcionários</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>CPF</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Setor</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {funcionarios.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Nenhum funcionário cadastrado
                  </TableCell>
                </TableRow>
              ) : (
                funcionarios.map((func) => (
                  <TableRow key={func.id}>
                    <TableCell className="font-medium">{func.nome}</TableCell>
                    <TableCell>{func.cpf}</TableCell>
                    <TableCell>{func.cargo}</TableCell>
                    <TableCell>{func.setor}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(func.id)}
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
