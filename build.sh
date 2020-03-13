#! /bin/bash

csv_regioni="https://raw.githubusercontent.com/pcm-dpc/COVID-19/master/dati-regioni/dpc-covid19-ita-regioni.csv"
csv_province="https://raw.githubusercontent.com/pcm-dpc/COVID-19/master/dati-province/dpc-covid19-ita-province.csv"


echo "Downloading data..."
rm parser/raw_data/*
curl $csv_regioni > parser/raw_data/dpc-covid19-ita-regioni.csv
curl $csv_province > parser/raw_data/dpc-covid19-ita-province.csv
echo "Parsing data..."
cd parser || exit
if [ ! -d "env" ]; then
    echo "Creating virtualenv and installing dependecies..."
    virtualenv --python=python3 env
    . ./env/bin/activate
    pip install -r requirements.txt
fi
. ./env/bin/activate
python build.py
cp data/* ../dashboard/assets/
cd ..
echo "Building dashboard..."
cd dashboard || exit
if [ ! -d "node_modules" ]; then
    echo "Installing dashboard dependecies..."
    npm install
fi
npx webpack
cd ..
rm -rf dist
cp -r dashboard/dist dist
echo "Dashboard ready in folder 'dist'"