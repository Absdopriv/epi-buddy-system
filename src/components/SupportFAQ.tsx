import { HelpCircle, Mail, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export const SupportFAQ = () => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const supportEmail = "suporte.EPIControl@gmail.com";

  const copyEmail = () => {
    navigator.clipboard.writeText(supportEmail);
    setCopied(true);
    toast({
      title: "Email copiado!",
      description: "O email de suporte foi copiado para sua área de transferência.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const faqs = [
    {
      question: "Como cadastrar um novo EPI?",
      answer: "Acesse a aba 'Cadastro de EPI' no menu principal, preencha os dados do equipamento (nome, CA, validade) e clique em 'Adicionar EPI'."
    },
    {
      question: "Como atribuir um EPI a um funcionário?",
      answer: "Vá até a aba 'Gerenciar Funcionários e EPIs', selecione o funcionário desejado, escolha o EPI disponível e clique em 'Atribuir EPI'."
    },
    {
      question: "Como verificar EPIs vencidos?",
      answer: "Acesse a aba 'EPIs Vencidas' para visualizar todos os equipamentos com validade expirada ou próxima do vencimento."
    },
    {
      question: "Posso exportar os dados em PDF?",
      answer: "Sim! Nas tabelas de funcionários e EPIs, há botões para gerar relatórios em PDF com todas as informações."
    },
    {
      question: "Como atualizar o CA de um EPI?",
      answer: "Na tabela de EPIs, clique no botão 'Atualizar CA' do equipamento desejado para modificar o certificado e a validade."
    },
    {
      question: "Os dados são salvos automaticamente?",
      answer: "Sim, todos os dados são salvos automaticamente no navegador. Para backup em nuvem, faça login no sistema."
    }
  ];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/20"
        >
          <HelpCircle className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Suporte</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Central de Ajuda</DialogTitle>
          <DialogDescription>
            Perguntas frequentes sobre o sistema de gestão de EPIs
          </DialogDescription>
        </DialogHeader>
        
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-left">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="mt-6 p-4 bg-muted rounded-lg border">
          <div className="flex items-start gap-3">
            <Mail className="h-5 w-5 text-primary mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold mb-1">Não encontrou sua resposta?</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Entre em contato conosco por email:
              </p>
              <div className="flex items-center gap-2">
                <code className="px-3 py-2 bg-background rounded border text-sm flex-1">
                  {supportEmail}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={copyEmail}
                  className="shrink-0"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copiar
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
