
function getMap(){
    mapmargin = $("#navbar").outerHeight(true) + $("#sliderContainer").outerHeight(true) + 0.1*$(window).height()
    $('#map').css("height", ($(window).height() - mapmargin))

    var map = L.map('map', {
        center: [41.9028, 12.4964],
        zoomSnap: 0.3,
        zoom: 5.3,
    })

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

function resetHighlight(layer) {
    currentlayer.resetStyle()
    infoBox.update()
}

feature_persist = false
function onEachFeature(feature, layer) {
    layer.on({
        mouseover: e => {
            if(!feature_persist) highlightFeature(e.target)
        },
        mouseout: e => {
            if(!feature_persist) resetHighlight(e.target)
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