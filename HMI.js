const db = new Dexie("BilancioFamiliare");
const currentYear = new Date().getFullYear();
db.version(1).stores({ movimenti: '++id, tipo, importo, data, categoria' });

document.addEventListener('DOMContentLoaded', async function () {

    const year = document.getElementById('display-anno');
    const SendButton = document.getElementById('btn-spedisci');
    const ResetButton = document.getElementById('btn-reset-database');
    const money = document.getElementById('dato-testo');//importo soldi
    const date = document.getElementById('data-day'); //data della spesa
    const typeMoney = document.getElementById('tipo-descrizione'); //categoria se e cibo/telefono o altro
    const exportData = document.getElementById('btn-export');

    if (year) {
        year.innerHTML = "ANNO:" + currentYear;
    }

    let numberMoney = 0;
    let typeInOrOut = 'Entrata';

    if (SendButton) {
        SendButton.addEventListener('click', function (evento) {
            if (Number(money.value) <= 0) {
                alert("Per favore, inserisci un numero valido, cioè maggiore di 0!");
                return;
            }
            else {
                typeInOrOut = 'Entrata';
                numberMoney = Number(money.value);
                if (typeMoney.value != "Stipendio/Altro") {
                    numberMoney = numberMoney * (-1);
                    typeInOrOut = 'Spesa';
                }
            }

            console.log('Il bottone è stato cliccato!');
            AddDatabaseRow(typeInOrOut, numberMoney, date.value, typeMoney.value);
            updateTables();
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

    if (exportData ) {

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

async function updateTables() {

    let MonthData = 0;//Array(12).fill(0);
    let totalSum = [0, 0];
    const arrayMonth = [['Settembre', 'Ottobre', 'Novembre', 'Dicembre', 'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto'],
    [8, 9, 10, 11, 0, 1, 2, 3, 4, 5, 6, 7]];//in java months start 0 to 11 with 11 december
    const TableRisp = document.getElementById('Risp');
    const TableSpes = document.getElementById('Spes');
    let priceMonth = 0;
    let dataDB = 0;
    let stringaDetails = "";
    //-------Updates tables------------//

    dataDB = await getDb();

    if (dataDB.length != 0 && TableRisp && TableSpes) {
        for (let index = 0; index < arrayMonth[0].length; index++) {
            priceMonth = document.getElementById(arrayMonth[0][index]);
            MonthData = 0;
            stringaDetails = "";
            await dataDB.forEach(indexItem => {
                let dataObj = new Date(indexItem.data);
                if (dataObj.getMonth() == arrayMonth[1][index]) {

                    let classeColore = indexItem.importo >= 0 ? "txt-verde" : "txt-rosso";

                    MonthData += indexItem.importo;
                    stringaDetails += `<div class="${classeColore}">${indexItem.descrizione}:${indexItem.importo}€</div>`;
                    if (priceMonth) {

                        if (stringaDetails === "") stringaDetails = "Nessun movimento";

                        priceMonth.innerHTML = ` ${MonthData.toFixed(2)}
                        <div class="tooltip-dettaglio">
                        <strong>Dettaglio:</strong><hr style="border:0; border-top:1px solid #555;">
                        ${stringaDetails} </div>`;
                    }

                    if (indexItem.importo < 0) {
                        totalSum[0] += indexItem.importo;
                        TableSpes.innerHTML = totalSum[0];
                    }
                    else {
                        totalSum[1] += indexItem.importo;
                        TableRisp.innerHTML = totalSum[1];
                    }
                }
            });
        }
    }
    else {
        for (let index = 0; index < arrayMonth[0].length; index++) {
            priceMonth = document.getElementById(arrayMonth[0][index]);

            priceMonth.innerHTML = 0;
            TableRisp.innerHTML = 0;
            TableSpes.innerHTML = 0;
        }
    }
}

async function AddDatabaseRow(tipo, importo, data, desc) {
    try {
        let dataDef = new Date(data).getFullYear();
        if (currentYear != dataDef) {
            alert("Anno che hai inserito non corrisponde a quello in cui ci troviamo.Il dato non sara salvato.");
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
        console.log("Table is clear.");
    }
}

async function getDb() {
    const dataDB = await db.movimenti.toArray();
    return dataDB;
}

//------------------------------------------------------------------------not use------------------------------------------------
async function testDatabase() {
    try {
        await db.open();
        console.log("✅ Database connesso!");

        // Aggiungi un dato di prova
        await db.movimenti.add({
            tipo: "entrata",
            importo: 50,
            data: "2025-12-23",
            categoria: "regalo"
        });

        const tutti = await db.movimenti.toArray();
        console.log("Dati nel DB:", tutti);
    } catch (e) {
        console.error("Errore:", e);
    }
}