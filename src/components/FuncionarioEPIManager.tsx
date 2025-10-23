import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Edit2, Trash2, Plus, AlertTriangle } from "lucide-react";
import { EPI, Funcionario, EPIAtribuicao } from "@/types";
import { toast } from "sonner";
import { differenceInDays, parseISO } from "date-fns";

interface FuncionarioEPIManagerProps {
  funcionarios: Funcionario[];
  epis: EPI[];
  atribuicoes: EPIAtribuicao[];
  onAssignEPI: (epiId: string, funcionarioId: string) => void;
  onUnassignEPI: (atribuicaoId: string) => void;
  onUpdateCA: (epi: EPI) => void;
  onDeleteEPI: (id: string) => void;
}

export const FuncionarioEPIManager = ({ 
  funcionarios, 
  epis,
  atribuicoes,
  onAssignEPI,
  onUnassignEPI,
  onUpdateCA,
  onDeleteEPI
}: FuncionarioEPIManagerProps) => {
  
  const getExpirationStatus = (validade: string) => {
    const days = differenceInDays(parseISO(validade), new Date());
    
    if (days < 0) {
      return { status: "expired", label: "Vencida", variant: "destructive" as const, days };
    } else if (days <= 30) {
      return { status: "warning", label: "Vence em breve", variant: "default" as const, days };
    }
    return { status: "valid", label: "Válida", variant: "secondary" as const, days };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este EPI?")) {
      onDeleteEPI(id);
      toast.success("EPI excluído com sucesso!");
    }
  };

  return (
    <div className="space-y-6">
      {funcionarios.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            Nenhum funcionário cadastrado
          </CardContent>
        </Card>
      ) : (
        funcionarios.map((funcionario) => {
          const funcionarioAtribuicoes = atribuicoes.filter(at => at.funcionarioId === funcionario.id);
          const funcionarioEPIs = funcionarioAtribuicoes.map(at => {
            const epi = epis.find(e => e.id === at.epiId);
            return epi ? { ...epi, atribuicaoId: at.id } : null;
          }).filter(Boolean) as (EPI & { atribuicaoId: string })[];
          
          return (
            <Card key={funcionario.id} className="animate-in fade-in duration-500">
              <CardHeader className="bg-gradient-primary">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-primary-foreground">{funcionario.nome}</CardTitle>
                    <p className="text-sm text-primary-foreground/80 mt-1">
                      {funcionario.cargo} - {funcionario.setor}
                    </p>
                    <p className="text-xs text-primary-foreground/60 mt-1">
                      CPF: {funcionario.cpf}
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-sm">
                    {funcionarioEPIs.length} EPI(s)
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {/* Atribuir novo EPI */}
                {epis.length > 0 && (
                  <div className="mb-4 flex gap-2">
                    <Select onValueChange={(epiId) => onAssignEPI(epiId, funcionario.id)}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Atribuir EPI ao funcionário" />
                      </SelectTrigger>
                      <SelectContent>
                        {epis.map((epi) => (
                          <SelectItem key={epi.id} value={epi.id}>
                            {epi.nome} - CA: {epi.ca}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="icon">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {/* Tabela de EPIs do funcionário */}
                {funcionarioEPIs.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    Nenhum EPI atribuído a este funcionário
                  </p>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>CA</TableHead>
                          <TableHead>Validade</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {funcionarioEPIs.map((epi) => {
                          const expirationStatus = getExpirationStatus(epi.validade);
                          
                          return (
                            <TableRow key={epi.id}>
                              <TableCell className="font-medium">{epi.nome}</TableCell>
                              <TableCell>{epi.ca}</TableCell>
                              <TableCell>{formatDate(epi.validade)}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Badge variant={expirationStatus.variant}>
                                    {expirationStatus.label}
                                  </Badge>
                                  {expirationStatus.status === "expired" && (
                                    <AlertTriangle className="h-4 w-4 text-destructive" />
                                  )}
                                  {expirationStatus.status === "warning" && (
                                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                  )}
                                  {(expirationStatus.status === "warning" || expirationStatus.status === "expired") && (
                                    <span className="text-xs text-muted-foreground">
                                      {expirationStatus.days < 0 
                                        ? `${Math.abs(expirationStatus.days)} dias vencida` 
                                        : `${expirationStatus.days} dias`}
                                    </span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>{epi.tipo}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => onUpdateCA(epi)}
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => onUnassignEPI(epi.atribuicaoId)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
};
