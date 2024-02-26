const UpdateInfo = function (data, total) {
    document.getElementById('info-name').textContent = data.info.name;
    document.getElementById('info-total').textContent = ToEuro(total);
}

const GetMainCanvasContext = function () {
    return document.getElementById('comparison').getContext('2d');
}

const GetNewCanvasContext = function (title) {
    const chartsPlaceholder = document.getElementById('chart-container');
    
    const cardElem = document.createElement("div");
    cardElem.className = "card mt-5";
    const cardHeaderElem = document.createElement("div");
    cardHeaderElem.className = "card-header";
    cardHeaderElem.textContent = title;
    const cardBodyElem = document.createElement("div");
    cardBodyElem.className = "card-body";


    var elem = document.createElement("canvas");
    //chartsPlaceholder.appendChild(elem);

    cardBodyElem.appendChild(elem);
    cardElem.appendChild(cardHeaderElem);
    cardElem.appendChild(cardBodyElem);
    chartsPlaceholder.appendChild(cardElem);

    return elem.getContext('2d');
}

const DrawDatesLink = function (dates) {
    if (!dates) return;
console.log(dates)
    const container = document.getElementById("dates-comparison-links");
    dates
        .map((y, yi) => y.months.map((m,mi) => {
            if(yi == 0 && mi == 0) return null;
            return {
                year: {
                    text: y.name,
                    value: y.id
                },
                month:{
                    text: m.name,
                    value: m.id
                }
            }
        }))
        .flat(Infinity)
        .filter(x => x)
        .map(x => {
            var btnElem = document.createElement("button");
            btnElem.className = "btn btn-light mt-2 comp-btn";
            btnElem.type = "button";
            btnElem.textContent = `${x.month.text} ${x.year.text}`;
            btnElem.addEventListener('click', () => UpdateCharts(x.month.value, x.year.value));
            container.appendChild(btnElem);
        });
}

document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('inputDataFile').addEventListener('change', event => {
        const file = event.target.files[0];
        const reader = new FileReader();
        reader.onload = () => Main(JSON.parse(reader.result));
        reader.readAsText(file);
    });
    
    const urlParams = new URLSearchParams(window.location.search);
    const file = urlParams.get('file');
    if (file)
    {
        fetch(file)
        .then(response => {
            // Check if the request was successful
            if (!response.ok) {
                throw new Error(`Network response was not ok: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            Main(data);
        })
        .catch(error => console.error('Error during fetch:', error));
    }
});
//file:///C:/Users/tiago/Projects/github_dashboard/data.json