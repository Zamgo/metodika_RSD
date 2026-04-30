---
title: Ciselnik ukoncovacich podminek
typ: catalog
faze: []
stav: draft
permalink: /sprava-obsahu/ciselnik-ukoncovacich-podminek
aliases: [Číselník ukončovacích podmínek]
---

## Použití

Tento číselník je jediný zdroj hodnot pro metadata `ukoncovaci_podminka`. Říká, kdy se činnost považuje za dokončenou — jaký event, výstup nebo stav signalizuje uzavření.

Pole je single-select.

K poli `ukoncovaci_podminka` je vhodné mít volný text `poznamka_k_ukonceni` pro upřesnění (kdo schvaluje, kde je výstup uložen, kontrola bez zjištění apod.).

## Hodnoty (ID)

| ID | label |
|---|---|
| `vystup_vytvoren` | Výstup vytvořen |
| `vystup_odevzdan` | Výstup odevzdán |
| `vystup_zkontrolovan` | Výstup zkontrolován |
| `vystup_schvalen` | Výstup schválen |
| `vystup_publikovan` | Výstup publikován |
| `pripominky_vyporadany` | Připomínky vypořádány |
| `issue_uzavreno` | Issue uzavřeno |
| `zmena_schvalena` | Změna schválena |
| `zmena_zamitnuta` | Změna zamítnuta |
| `claim_oznamen` | Claim oznámen |
| `claim_vyhodnocen` | Claim vyhodnocen |
| `rozhodnuti_vydano` | Rozhodnutí vydáno |
| `zaznam_proveden` | Záznam proveden |
| `data_importovana` | Data importována |
| `predani_potvrzeno` | Předání potvrzeno |
| `kontrola_bez_zjisteni` | Kontrola bez zjištění |
| `napravne_opatreni_provedeno` | Nápravné opatření provedeno |
| `faze_uzavrena` | Fáze uzavřena |
| `cinnost_neni_dale_relevantni` | Činnost není dále relevantní |

## Příklady použití

```yaml
ukoncovaci_podminka: vystup_schvalen
poznamka_k_ukonceni: "Schváleno zadavatelem v CDE."
```

```yaml
ukoncovaci_podminka: pripominky_vyporadany
poznamka_k_ukonceni: "Všechny připomínky mají stav uzavřeno."
```

```yaml
ukoncovaci_podminka: claim_oznamen
poznamka_k_ukonceni: "Notice bylo odesláno ve smluvní lhůtě dle FIDIC SC 20.2.1."
```
