# covid-dashboard

Dashboard per la visualizzazione dei [dati forniti dalla Protezione Civile](https://github.com/pcm-dpc/COVID-19) relativi all'epidemia di COVID-19 in Italia.

[Disponibile qui](https://covid.galatolo.me/)


## Utilizzo

Il progetto si divide in due componenti:
* Parser (python) 
* Dashboard (html/js)

### Parser

Il codice relativo al parser si trova nella cartella `build_data`.

Per utilizzarlo occore:

Spostarsi all'interno della cartella e creare un `virtualenv`

```
cd build_data
virtualenv --python=python3.6 env
```

Attivare il `virtualenv` ed installare le dipendenze

```
. ./env/bin/activate && pip install -r requirements.txt
```

Lanciare lo script `build.py`
```
python build.py
```

Lo script genererà nella cartella `data` i file `json` necessari alla dashboard

### Dashboard

Il codice della dashboard si trova nella cartella `dashboard`.


Per generare il codice da mandare in produzione occorre:

Copiare i file generati da `build.py` nella cartella `assets`

```
cp build_data/data/*.json dashboard/assets/
```

Spostarsi all'interno della cartella `dashboard` ed installare le dipendenze con `npm`

```
cd dashboard && npm install
```

Lanciare webpack

```
npx webpack
```

Al termine i file pronti per la produzione saranno generati nella cartella `dist`


## Ridistribuire/Contribuire

La ridistribuzione del codice, integro o parziale, originale o modificato, è permessa nei limiti della licenza GNU/GPL Versione 3.

Ogni tipo di aiuto sotto qualsiasi forma è ovviamente ben accetto.