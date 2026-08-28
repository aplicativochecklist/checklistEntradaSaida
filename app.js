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


/* ==================================================
   NAVEGAÇÃO
================================================== */

function mostrarTela(id) {

  document
    .querySelectorAll(".screen")
    .forEach(screen =>
      screen.classList.remove("active")
    );

  $(id).classList.add("active");

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

}


/* ==================================================
   CHECKLIST
================================================== */

function criarChecklist() {

  $("items").innerHTML =

    ITENS.map((item, index) => `

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

    `).join("");


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


          if (this.value === "AVARIA") {

            item.classList.add("avaria");

            textarea.required = true;

          } else {

            item.classList.remove("avaria");

            textarea.required = false;

            if (this.value !== "AVARIA") {
              textarea.value = "";
            }

          }

        }
      );

    });

}


/* ==================================================
   RESET
================================================== */

function limparFormulario() {

  $("checklistForm").reset();

  fotos = [];

  $("photoPreview").innerHTML = "";

  criarChecklist();

}


/* ==================================================
   REDIMENSIONAR E COMPRIMIR FOTO
================================================== */

function prepararFoto(file) {

  return new Promise((resolve, reject) => {

    const reader =
      new FileReader();


    reader.onload = function(event) {

      const img =
        new Image();


      img.onload = function() {

        const MAX_WIDTH = 1600;

        const MAX_HEIGHT = 1600;


        let width =
          img.width;

        let height =
          img.height;


        if (
          width > MAX_WIDTH ||
          height > MAX_HEIGHT
        ) {

          const proporcao =
            Math.min(
              MAX_WIDTH / width,
              MAX_HEIGHT / height
            );

          width =
            Math.round(
              width * proporcao
            );

          height =
            Math.round(
              height * proporcao
            );

        }


        const canvas =
          document.createElement("canvas");


        canvas.width =
          width;

        canvas.height =
          height;


        const ctx =
          canvas.getContext("2d");


        ctx.drawImage(
          img,
          0,
          0,
          width,
          height
        );


        const qualidade = 0.78;


        const dataURL =
          canvas.toDataURL(
            "image/jpeg",
            qualidade
          );


        const base64 =
          dataURL.split(",")[1];


        resolve({

          base64:
            base64,

          mimeType:
            "image/jpeg",

          tamanho:
            Math.round(
              (base64.length * 3) / 4
            )

        });

      };


      img.onerror =
        reject;


      img.src =
        event.target.result;

    };


    reader.onerror =
      reject;


    reader.readAsDataURL(file);

  });

}


/* ==================================================
   FOTOS
================================================== */

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


        try {

          $("loading")
            .classList
            .remove("hidden");


          const fotoProcessada =
            await prepararFoto(file);


          const foto = {

            categoria:
              this.dataset.categoria,

            nome:
              file.name,

            mimeType:
              fotoProcessada.mimeType,

            base64:
              fotoProcessada.base64

          };


          fotos.push(foto);


          const div =
            document.createElement("div");


          div.innerHTML = `

            <img
              src="${URL.createObjectURL(file)}">

            <small>
              ${foto.categoria}
            </small>

          `;


          $("photoPreview")
            .appendChild(div);


          this.value = "";


        } catch (erro) {

          console.error(
            "Erro ao processar foto:",
            erro
          );


          alert(
            "Não foi possível processar a foto."
          );

        } finally {

          $("loading")
            .classList
            .add("hidden");

        }

      }
    );

  });


/* ==================================================
   COLETAR DADOS
================================================== */

function coletarDados() {

  const itens =

    ITENS.map(
      (descricao, index) => {

        const status =
          document.querySelector(
            `input[name="item_${index}"]:checked`
          );


        const observacao =
          document
            .querySelectorAll(
              ".item textarea"
            )[index]
            .value
            .trim();


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
      $("cliente").value.trim(),

    equipamento:
      $("equipamento").value.trim(),

    modelo:
      $("modelo").value.trim(),

    chassi:
      $("chassi").value.trim(),

    os:
      $("os").value.trim(),

    horimetro:
      $("horimetro").value,

    responsavel:
      $("responsavel").value.trim(),

    filial:
      $("filial").value.trim(),

    observacoes:
      $("observacoes").value.trim(),

    itens:
      itens,

    fotos:
      fotos

  };

}


/* ==================================================
   ENVIAR CHECKLIST
================================================== */

$("checklistForm")
  .addEventListener(
    "submit",
    async function(event) {

      event.preventDefault();


      const dados =
        coletarDados();


      /* ---------------------------------------------
         VERIFICA AVARIA
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
          "Existe uma avaria registrada.\n\nInclua pelo menos uma foto antes de finalizar."
        );

        return;

      }


      /* ---------------------------------------------
         GARANTE QUE TODOS OS ITENS FORAM RESPONDIDOS
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

        return;

      }


      /* ---------------------------------------------
         LOADING
      --------------------------------------------- */

      $("loading")
        .classList
        .remove("hidden");


      try {


        /* -------------------------------------------
           ENVIO
        ------------------------------------------- */

        const resposta =
          await fetch(
            API_URL,
            {

              method:
                "POST",

              headers: {

                "Content-Type":
                  "text/plain;charset=utf-8"

              },

              body:
                JSON.stringify(dados)

            }
          );


        if (!resposta.ok) {

          throw new Error(
            "O servidor retornou o erro HTTP " +
            resposta.status
          );

        }


        const texto =
          await resposta.text();


        let resultado;


        try {

          resultado =
            JSON.parse(texto);

        } catch (erroJSON) {

          console.error(
            "Resposta recebida:",
            texto
          );

          throw new Error(
            "O servidor não retornou uma resposta válida."
          );

        }


        /* -------------------------------------------
           ERRO DO APPS SCRIPT
        ------------------------------------------- */

        if (!resultado.ok) {

          throw new Error(
            resultado.message ||
            "Erro ao salvar checklist."
          );

        }


        /* -------------------------------------------
           SUCESSO
        ------------------------------------------- */

        $("protocolo")
          .textContent =
          resultado.protocolo;


        mostrarTela(
          "success"
        );


      } catch (erro) {

        console.error(
          "Erro no envio:",
          erro
        );


        let mensagem =
          erro.message ||
          "Erro desconhecido";


        if (
          mensagem === "Load failed" ||
          mensagem === "Failed to fetch"
        ) {

          mensagem =
            "Não foi possível comunicar com o servidor.\n\n" +
            "Verifique sua conexão com a internet e tente novamente.";

        }


        alert(

          "Não foi possível salvar o checklist.\n\n" +
          mensagem

        );


      } finally {

        $("loading")
          .classList
          .add("hidden");

      }

    }
  );


/* ==================================================
   TIPO DE CHECKLIST
================================================== */

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


/* ==================================================
   BOTÃO VOLTAR
================================================== */

$("btnVoltar").onclick =
  () =>
    mostrarTela(
      "home"
    );


/* ==================================================
   NOVO CHECKLIST
================================================== */

$("btnNovo").onclick =
  () => {

    limparFormulario();

    mostrarTela(
      "home"
    );

  };


/* ==================================================
   INÍCIO
================================================== */

$("btnInicio").onclick =
  () =>
    mostrarTela(
      "home"
    );


/* ==================================================
   INICIALIZAÇÃO
================================================== */

criarChecklist();
