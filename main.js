const Union = function (oldArr, newArr) {
    const arr = JSON.parse(JSON.stringify(oldArr));
    for (const elem of newArr)
        if (arr.indexOf(elem) < 0)
            arr.push(elem);
    return arr;
}

const FillMissingValues = function(valuesArray, defaultValue) {
    for (var i = 0; i < valuesArray.length; i++) {
        if (!valuesArray[i]) {
            valuesArray[i] = defaultValue;
        }
    }
}

const FixChartData = function (oldData, newData) {
    const final = {
        labels: Union(oldData.labels, newData.labels),
        previous: {
            name: oldData.name
        },
        current: {
            name: newData.name
        }
    };
    console.log("DATA..............", final)
    final.previous.values = new Array(final.labels.length);
    final.current.values = new Array(final.labels.length);

    for (var i = 0; i < oldData.values.length; i++) {
        var index = final.labels.indexOf(oldData.labels[i]);
        if (index > -1) {
            final.previous.values[index] = (final.previous.values[index] || 0) + oldData.values[i];
        }
    }

    for (var i = 0; i < newData.values.length; i++) {
        var index = final.labels.indexOf(newData.labels[i]);
        if (index > -1) {
            final.current.values[index] = (final.current.values[index] || 0) + newData.values[i];
        }
    }

    //fix array
    FillMissingValues(final.current.values, 0);
    FillMissingValues(final.previous.values, 0);

    console.log("FINAL", final, oldData, newData)
    final.labels.push("Total");
    final.previous.values.push(final.previous.values.reduce((acc, cur) => acc + cur, 0));
    final.current.values.push(final.current.values.reduce((acc, cur) => acc + cur, 0));
    return final;
}

const ToEuro = function (value) {
    return new Intl.NumberFormat(`pt-PT`, {
        currency: 'EUR',
        style: 'currency',
    }).format(value)
}

const CalcGrowth = function(data){
    return data.current.values.map((x, i) =>{
        const current = x || 0;
        const old = data.previous.values[i] || 1;
        const growth = ((current / old) - 1) * 100;
        console.log("Growth", `Current: ${current}`, `Old: ${old}`, `growth: ${growth}`, data, i, data.labels[i])
        return growth;
    });
}

const charts = [];
var balanceSheet = undefined;

function UpdateCharts(om, oy){
    const lastMonthData = balanceSheet.SetOldMonthData(om, oy);
    const currentMonthData = balanceSheet.GetCurrentMonthData();

    const data = FixChartData(lastMonthData, currentMonthData);

    const updateChart = function(chart, newData){
        console.log("updateChart", chart, chart.data)
        chart.data.labels = newData.labels;
        chart.data.datasets[0].label = newData.previous.name;
        chart.data.datasets[0].data = newData.previous.values;
        
        chart.data.datasets[1].data = newData.current.values;

        chart.data.datasets[2].data = CalcGrowth(newData);
        chart.update();
    };

    const updateMainChart = function(chart){
        updateChart(chart, data);
    };

    const updateFilteredCharts = function(chart, label){
        console.log("updateFilteredCharts", chart, label)
        const currentFiltered = balanceSheet.FilterCurrentDataBy(label);
        const oldFiltered = balanceSheet.FilterBy(om, oy, label);
        const filteredData = FixChartData(oldFiltered, currentFiltered);
        updateChart(chart, filteredData);
    }

    for(var i=0; i < charts.length; i++){
        console.log(i, i===0, charts[i])
        if(i===0) updateMainChart(charts[i]);
        else updateFilteredCharts(charts[i], data.labels[i-1]);
    }
}

// script.js
/*document.addEventListener('DOMContentLoaded', function () {
    // Fetch and process JSON data
    fetch('http://127.0.0.1:5500/data.json')
        .then(response => response.json())
        .then(data => {
*/function Main(data){
    
    
    balanceSheet = new BalanceSheet(data);
    const dates = balanceSheet.GetDates();
    //console.log("Dates", dates)
    DrawDatesLink(dates);
    
    const urlParams = new URLSearchParams(window.location.search);
    var currentDate = new Date();
    const cy = dates[0].id;
    const cm = dates[0].months[0].id
    currentDate.setMonth(currentDate.getMonth() - 1);
            const oy = urlParams.get('oy') || (dates[0].months.length > 1 ? dates[0].id : dates[1].id);
            const om = urlParams.get('om') || (dates[0].months.length > 1 ? dates[0].months[1].id : dates[1].months[0].id);
            currentDate.setDate(1);
            console.log("oy", oy, "om", om)
            const lastMonthData = balanceSheet.SetOldMonthData(om, oy);
            console.log("lastmonthdata", lastMonthData, om, oy)

            UpdateInfo(data, balanceSheet.GetTotal(cm, cy));

            const ctx = GetNewCanvasContext("Overview");// GetMainCanvasContext();
            //const lastMonthData = balanceSheet.GetMonthData(dates[0].months[0].id, dates[0].id);
            const currentMonthData = balanceSheet.SetCurrentMonthData(cm, cy);
            //console.log("monthData", monthData, data, lastMonthData)


            charts.push(AddMonthComparisonChart(ctx, FixChartData(lastMonthData, currentMonthData)));

            for (var label of currentMonthData.labels) {
                //console.log("label = ", label, monthData.labels, monthData.labels.length)
                const innerCtx = GetNewCanvasContext(label);
                const currentData = balanceSheet.FilterBy(cm, cy, label);
                const oldData = balanceSheet.FilterBy(om, oy, label);
                charts.push(AddMonthComparisonChart(innerCtx, FixChartData(oldData, currentData)));
            }
        }/*)
        .catch(error => console.error('Error fetching data:', error));*/
//});



function AddMonthComparisonChart(ctx, data) {
    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.labels,
            datasets: [
                {
                    label: data.previous.name,
                    data: data.previous.values,
                    backgroundColor: '#E0E0E0',
                    //borderColor: 'rgb(75, 192, 192)',
                    fill: false,
                    order: 1
                },
                {
                    label: data.current.name,
                    data: data.current.values,
                    backgroundColor: '#99CCFF',
                    fill: false,
                    order: 2
                },
                {
                    label: "Growth (%)",
                    data: CalcGrowth(data),
                    type: 'line',
                    yAxisID: 'y2',
                    fill: false,
                    borderColor: "#f00000",
                    backgroundColor: "#f00000",
                    order: 0,
                }
                // Add more datasets as needed
            ],
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    display: true,
                    type: 'logarithmic',
                    ticks: {
                        callback: function (value, index, ticks) {
                            return ToEuro(value || 0)
                        }
                    }
                },
                y2: {
                    type: 'linear',
                    offset: true,
                    fill: false,
                    position: 'right',
                    border: {
                        color: "#ff0000",
                    },
                    grid: {
                        color: 'rgba(255,0,0,0.2)',
                        borderColor: 'red'
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index',
            },
            plugins: {
                tooltip: {
                    filter: (item, data) => item.dataset.order > 0,
                    callbacks: {
                        label: function (tooltipItem, data) {
                            return ToEuro(tooltipItem.raw || 0) ;
                        },
                        footer: (tooltipItems) => {
                            if (tooltipItems.length < 1){
                                console.warn("out");
                                return ;
                            }
                            printGrowth = (val) => 'Growth: ' + val.toFixed(2) + ' %';
                            const actual = tooltipItems[1].parsed.y;
                            const old = tooltipItems[0].parsed.y;
                            console.log(old, actual, ((actual / (old > 0.00 ? old : 1)) - 1) * 100)
                            if (!actual || !old){
                                if(!actual && !old) return printGrowth(0);
                                if(!actual) return printGrowth(-100);
                                if(!old) return printGrowth(100);
                            }
                            const growth = ((actual / (old > 0.00 ? old : 1)) - 1) * 100;
                            return printGrowth(growth);
                        },
                    }
                }
            }
        }
    });
}



function PieChart(ctx, data) {
    return new Chart(ctx, {
        type: 'pie',
        data: {
            labels: [
              'Red',
              'Blue',
              'Yellow'
            ],
            datasets: [{
              label: 'My First Dataset',
              data: [300, 50, 100],
              backgroundColor: [
                'rgb(255, 99, 132)',
                'rgb(54, 162, 235)',
                'rgb(255, 205, 86)'
              ],
              hoverOffset: 4
            }]
          }
    });
}