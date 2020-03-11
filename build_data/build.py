import pandas as pd
import json
import locale

locale.setlocale(locale.LC_ALL, "it_IT.utf8")

regioni_sequences = dict(
    terapia_intensiva=dict(),
    totale_ospedalizzati=dict(),
    isolamento_domiciliare=dict(),
    deceduti=dict(),
    tamponi=dict(),
    dimessi_guariti=dict(),
)

province_sequences = dict(
    totale_casi=dict()
)


def create_sequences(serie, gb, sequences, dates_rage):
    elem = serie[gb].iloc[0]
    for d0, d1 in zip(dates_rage, dates_rage[1:]):
        mask = (serie['data'] >= d0) & (serie['data'] <= d1)
        for key in sequences.keys():
            if elem not in sequences[key]: sequences[key][elem] = []
            sequences[key][elem].append(
                serie[mask][key].tolist()[-1]
            )


# Province

prov_df = pd.read_csv("./raw_data/dpc-covid19-ita-province.csv")
prov_df['data'] =  pd.to_datetime(prov_df['data'])
prov_df.sort_values(by="data")
prov_dates_rage = pd.date_range(min(prov_df["data"]) - pd.DateOffset(1), max(prov_df["data"]), freq='D')
prov_df.groupby("sigla_provincia").apply(
     create_sequences, "sigla_provincia",
     province_sequences, prov_dates_rage
)
prov_dates_rage = pd.date_range(min(prov_df["data"]), max(prov_df["data"]), freq='D')



# Regioni

reg_df = pd.read_csv("./raw_data/dpc-covid19-ita-regioni.csv", dtype={"codice_regione": str})
reg_df['data'] =  pd.to_datetime(reg_df['data'])
reg_df.sort_values(by="data")
reg_dates_rage = pd.date_range(min(reg_df["data"]) - pd.DateOffset(1), max(reg_df["data"]), freq='D')
reg_df.groupby("codice_regione").apply(
     create_sequences, "codice_regione",
     regioni_sequences, reg_dates_rage
)
reg_dates_rage = pd.date_range(min(reg_df["data"]), max(reg_df["data"]), freq='D')

for key, data in province_sequences.items():    
    open("data/"+key+".json", "w").write(json.dumps(data))

for key, data in regioni_sequences.items():    
    open("data/"+key+".json", "w").write(json.dumps(data))


open("data/meta.json", "w").write(json.dumps(
    dict(
        sequences={
            "Contagiati": dict(
                map="province.geojson",
                sequence="totale_casi.json",
                time_ref=prov_dates_rage.strftime("%d %B").tolist(),
                gradient=[[255, 252, 181], [255, 10, 10]]
            ),
            "Ospedalizzati": dict(
                map="regioni.geojson",
                sequence="totale_ospedalizzati.json",
                time_ref=reg_dates_rage.strftime("%d %B").tolist(),
                gradient=[[186, 224, 255], [0, 140, 255]]
            ),
            "Terapia Intensiva": dict(
                map="regioni.geojson",
                sequence="terapia_intensiva.json",
                time_ref=reg_dates_rage.strftime("%d %B").tolist(),
                gradient=[[232, 207, 255],[138, 10, 255]]
            ),
            "Tamponi": dict(
                map="regioni.geojson",
                sequence="tamponi.json",
                time_ref=reg_dates_rage.strftime("%d %B").tolist(),
                gradient=[[255, 212, 245],[255, 15, 199]],
            ),
            "Guariti": dict(
                map="regioni.geojson",
                sequence="dimessi_guariti.json",
                time_ref=reg_dates_rage.strftime("%d %B").tolist(),
                gradient=[[210, 255, 207],[48, 204, 20]]
            ),
            "Deceduti": dict(
                map="regioni.geojson",
                sequence="deceduti.json",
                time_ref=reg_dates_rage.strftime("%d %B").tolist(),
                gradient=[[230, 230, 230],[69, 69, 69]]
            ),
        },
    )
))