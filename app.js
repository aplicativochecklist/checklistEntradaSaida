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


/* =========================
   NAVEGAÇÃO
========================= */

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


/* =========================
   CHECKLIST
========================= */

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

          }

        }
      );

    });

}


/* =========================
   RESET
========================= */

function limparFormulario() {

  $("checklistForm").reset();

  fotos = [];

  $("photoPreview").innerHTML = "";

  criarChecklist();

}


/* =========================
   FOTO → BASE64
========================= */

function arquivoBase64(file) {

  return new Promise(
    (resolve, reject) => {

      const reader =
        new FileReader();

      reader.onload =
        () =>
          resolve(
            reader.result.split(",")[1]
          );

      reader.onerror = reject;

      reader.readAsDataURL(file);

    }
  );

}


/* =========================
   FOTOS
========================= */

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


        const base64 =
          await arquivoBase64(file);


        const foto = {

          categoria:
            this.dataset.categoria,

          nome:
            file.name,

          mimeType:
            file.type,

          base64:
            base64

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

      }
    );

  });


/* =========================
   COLETAR DADOS
========================= */

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
            status.value,

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


/* =========================
   ENVIAR
========================= */

$("checklistForm")
  .addEventListener(
    "submit",
    async function(event) {

      event.preventDefault();


      const dados =
        coletarDados();


      /*
       * Se houver avaria,
       * exige pelo menos uma foto.
       */

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
          "Existe uma avaria registrada. Inclua pelo menos uma foto."
        );

        return;

      }


      $("loading")
        .classList
        .remove("hidden");


      try {


        const resposta =
          await fetch(
            API_URL,
            {

              method: "POST",

              headers: {
                "Content-Type":
                  "text/plain;charset=utf-8"
              },

              body:
                JSON.stringify(dados)

            }
          );


        const resultado =
          await resposta.json();


        if (!resultado.ok) {

          throw new Error(
            resultado.message ||
            "Erro ao salvar checklist."
          );

        }


        $("protocolo")
          .textContent =
          resultado.protocolo;


        mostrarTela("success");


      } catch (erro) {

        console.error(erro);

        alert(
          "Não foi possível salvar o checklist.\n\n" +
          erro.message
        );


      } finally {

        $("loading")
          .classList
          .add("hidden");

      }

    }
  );


/* =========================
   TIPO DE CHECKLIST
========================= */

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


/* =========================
   BOTÕES
========================= */

$("btnVoltar").onclick =
  () => mostrarTela("home");


$("btnNovo").onclick =
  () => {

    limparFormulario();

    mostrarTela("home");

  };


$("btnInicio").onclick =
  () => mostrarTela("home");


/* =========================
   INICIALIZAÇÃO
========================= */

criarChecklist();
