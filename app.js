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
   FOTO → JPEG <= 380 KB
   ========================= */
const MAX_IMAGE_BYTES = 380 * 1024;
const MAX_SOURCE_BYTES = 20 * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 1600;

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function carregarImagem(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Não foi possível ler a imagem."));
    };
    img.src = url;
  });
}

async function comprimirImagem(file) {
  if (file.size > MAX_SOURCE_BYTES) {
    throw new Error("A foto original excede 20 MB.");
  }

  const img = await carregarImagem(file);
  let largura = img.naturalWidth || img.width;
  let altura = img.naturalHeight || img.height;

  const escalaInicial = Math.min(
    1,
    MAX_IMAGE_DIMENSION / Math.max(largura, altura)
  );

  largura = Math.max(1, Math.round(largura * escalaInicial));
  altura = Math.max(1, Math.round(altura * escalaInicial));

  for (let tentativaDimensao = 0; tentativaDimensao < 6; tentativaDimensao++) {
    const canvas = document.createElement("canvas");
    canvas.width = largura;
    canvas.height = altura;

    const ctx = canvas.getContext("2d", { alpha: false });
    ctx.drawImage(img, 0, 0, largura, altura);

    for (let qualidade = 0.82; qualidade >= 0.42; qualidade -= 0.06) {
      const blob = await new Promise(resolve =>
        canvas.toBlob(resolve, "image/jpeg", qualidade)
      );

      if (blob && blob.size <= MAX_IMAGE_BYTES) {
        return {
          blob,
          base64: await blobToBase64(blob),
          mimeType: "image/jpeg"
        };
      }
    }

    largura = Math.round(largura * 0.85);
    altura = Math.round(altura * 0.85);
  }

  throw new Error("Não foi possível comprimir a foto para menos de 380 KB.");
}

/* =========================
   FOTOS
   ========================= */
document
  .querySelectorAll("[data-categoria]")
  .forEach(input => {
    input.addEventListener("change", async function() {
      const file = this.files[0];
      if (!file) return;

      try {
        const resultado = await comprimirImagem(file);

        const foto = {
          categoria: this.dataset.categoria,
          nome: file.name,
          mimeType: resultado.mimeType,
          base64: resultado.base64
        };

        fotos.push(foto);

        const div = document.createElement("div");
        const imgPreview = document.createElement("img");
        imgPreview.src = URL.createObjectURL(resultado.blob);
        imgPreview.onload = () => URL.revokeObjectURL(imgPreview.src);

        const small = document.createElement("small");
        small.textContent =
          `${foto.categoria} — ${Math.round(resultado.blob.size / 1024)} KB`;

        div.appendChild(imgPreview);
        div.appendChild(small);
        $("photoPreview").appendChild(div);
      } catch (erroFoto) {
        console.error(erroFoto);
        alert(erroFoto.message || "Não foi possível processar a foto.");
      } finally {
        this.value = "";
      }
    });
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
