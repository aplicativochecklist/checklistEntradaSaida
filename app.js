const API_URL =
  "https://script.google.com/macros/s/AKfycbz9IerVRS7Z-LWy0FfwQyhYQ563-AP42Yc7NPxQ4coR3blgSIgQO3fR9dWybBTAhet3/exec";


const ITENS = [

  "Estado geral",
  "Lataria / carenagens",
  "Pneus / rodas",
  "Vidros",
  "Espelhos",
  "Cabine",
  "Banco",
  "Painel",
  "Comandos",
  "Vazamentos aparentes",
  "Adesivos / identificação",
  "Implementos / acessórios",
  "Itens deixados pelo cliente",
  "Teste funcional"

];


let tipoChecklist = "";

let fotos = [];


const $ = id =>
  document.getElementById(id);


/* =================================================
   NAVEGAÇÃO
================================================= */

function mostrarTela(id) {

  document
    .querySelectorAll(".screen")
    .forEach(screen =>
      screen.classList.remove("active")
    );


  const tela = $(id);

  if (tela) {

    tela.classList.add("active");

  }


  window.scrollTo({

    top: 0,
    behavior: "smooth"

  });

}


/* =================================================
   CHECKLIST
================================================= */

function criarChecklist() {

  const container =
    $("items");


  if (!container)
    return;


  container.innerHTML =

    ITENS.map(
      (item, index) => `

        <div class="item">

          <div class="item-title">
            ${item}
          </div>


          <div class="options">

            <label>

              <input
                type="radio"
                name="item_${index}"
                value="OK"
                required>

              OK

            </label>


            <label>

              <input
                type="radio"
                name="item_${index}"
                value="AVARIA">

              Avaria

            </label>


            <label>

              <input
                type="radio"
                name="item_${index}"
                value="N/A">

              N/A

            </label>

          </div>


          <textarea
            rows="2"
            placeholder="Descreva a avaria...">
          </textarea>

        </div>

      `
    ).join("");


  document
    .querySelectorAll(".item input")
    .forEach(input => {

      input.addEventListener(
        "change",
        function() {

          const item =
            this.closest(".item");


          const textarea =
            item.querySelector("textarea");


          if (
            this.value === "AVARIA"
          ) {

            item.classList.add(
              "avaria"
            );

            textarea.required = true;

          } else {

            item.classList.remove(
              "avaria"
            );

            textarea.required = false;

          }

        }
      );

    });

}


/* =================================================
   RESET
================================================= */

function limparFormulario() {

  const formulario =
    $("checklistForm");


  if (formulario) {

    formulario.reset();

  }


  fotos = [];


  const preview =
    $("photoPreview");


  if (preview) {

    preview.innerHTML = "";

  }


  criarChecklist();

}


/* =================================================
   FOTO → BASE64
================================================= */

function arquivoBase64(file) {

  return new Promise(
    (resolve, reject) => {

      const reader =
        new FileReader();


      reader.onload =
        () => {

          const resultado =
            reader.result;


          const base64 =
            resultado
              .split(",")[1];


          resolve(base64);

        };


      reader.onerror =
        reject;


      reader.readAsDataURL(file);

    }
  );

}


/* =================================================
   FOTOS
================================================= */

document
  .querySelectorAll("[data-categoria]")
  .forEach(input => {

    input.addEventListener(
      "change",
      async function() {

        const file =
          this.files[0];


        if (!file)
          return;


        /* -----------------------------------------
           LIMITE DA FOTO
        ----------------------------------------- */

        if (
          file.size >
          8 * 1024 * 1024
        ) {

          alert(
            "A foto deve ter no máximo 8 MB."
          );


          this.value = "";


          return;

        }


        try {

          const base64 =
            await arquivoBase64(
              file
            );


          const foto = {

            categoria:
              this.dataset.categoria,

            nome:
              file.name,

            mimeType:
              file.type ||
              "image/jpeg",

            base64:
              base64

          };


          fotos.push(
            foto
          );


          /* ---------------------------------------
             PREVIEW
          --------------------------------------- */

          const div =
            document.createElement(
              "div"
            );


          const imagem =
            document.createElement(
              "img"
            );


          imagem.src =
            URL.createObjectURL(
              file
            );


          const legenda =
            document.createElement(
              "small"
            );


          legenda.textContent =
            foto.categoria;


          div.appendChild(
            imagem
          );


          div.appendChild(
            legenda
          );


          $("photoPreview")
            .appendChild(
              div
            );


          this.value = "";


        } catch (erro) {

          console.error(
            "Erro ao processar foto:",
            erro
          );


          alert(
            "Não foi possível processar a foto."
          );

        }

      }
    );

  });


/* =================================================
   COLETAR DADOS
================================================= */

function coletarDados() {


  const itens =
    ITENS.map(
      (descricao, index) => {


        const status =
          document.querySelector(
            `input[name="item_${index}"]:checked`
          );


        const textareas =
          document.querySelectorAll(
            ".item textarea"
          );


        const observacao =
          textareas[index]
            ? textareas[index]
                .value
                .trim()
            : "";


        return {

          descricao:
            descricao,

          status:
            status
              ? status.value
              : "",

          observacao:
            observacao

        };

      }
    );


  return {

    tipo:
      tipoChecklist,

    cliente:
      $("cliente")
        .value
        .trim(),

    equipamento:
      $("equipamento")
        .value
        .trim(),

    modelo:
      $("modelo")
        .value
        .trim(),

    chassi:
      $("chassi")
        .value
        .trim(),

    os:
      $("os")
        .value
        .trim(),

    horimetro:
      $("horimetro")
        .value,

    responsavel:
      $("responsavel")
        .value
        .trim(),

    filial:
      $("filial")
        .value
        .trim(),

    observacoes:
      $("observacoes")
        .value
        .trim(),

    itens:
      itens,

    fotos:
      fotos

  };

}


/* =================================================
   VALIDAR DADOS
================================================= */

function validarDados(dados) {


  if (!dados.tipo) {

    alert(
      "Selecione o tipo de checklist."
    );

    return false;

  }


  if (!dados.cliente) {

    alert(
      "Informe o cliente."
    );

    $("cliente").focus();

    return false;

  }


  if (!dados.equipamento) {

    alert(
      "Informe o equipamento."
    );

    $("equipamento").focus();

    return false;

  }


  if (!dados.chassi) {

    alert(
      "Informe o chassi / número de série."
    );

    $("chassi").focus();

    return false;

  }


  if (
    dados.horimetro === ""
  ) {

    alert(
      "Informe o horímetro."
    );

    $("horimetro").focus();

    return false;

  }


  if (!dados.responsavel) {

    alert(
      "Informe o responsável."
    );

    $("responsavel").focus();

    return false;

  }


  /* ---------------------------------------------
     VERIFICA TODOS OS ITENS
  --------------------------------------------- */

  const itemSemResposta =
    dados.itens.some(
      item =>
        !item.status
    );


  if (itemSemResposta) {

    alert(
      "Responda todos os itens do checklist antes de finalizar."
    );

    return false;

  }


  /* ---------------------------------------------
     AVARIA EXIGE FOTO
  --------------------------------------------- */

  const existeAvaria =
    dados.itens.some(
      item =>
        item.status === "AVARIA"
    );


  if (
    existeAvaria &&
    fotos.length === 0
  ) {

    alert(
      "Existe uma avaria registrada.\n\n" +
      "Inclua pelo menos uma foto antes de finalizar."
    );

    return false;

  }


  return true;

}


/* =================================================
   ENVIO
   MÉTODO COMPATÍVEL COM SAFARI / iPHONE

   NÃO USA FETCH.
================================================= */

$("checklistForm")
  .addEventListener(
    "submit",
    async function(event) {

      event.preventDefault();


      /* -------------------------------------------
         COLETA
      ------------------------------------------- */

      const dados =
        coletarDados();


      /* -------------------------------------------
         VALIDAÇÃO
      ------------------------------------------- */

      if (
        !validarDados(
          dados
        )
      ) {

        return;

      }


      /* -------------------------------------------
         LOADING
      ------------------------------------------- */

      $("loading")
        .classList
        .remove(
          "hidden"
        );


      try {


        /* -----------------------------------------
           IFRAME OCULTO
        ----------------------------------------- */

        let iframe =
          document.getElementById(
            "googleAppsScriptFrame"
          );


        if (!iframe) {

          iframe =
            document.createElement(
              "iframe"
            );


          iframe.id =
            "googleAppsScriptFrame";


          iframe.name =
            "googleAppsScriptFrame";


          iframe.style.display =
            "none";


          document.body.appendChild(
            iframe
          );

        }


        /* -----------------------------------------
           FORMULÁRIO OCULTO
        ----------------------------------------- */

        const form =
          document.createElement(
            "form"
          );


        form.method =
          "POST";


        form.action =
          API_URL;


        form.target =
          "googleAppsScriptFrame";


        form.style.display =
          "none";


        /* -----------------------------------------
           PAYLOAD

           O Apps Script deverá ler:

           e.parameter.payload
        ----------------------------------------- */

        const input =
          document.createElement(
            "input"
          );


        input.type =
          "hidden";


        input.name =
          "payload";


        input.value =
          JSON.stringify(
            dados
          );


        form.appendChild(
          input
        );


        document.body.appendChild(
          form
        );


        /* -----------------------------------------
           ENVIA
        ----------------------------------------- */

        form.submit();


        /* -----------------------------------------
           AGUARDA O PROCESSAMENTO

           Como o envio é feito por iframe,
           não utilizamos fetch/json.
        ----------------------------------------- */

        await new Promise(
          resolve =>
            setTimeout(
              resolve,
              7000
            )
        );


        /* -----------------------------------------
           MOSTRA SUCESSO

           O protocolo definitivo será tratado
           pelo backend / Code.gs.
        ----------------------------------------- */

        $("protocolo")
          .textContent =
          "Checklist enviado com sucesso";


        mostrarTela(
          "success"
        );


        /* -----------------------------------------
           LIMPA FORMULÁRIO TEMPORÁRIO
        ----------------------------------------- */

        setTimeout(
          () => {

            if (
              form &&
              form.parentNode
            ) {

              form.parentNode
                .removeChild(
                  form
                );

            }

          },
          1000
        );


      } catch (erro) {

        console.error(
          "Erro ao enviar checklist:",
          erro
        );


        alert(
          "Não foi possível enviar o checklist.\n\n" +
          (
            erro.message ||
            "Erro de comunicação com o servidor."
          )
        );


      } finally {

        $("loading")
          .classList
          .add(
            "hidden"
          );

      }

    }
  );


/* =================================================
   TIPO DE CHECKLIST
================================================= */

document
  .querySelectorAll("[data-tipo]")
  .forEach(botao => {

    botao.addEventListener(
      "click",
      function() {


        tipoChecklist =
          this.dataset.tipo;


        $("tipoBadge")
          .textContent =
          tipoChecklist;


        limparFormulario();


        mostrarTela(
          "formScreen"
        );

      }
    );

  });


/* =================================================
   BOTÃO VOLTAR
================================================= */

$("btnVoltar").onclick =
  () => {

    mostrarTela(
      "home"
    );

  };


/* =================================================
   NOVO CHECKLIST
================================================= */

$("btnNovo").onclick =
  () => {

    limparFormulario();


    mostrarTela(
      "home"
    );

  };


/* =================================================
   INÍCIO
================================================= */

$("btnInicio").onclick =
  () => {

    mostrarTela(
      "home"
    );

  };


/* =================================================
   INICIALIZAÇÃO
================================================= */

criarChecklist();
