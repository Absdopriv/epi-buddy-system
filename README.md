# Sistema Unificado de Gestão em Segurança do Trabalho

## Definição do Projeto
Este projeto consiste no desenvolvimento e integração de uma plataforma robusta para a gestão de Segurança do Trabalho. O sistema unifica três módulos anteriormente independentes — Formulários de Risco, Gestão de Projetos e Exame Admissional — em um ecossistema único, permitindo a centralização de dados e a otimização dos fluxos operacionais.

---

## Escopo Técnico e Arquitetura

### 1. Sistema de Exame Admissional
Desenvolvimento do módulo de controle de saúde ocupacional, compreendendo:
* **Levantamento de Requisitos:** Elaboração minuciosa de Requisitos Funcionais (RFs) para garantir o atendimento às normas regulamentadoras.
* **Modelagem de Dados e Processos:** Criação de diagramas UML (Caso de Uso, Classes e Sequência) para fundamentar a arquitetura antes da implementação.

### 2. Migração e Modernização (Módulo de Riscos)
Uma das etapas críticas do projeto foi a modernização do módulo de Formulários de Risco:
* **Refatoração de Stack:** Migração completa da camada de backend de Java para Node.js, visando maior escalabilidade e padronização com o restante da stack.
* **Persistência de Dados:** Modelagem e implementação de um novo banco de dados estruturado para suportar o volume de dados coletados.

### 3. Interface e Integração
* **Dashboard Unificado:** Desenvolvimento de uma interface centralizadora que gerencia o estado da aplicação após a autenticação segura do usuário.
* **Controle de Acesso:** Implementação de fluxos de login e cadastro integrados que direcionam o usuário aos três pilares do projeto.

---

## Engenharia e Qualidade de Software

* **Versionamento:** Gestão rigorosa de código utilizando Git, com segregação de repositórios para o ecossistema de Frontend e Backend.
* **Documentação Técnica:** Manutenção de documentação atualizada incluindo dicionário de dados, especificações de API e guias de implantação.
* **Padronização:** Aplicação de boas práticas de desenvolvimento para garantir a manutenibilidade do código a longo prazo.

---

## Stack Tecnológica

* **Backend:** Node.js
* **Frontend:** Frameworks Modernos (React/Vue)
* **Linguagens:** JavaScript / TypeScript
* **Banco de Dados:** SQL / NoSQL
* **Ferramentas de Engenharia:** UML, Git

---

## Conclusão
O projeto unificado entrega uma solução de alta coesão e baixo acoplamento. A transição tecnológica para Node.js e a centralização da interface resultaram num sistema significativamente mais ágil, pronto para escala industrial e com uma curva de aprendizado reduzida para o utilizador final.
