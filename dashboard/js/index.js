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

table = undefined

chart = undefined

namesMap = undefined;

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
