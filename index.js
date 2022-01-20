const SOURCE_1_FILE_PATH = "source1.csv"
const SOURCE_12_FILE_PATH = "source2.csv"
const REFRESH_TIME = 1.5 //seconds

function csvJSON(csv) {
    var lines = csv.split("\n");
    var result = [];
    var headers = lines[0].split(",");

    for (var i = 1; i < lines.length - 1; i++) {
        var obj = {};
        var currentline = lines[i].split(",");
        for (var j = 0; j < headers.length; j++) {
            obj[headers[j]] = currentline[j];
        }
        result.push(obj);
    }
    return result;
}

window.onload = setupLoading()

function setupLoading() {
    loadData()
    setInterval(() => {
        loadData()
    }, REFRESH_TIME * 1000)
}

async function loadData() {
    let source_1_data = await fetch(SOURCE_1_FILE_PATH).then(response => response.text()).then(v => csvJSON(v)).catch(err => console.log(err))
    let source_2_data = await fetch(SOURCE_12_FILE_PATH).then(response => response.text()).then(v => csvJSON(v)).catch(err => console.log(err))
    parseData(source_1_data, source_2_data)
}


async function parseData(source_1_data, source_2_data) {
    let result_data = []
    source_2_data.forEach(record => {
        let row_record = {
            asset: record.asset,
            url: `https://www.tradingview.com/chart/KuCj8hlP/?symbol=${record.tickerUSDT}&interval=60`,
            totalQty: Math.round(record.totalQty * 100) / 100,
            currentValueUSD: Number(Number(record.totalUSDT).toFixed(2)),
        }
        row_record.totalCost = (() => {
            let latest_record = source_1_data.find(element => element.instrument === record.asset)
            return Number((Number(latest_record.avgCost) * Number(record.totalQty)).toFixed(2))
        })()

        row_record.profitLoss_usdt = Number((row_record.currentValueUSD - row_record.totalCost).toFixed(2))
        row_record.profitLossPercentage = calcPercent(row_record.totalCost, row_record.profitLoss_usdt)
        if (row_record.profitLossPercentage > 0) {
            row_record.color_class = 'text-success'
        } else {
            row_record.color_class = 'text-danger'
        }
        result_data.push(row_record)
    });
    parseDataToTable(result_data)
}

function calcPercent(totalCost, profitLoss_usdt) {
    return Number(((profitLoss_usdt * 100) / totalCost).toFixed(2))
}

function parseDataToTable(result_data) {
    resetTable()
    result_data.forEach((record) => {
        var myTbody = document.querySelector("#stats>tbody");
        myTbody.insertRow();
        var newRow = myTbody.insertRow();
        newRow.insertCell().append(record.asset);
        let urlCell = newRow.insertCell();
        urlCell.colSpan = 6
        urlCell.innerHTML = `<a href="${record.url}" target="_blank">${record.url}</a>`
        newRow.insertCell().append(record.totalQty);
        newRow.insertCell().append(record.totalCost);
        newRow.insertCell().append(record.currentValueUSD);

        let profitLossCell = newRow.insertCell();
        profitLossCell.className = record.color_class
        profitLossCell.append(record.profitLoss_usdt)
        let profitLossPercentageCell = newRow.insertCell();
        profitLossPercentageCell.className = record.color_class
        profitLossPercentageCell.append(`${record.profitLossPercentage} %`)
    })
}

function resetTable() {
    console.log(`%c Table refreshed at ${ new Date()}`, 'background-color: green; color: #fff; padding: 1px;')
    var myTable = document.getElementById("stats");
    var rowCount = myTable.rows.length;
    for (var x = rowCount - 1; x > 1; x--) {
        myTable.deleteRow(x);
    }
}