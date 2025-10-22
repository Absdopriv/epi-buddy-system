import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { AlertTriangle, Edit2 } from "lucide-react";
import { EPI, Funcionario } from "@/types";
import { differenceInDays, parseISO } from "date-fns";

interface EPIsVencidasProps {
  epis: EPI[];
  funcionarios: Funcionario[];
  onUpdateCA: (epi: EPI) => void;
}

export const EPIsVencidas = ({ epis, funcionarios, onUpdateCA }: EPIsVencidasProps) => {
  
  const getExpiredEPIs = () => {
    return epis
      .filter(epi => {
        const days = differenceInDays(parseISO(epi.validade), new Date());
        return days < 0;
      })
      .sort((a, b) => parseISO(a.validade).getTime() - parseISO(b.validade).getTime());
  };

  const getDaysExpired = (validade: string) => {
    return Math.abs(differenceInDays(parseISO(validade), new Date()));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  const getFuncionarioNome = (funcionarioId?: string) => {
    if (!funcionarioId) return "Não atribuído";
    const funcionario = funcionarios.find(f => f.id === funcionarioId);
    return funcionario?.nome || "Desconhecido";
  };

  const expiredEPIs = getExpiredEPIs();

  return (
    <Card className="animate-in fade-in duration-500">
      <CardHeader className="bg-destructive">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-6 w-6 text-destructive-foreground" />
          <CardTitle className="text-destructive-foreground">
            EPIs Vencidas ({expiredEPIs.length})
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {expiredEPIs.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              Nenhum EPI vencido no momento
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>CA</TableHead>
                  <TableHead>Validade</TableHead>
                  <TableHead>Dias Vencida</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Funcionário</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expiredEPIs.map((epi) => (
                  <TableRow key={epi.id} className="bg-destructive/5">
                    <TableCell className="font-medium">{epi.nome}</TableCell>
                    <TableCell>{epi.ca}</TableCell>
                    <TableCell>{formatDate(epi.validade)}</TableCell>
                    <TableCell>
                      <Badge variant="destructive">
                        {getDaysExpired(epi.validade)} dias
                      </Badge>
                    </TableCell>
                    <TableCell>{epi.tipo}</TableCell>
                    <TableCell>
                      <Badge variant={epi.funcionarioId ? "secondary" : "outline"}>
                        {getFuncionarioNome(epi.funcionarioId)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => onUpdateCA(epi)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
