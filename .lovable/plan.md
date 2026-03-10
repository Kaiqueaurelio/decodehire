

## Problema

O jsPDF usa a fonte Helvetica por padrao, que **nao suporta caracteres Unicode** como acentos em portugues (a, e, o, c) e emojis (📋, ✅, ❌, etc). Isso causa caracteres estranhos/quebrados no PDF.

## Solucao

Trocar a abordagem: em vez de renderizar texto diretamente com jsPDF (que exige embed de fontes Unicode), vamos usar **html2canvas** para capturar o conteudo visualmente como imagem e inserir no PDF. Isso garante que tudo apareca exatamente como na tela, incluindo acentos, emojis e formatacao.

### Alteracoes

**