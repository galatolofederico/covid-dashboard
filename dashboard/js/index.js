
/* Global Variables */

layers = undefined
sequences = undefined
time_ref = undefined

page = "Mappa"

sequence = "Contagiati"
time_sequence = undefined

animation = -1
current_time = 0

map = undefined;
infoBox = undefined
currentlayer = undefined;
feature_persist = false

table = undefined

chart = undefined

namesMap = undefined;

/* *********  */


/* Functions */


function getMap(){
  mapmargin = $("#navbar").outerHeight(true) + $("#sliderContainer").outerHeight(true) + 0.1*$(window).height()
  $('#map').css("height", ($(window).height() - mapmargin))

  var map = L.map('map', {
      center: [41.9028, 12.4964],
      zoomSnap: 0.1,
  })

  map.fitBounds([
    [47.438004, 3.678534],
    [36.544542, 18.931975]
  ])

  L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map)

  return map
}


function highlightFeature(layer) {
  currentlayer.resetStyle()

  layer.setStyle({
      weight: 3,
      color: '#666',
      dashArray: '',
      fillOpacity: 0.7
  })

  if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
      layer.bringToFront()
  }
  infoBox.update(layer.feature.properties)
}

function resetHighlight() {
  currentlayer.resetStyle()
  infoBox.update()
}

function onEachFeature(feature, layer) {
  layer.on({
      mouseover: e => {
          if(!feature_persist) highlightFeature(e.target)
      },
      mouseout: e => {
          if(!feature_persist) resetHighlight()
      },
      click: e => {
          stopAnimation()
          feature_persist = true
          highlightFeature(e.target)
      }
  })
}


function addBox(map){
  infoBox = L.control()

  infoBox.onAdd = function (map) {
      this._div = L.DomUtil.create('div', 'info');
      this.update()
      return this._div
  }

  infoBox.reupdate = function () {
      this.update(this.lastprop)
      if(this.lastprop === undefined) return
      currentlayer.eachLayer(l => {
          if(this.lastprop.prov_acr) key = "prov_acr"
          else if(this.lastprop.reg_istat_code) key = "reg_istat_code"
          
          if(l.feature.properties[key] == this.lastprop[key]){
              highlightFeature(l)
          }
      })
  }

  infoBox.update = function (prop) {
      infoBox.lastprop = prop
      ret = "<h5>"+sequence+"</h5>"
      if(prop){
          if(time_sequence[prop.prov_acr]){
              key = prop.prov_acr
              name = prop.prov_name
          } 
          else if(time_sequence[prop.reg_istat_code]){
              key = prop.reg_istat_code
              name = prop.reg_name
          }
          if(time_sequence[key]){
              current_value = time_sequence[key][current_time]
              end_value = time_sequence[key][time_sequence[key].length - 1]
          }
          else{
              current_value = 0
              end_value = 0
          }
          current_date = time_ref[current_time]
          end_date = time_ref[time_ref.length - 1]
          ret += "<h6>"+name+"</h6><br />"
          ret += current_date+": "+current_value+"<br />"
          ret += end_date+": "+end_value+"<br />"
      } else {
          ret += "<h6>Tocca la mappa</h6>"
      }

      this._div.innerHTML = ret
      
  }

  infoBox.addTo(map)
}


function startAnimation(layers, time_ref, map){
    if(animation < 0){
        $("#playButton").removeClass("fa-play")
        $("#playButton").addClass("fa-pause")
        
        current_time = 0
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
    var hex = c.toString(16)
    return hex.length == 1 ? "0" + hex : hex
}

function rgbToHex(rgb) {
    return "#" + componentToHex(rgb[0]) + componentToHex(rgb[1]) + componentToHex(rgb[2]);
}

function getGradient(gradient, value){
    scale = 20
    value = Math.log(((scale-1)*value+1))/Math.log(scale)
    var w1 = 1 - value
    var w2 = value
    var rgb = [Math.round(gradient[0][0] * w1 + gradient[1][0] * w2),
        Math.round(gradient[0][1] * w1 + gradient[1][1] * w2),
        Math.round(gradient[0][2] * w1 + gradient[1][2] * w2)];
    return rgbToHex(rgb)
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
        }
      }
    return style    
}

function getMaxSequence(current_sequence){
    var seq_max = undefined
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
            if(data) res(data)
            else rej()
        })
    })
}

function addHandlers(){
    $("#buttonCol").mousedown(() => {
        if(animation < 0){
          feature_persist = false;
          resetHighlight();
          currentlayer.resetStyle()
          startAnimation(layers, time_ref, map)
        } else {
            stopAnimation()
        }
      })
  
      $("#slider").change(() => {
        stopAnimation()
        currentlayer.resetStyle()
        map.removeLayer(currentlayer)
        current_time = Math.round(($("#slider").val()/100)*(time_ref.length - 1));
        map.addLayer(layers[current_time])
        currentlayer = layers[current_time]
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
      
      $(".swipable").on("touchstart", function(event){
        var xClick = event.originalEvent.touches[0].pageX
        $(this).one("touchmove", function(event){
          var xMove = event.originalEvent.touches[0].pageX
          if( Math.floor(xClick - xMove) > 5 ){
              $("#carousel").carousel('next')
          }
          else if( Math.floor(xClick - xMove) < -5 ){
              $("#carousel").carousel('prev')
          }
        })
        $(".swipable").on("touchend", function(){
            $("#carousel").off("touchmove")
        })
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
        table.row.add([name, value]).draw()
    }
}

function clearChart(){
    if(chart) chart.destroy()
}

function buildChart(time_sequence){
    var ret = []
    for(var t = 0; t < time_ref.length;t++){
        var s = 0
        for(key in time_sequence){
            s += time_sequence[key][t]
        }
        ret.push(s)
    }
    var canvas = document.getElementById("chart")
    var ctx = canvas.getContext("2d")

    var gradient = ctx.createLinearGradient(0, 0, 0, 400)
    gradient.addColorStop(1, rgbToHex(current_sequence.gradient[0]))
    gradient.addColorStop(0, rgbToHex(current_sequence.gradient[1]))

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


    chart_margin = 30
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

/*  *******  */




/* Initialization */ 
$(document).ready(() => {
  addHandlers()
  $.getJSON("./assets/names.json", names => {
    namesMap = names
    table = $('#table').DataTable({
      "order": [[ 1, "desc" ]],
      scrollResize: true,
      scrollCollapse: true,
      paging: false,
      oLanguage: {
          sSearch: "Cerca",
          sInfo: ""
      }
    })
    getJSON("meta.json").then(meta => {
      sequences = meta.sequences
      buildDropdown(sequences)
      bootstrap()
    })
  })
})
/* ************ */