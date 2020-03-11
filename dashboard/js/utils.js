var currentlayer;

function startAnimation(layers, time_ref, map){
    if(animation < 0){
        $("#playButton").removeClass("fa-play")
        $("#playButton").addClass("fa-pause")
        
        current_time = 0;
        map.addLayer(layers[current_time])
        currentlayer = layers[current_time]
        $("#slider").val(0)
        $("#currentDate").text(time_ref[0])
        animation = setInterval(() => {
            layers[current_time].resetStyle()
            map.removeLayer(layers[current_time])
            current_time = (current_time + 1) % layers.length
            map.addLayer(layers[current_time])
            currentlayer = layers[current_time]
            $("#slider").val(100*(current_time/(layers.length-1)))
            $("#currentDate").text(time_ref[current_time])
        }, 500)
    }
}

function stopAnimation(){
    if(animation > 0){
        $("#playButton").removeClass("fa-pause")
        $("#playButton").addClass("fa-play")
        clearInterval(animation)
        animation = -1
    }
}

function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(rgb) {
    return "#" + componentToHex(rgb[0]) + componentToHex(rgb[1]) + componentToHex(rgb[2]);
}

function getGradient(gradient, value){
    scale = 20
    value = Math.log(((scale-1)*value+1))/Math.log(scale)
    var w1 = 1 - value;
    var w2 = value;
    var rgb = [Math.round(gradient[0][0] * w1 + gradient[1][0] * w2),
        Math.round(gradient[0][1] * w1 + gradient[1][1] * w2),
        Math.round(gradient[0][2] * w1 + gradient[1][2] * w2)];
    return rgbToHex(rgb);
}


function getStyle(current_sequence, gradient, max, t){
    function style(feature) {
        if (current_sequence[feature.properties.prov_acr] !== undefined){
            value = current_sequence[feature.properties.prov_acr][t]
        }
        else if (current_sequence[feature.properties.reg_istat_code] !== undefined) {
            value = current_sequence[feature.properties.reg_istat_code][t]
        } else {
            value = 0
        }
        return {
            fillColor: getGradient(gradient, value/max),
            weight: 2,
            opacity: 1,
            color: 'white',
            dashArray: '1',
            fillOpacity: 0.7
        };
      }
    return style    
}

function getMaxSequence(current_sequence){
    var seq_max = undefined;
    for(key in current_sequence){
        if(seq_max === undefined || Math.max(...current_sequence[key]) > seq_max)
            seq_max = Math.max(...current_sequence[key])
    }
    return seq_max
}

function getTimeData(current_sequence){
    return Promise.all([
        getJSON(current_sequence.map), getJSON(current_sequence.sequence)
    ])
}


function getAnimation(geoJson, current_sequence, time_ref){
    layers = []
    for(var t = 0;t < time_ref.length;t++){
        max = getMaxSequence(time_sequence)
        style = getStyle(time_sequence, current_sequence.gradient, max, t);
        layers.push(L.geoJson(
            geoJson, {
                style: style,
                onEachFeature: onEachFeature
            })
        )
    }
    return layers
}

function buildDropdown(available_sequences){
    for(elem in available_sequences){
        aElement = document.createElement("a")
        $(aElement).text(elem)
        $(aElement).addClass("dropdown-item")
        $(aElement).attr("href", "#")
        $(aElement).mousedown((el) => {
            sequence = el.target.text
            bootstrap()
        })
        $("#dropdownMenu").append(aElement)
    }
}


function getJSON(file){
    return new Promise((res, rej) => {
        $.getJSON("./assets/"+file, data => {
            if(data) res(data);
            else rej();
        })
    })
}

function addHandlers(){
    $("#buttonCol").mousedown(() => {
        if(animation < 0){
          currentlayer.resetStyle()
          startAnimation(layers, time_ref, map);
        } else {
            stopAnimation();
        }
      })
  
      $("#slider").change(() => {
        stopAnimation();
        currentlayer.resetStyle()
        map.removeLayer(currentlayer);
        current_time = Math.round(($("#slider").val()/100)*(time_ref.length - 1));
        map.addLayer(layers[current_time])
        currentlayer = layers[current_time];
        $("#currentDate").text(time_ref[current_time])
        infoBox.reupdate()
      })

      $("#carousel").on("slide.bs.carousel", e => {
          if(e.to == 0) page = "Mappa"
          if(e.to == 1) page = "Lista"
          if(e.to == 2) page = "Grafico"
          $("#pageName").text(page)
          bootstrap()
      })

      $("#infoButton").mousedown(() => {
        $("#alert").css("display", "block")
      })
}

function clearTable(){
    table.clear()
}

function buildTable(current_sequence){
    for(key in current_sequence){
        index = current_sequence[key].length - 1
        name = namesMap[key]
        value = current_sequence[key][index]
        table.row.add([name, value]).draw();
    }
}

function clearChart(){
    if(chart) chart.destroy()
}

function buildChart(time_sequence){
    var ret = []
    for(var t = 0; t < time_ref.length;t++){
        var s = 0;
        for(key in time_sequence){
            s += time_sequence[key][t]
        }
        ret.push(s)
    }
    var canvas = document.getElementById("chart");
    var ctx = canvas.getContext("2d");

    var gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(1, rgbToHex(current_sequence.gradient[0]));   
    gradient.addColorStop(0, rgbToHex(current_sequence.gradient[1]));

    var chartData = {
        labels: time_ref,
        datasets: [{
          data: ret,
          fill: true,
          backgroundColor: gradient
        }]
    }

    chart = new Chart(document.getElementById("chart"), {
    type: 'line',
    data: chartData,
    options: {
        scales: {
        yAxes: [{
            ticks: {
            beginAtZero: false
            }
        }]
        },
        legend: {
        display: false
        },
        responsive: true,
        maintainAspectRatio: false
     }
    })


    chart_margin = 30;
    card_padding = $('#chartContainer').innerHeight() - $('#chartContainer').height()
    $("#chartContainer").height(
        $(window).height() - ($("#navbar").outerHeight(true) + 0.1*$(window).height() + card_padding + chart_margin + 5)
    )
    $("#chartCard").css("margin-top", chart_margin/2)
    $("#chartCard").css("margin-bottom", chart_margin/2)

}


function initMap(){
    stopAnimation()
    if (currentlayer !== undefined) map.removeLayer(currentlayer)
    getJSON(current_sequence.map).then(geoJson => {
        layers = getAnimation(geoJson, current_sequence, time_ref)
        startAnimation(layers, time_ref, map)
    })
}


function bootstrap(){
    $("#dropdownCurrent").text(sequence)
    
    current_sequence = sequences[sequence]
    time_ref = current_sequence.time_ref
    getJSON(current_sequence.sequence).then( seq => {
        time_sequence = seq
        if (page == "Mappa"){
            if(map){
                map.off()
                map.remove()
            }
            map = getMap()
            feature_persist = false
            addBox(map)
            initMap(sequence)
        }
        if (page == "Lista"){
            clearTable()
            buildTable(time_sequence)
        }
        if (page == "Grafico"){
            clearChart()
            buildChart(time_sequence)
        }
    })
}