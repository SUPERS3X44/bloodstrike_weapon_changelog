#!/usr/bin/env python3
"""
Valida que data/manifest.json y cada archivo en data/weapons/ tengan
la estructura esperada. Pensado para correr en un GitHub Action en
cada Pull Request, pero también sirve correrlo a mano:

    python3 scripts/validar_datos.py
"""
import json
import os
import sys

RAIZ = os.path.join(os.path.dirname(__file__), "..")
MANIFEST = os.path.join(RAIZ, "data", "manifest.json")
CARPETA_ARMAS = os.path.join(RAIZ, "data", "weapons")

CAMPOS_NUMERICOS_SIMPLES = ["cadencia", "retroceso", "movilidad", "alcance"]
CAMPOS_DANO = ["cabeza", "torso", "extremidades"]
CAMPOS_PRECISION = ["apuntando", "cadera"]

errores = []


def error(msg):
    errores.append(msg)


def es_numero(v):
    return isinstance(v, (int, float)) and not isinstance(v, bool)


def validar_arma(nombre_archivo, arma):
    prefijo = f"data/weapons/{nombre_archivo}"

    for campo in ["id", "nombre", "categoria"]:
        if not isinstance(arma.get(campo), str) or not arma.get(campo).strip():
            error(f"{prefijo}: falta el campo de texto '{campo}'")

    if arma.get("id") and arma["id"] != nombre_archivo.replace(".json", ""):
        error(f"{prefijo}: el campo 'id' ('{arma.get('id')}') no coincide con el nombre de archivo")

    dano = arma.get("dano")
    if not isinstance(dano, dict):
        error(f"{prefijo}: falta el objeto 'dano'")
    else:
        for campo in CAMPOS_DANO:
            if not es_numero(dano.get(campo)):
                error(f"{prefijo}: 'dano.{campo}' debe ser un número")

    for campo in CAMPOS_NUMERICOS_SIMPLES:
        if not es_numero(arma.get(campo)):
            error(f"{prefijo}: '{campo}' debe ser un número")

    precision = arma.get("precision")
    if not isinstance(precision, dict):
        error(f"{prefijo}: falta el objeto 'precision'")
    else:
        for campo in CAMPOS_PRECISION:
            if not es_numero(precision.get(campo)):
                error(f"{prefijo}: 'precision.{campo}' debe ser un número")

    actualizado = arma.get("actualizado")
    if not isinstance(actualizado, dict):
        error(f"{prefijo}: falta el objeto 'actualizado' (fecha/por)")


def main():
    if not os.path.isfile(MANIFEST):
        error("No se encontró data/manifest.json")
    else:
        with open(MANIFEST, encoding="utf-8") as f:
            try:
                manifest = json.load(f)
            except json.JSONDecodeError as e:
                error(f"data/manifest.json no es un JSON válido: {e}")
                manifest = []

        if not isinstance(manifest, list):
            error("data/manifest.json debe ser una lista de nombres de archivo")
            manifest = []

        for nombre_archivo in manifest:
            ruta = os.path.join(CARPETA_ARMAS, nombre_archivo)
            if not os.path.isfile(ruta):
                error(f"data/manifest.json menciona '{nombre_archivo}' pero ese archivo no existe")
                continue
            with open(ruta, encoding="utf-8") as f:
                try:
                    arma = json.load(f)
                except json.JSONDecodeError as e:
                    error(f"data/weapons/{nombre_archivo} no es un JSON válido: {e}")
                    continue
            validar_arma(nombre_archivo, arma)

        # Archivos huérfanos: existen pero no están en el manifiesto
        if os.path.isdir(CARPETA_ARMAS):
            listados = set(manifest)
            for nombre_archivo in os.listdir(CARPETA_ARMAS):
                if nombre_archivo.endswith(".json") and nombre_archivo not in listados:
                    error(f"data/weapons/{nombre_archivo} existe pero no está listado en data/manifest.json")

    if errores:
        print(f"Se encontraron {len(errores)} problema(s):\n")
        for e in errores:
            print(f"  - {e}")
        sys.exit(1)

    print("Todo OK: manifiesto y archivos de armas con formato válido.")


if __name__ == "__main__":
    main()
