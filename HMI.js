const db = new Dexie("BilancioFamiliare");
const currentYear = new Date().getFullYear();
db.version(1).stores({ movimenti: '++id, tipo, importo, data, categoria' });
let yValues = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
let yValues1 = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
let yValues2 = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

document.addEventListener('DOMContentLoaded', async function () {
    const year = document.getElementById('display-anno');
    const SendButton = document.getElementById('btn-spedisci');
    const ResetButton = document.getElementById('btn-reset-database');
    const money = document.getElementById('dato-testo');//importo soldi
    const date = document.getElementById('data-day'); //data della spesa
    const typeMoney = document.getElementById('tipo-descrizione'); //categoria se e cibo/telefono o altro
    const exportData = document.getElementById('btn-export');
    //const importData = document.getElementById('btn-import');


    if (year) {
        year.innerHTML = "ANNO:" + currentYear;
    }

    let numberMoney = 0;
    let typeInOrOut = 'Entrata';

    if (SendButton) {
        SendButton.addEventListener('click', function (evento) {
            if (isNumberOrString(money.value)) {
                if (Number(money.value) <= 0) {
                    alert("Per favore, inserisci un numero valido, cioè maggiore di 0!");
                    return;
                }
                else {
                    typeInOrOut = 'Entrata';
                    numberMoney = Number(money.value);
                    if (typeMoney.value != "Stipendio" && typeMoney.value != "Buoni Pasto") {
                        numberMoney = numberMoney * (-1);
                        typeInOrOut = 'Spesa';
                    }
                }
                console.log('Il bottone è stato cliccato!');
                AddDatabaseRow(typeInOrOut, numberMoney, date.value, typeMoney.value);
                updateTables();
            }
            else {
                alert("Nell'importo non hai inserito un numero!");
            }
        });
    }
    else {
        SendButton.log('SendButton not found');
    }

    if (ResetButton) {
        ResetButton.addEventListener('click', function (evento) {
            ResetDB();
            updateTables();
        });
    }
    else {
        console.log('ResetButton not found');
    }

    updateTables();

    if (exportData) {

        exportData.addEventListener('click', async function (evento) {
            const dataDBcheck = await getDb();
            if (dataDBcheck.length != 0) {
                const sheet = XLSX.utils.json_to_sheet(dataDBcheck);
                const folder = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(folder, sheet, "Dati " + currentYear);
                XLSX.writeFile(folder, `Contabilita_${currentYear}.xlsx`);
            }
        });
    }
    else {
        console.log('exportData not found');
    }

});

function importExcel() {
    let input = document.createElement('input');
    input.type = 'file';

    input.onchange = async (_) => {
        let file = Array.from(input.files);
        if ((file[0].name.endsWith(".xlsx") || file[0].name.endsWith(".xls")) && file.length != 0) {

            const data = await file[0].arrayBuffer();
            const workbook = XLSX.read(data, { type: 'array' });
            const jsonResult = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

            for (let indexItem = 0; indexItem < jsonResult.length; indexItem++) {
                AddDatabaseRow(jsonResult[indexItem].tipo, jsonResult[indexItem].importo, jsonResult[indexItem].data, jsonResult[indexItem].descrizione);
            }
            updateTables();
        }
        else {
            alert("Non è .xlsx il file che vuoi importare!");
        }
    };
    input.click();
}

async function updateTables() {

    let MonthData = [0, 0, 0];//Array(12).fill(0);
    let totalSum = [0, 0, 0];
    //let definitionMonth = [0, 0, 0];
    const arrayMonth = [['Settembre', 'Ottobre', 'Novembre', 'Dicembre', 'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto'],
    [8, 9, 10, 11, 0, 1, 2, 3, 4, 5, 6, 7]];//in java months start 0 to 11 with 11 december
    const TableRedd = document.getElementById('Redd');
    const TableSpes = document.getElementById('Spes');
    const TableRisp = document.getElementById('Risp');
    let priceMonth = 0;
    let dataDB = 0;
    let stringaDetails = "";
    //-------Updates tables------------//

    dataDB = await getDb();

    if (dataDB.length != 0 && TableRedd && TableSpes && TableRisp) {
        for (let index = 0; index < arrayMonth[0].length; index++) {
            priceMonth = document.getElementById(arrayMonth[0][index]);
            MonthData = [0, 0, 0];
            stringaDetails = "";
            await dataDB.forEach(indexItem => { //loop to read database
                let dataObj = new Date(indexItem.data);
                if (dataObj.getMonth() == arrayMonth[1][index]) { // if we are in index month then can contiune

                    let classeColore = indexItem.importo >= 0 ? "txt-verde" : "txt-rosso";
                    MonthData[0] += indexItem.importo;
                    stringaDetails += `<div class="${classeColore}">${indexItem.descrizione}:${indexItem.importo}€</div>`;
                    if (priceMonth) {

                        if (stringaDetails === "") stringaDetails = "Nessun movimento";

                        priceMonth.innerHTML = ` ${MonthData[0].toFixed(2)}
                        <div class="tooltip-dettaglio">
                        <strong>Dettaglio:</strong><hr style="border:0; border-top:1px solid #555;">
                        ${stringaDetails} </div>`;
                    }

                    if (indexItem.importo < 0) {
                        totalSum[0] += indexItem.importo;
                        MonthData[1] += (-1) * indexItem.importo;
                        TableSpes.innerHTML = totalSum[0];
                    }
                    else {
                        totalSum[1] += indexItem.importo;
                        MonthData[2] += indexItem.importo;
                        TableRedd.innerHTML = totalSum[1];
                    }

                    totalSum[2] = totalSum[0] + totalSum[1];
                    TableRisp.innerHTML = totalSum[2];
                }
            });
            if (MonthData.length) {
                yValues[index] = MonthData[0];
                yValues1[index] = MonthData[1];
                yValues2[index] = MonthData[2];
            }
        }
    }
    else {
        for (let index = 0; index < arrayMonth[0].length; index++) {
            priceMonth = document.getElementById(arrayMonth[0][index]);

            priceMonth.innerHTML = 0;
            TableRedd.innerHTML = 0;
            TableSpes.innerHTML = 0;
            TableRisp.innerHTML = 0;
        }
    }
    myChart.update();
    // console.log("Risparmio",yValues);
    //  console.log("Spesa",yValues1);
    // console.log("Reddito",yValues2);
    //console.log("Valori in tabella per grafico:", yValues);
}

async function AddDatabaseRow(tipo, importo, data, desc) {
    try {
        let dataDef = new Date(data).getFullYear();
        if (currentYear != dataDef) {
            alert("L'anno che hai inserito non corrisponde a quello in cui ci troviamo.Il dato non sara salvato.");
            return;
        }

        await db.movimenti.add({
            tipo: tipo, // "entrata" o "uscita"
            importo: parseFloat(importo),
            data: data, // formato "YYYY-MM-DD"
            descrizione: desc
        });
        console.log("Data saved!");
    } catch (e) {
        console.error("Error: " + e);
    }
}

async function ResetDB() {
    if (confirm("Sei sicuro di voler cancellare TUTTI i dati?")) {
        await db.movimenti.clear();
        await db.delete();
        location.reload();
        yValues = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        console.log("Database is clear.");
    }
}

function isNumberOrString(valueText) {
    let booleanFlag = true;
    if (isNaN(parseFloat(valueText)) || valueText.trim() === '') {
        booleanFlag = false;
    }
    return booleanFlag;
}

async function getDb() {
    const dataDB = await db.movimenti.toArray();
    return dataDB;
}

const xValues = ['Settembre', 'Ottobre', 'Novembre', 'Dicembre', 'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto'];


const myChart = new Chart("myChart", {
    type: "line",
    data: {
        labels: xValues,
        datasets: [{
            backgroundColor: "rgba(0, 0, 255, 0.98)",
            borderColor: "rgba(0, 0, 255, 0.98)",
            data: yValues,
            label: 'Risparmio mensile',
        },
        {
            backgroundColor: "rgba(245, 8, 8, 1)",
            borderColor: "rgba(255, 0, 0, 0.97)",
            data: yValues1,
            label: 'Spesa mensile',
        },
        {
            backgroundColor: "rgba(28, 245, 8, 1)",
            borderColor: "rgba(51, 255, 0, 0.97)",
            data: yValues2,
            label: 'Reddito mensile',
        }]
    },
    options: {
        plugins: {
            legend: true,
        }
    },
});

