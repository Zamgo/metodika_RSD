---
title: "X.Y.Z - Krátký název dílčí činnosti"
typ: dilci_cinnost
oznaceni: "X.Y.Z"
popis: ""
zdroj: ""
faze: []
etapa: []
R - Odpovědnost za provádění činnosti: []
A - Právní odpovědnost za dokončení činnosti: []
C - Konzultace v průběhu činnosti: []
I - Informování po dokončení činnosti: []
workflow: []
stav: draft
procesni_oblast: ""
cinnost: ""
vstupy: []
vystupy: []
navazane_workflow: []
predchozi_cinnost: ""
nasledujici_cinnost: ""
nastroj: []
rezim_cinnosti: ""
spousteci_udalost: []
opakovatelnost: ""
casove_pravidlo: ""
casova_poznamka: ""
lhuta: ""
lhuta_typ: ""
ukoncovaci_podminka: ""
poznamka_k_ukonceni: ""
---

> Šablona pro novou dílčí činnost. Před uložením do `03_Oblasti správy informací/` přejmenuj soubor (`X.Y.Z - Nazev cinnosti.md`) a vyplň pole dle tabulky níže. Pole označená [doporučené] vyplň, pokud existuje smysluplná hodnota — chybějící hodnota nesmí blokovat publikaci.

## Vyplňovací návod

### Identitní vrstva (povinné)

| Klíč | Co vyplnit | Příklad |
|---|---|---|
| `title` | Plný název s ID na začátku | `"4.5.1 - Sloučení TIDP do MIDP"` |
| `oznaceni` | Hierarchické ID dle ISO 19650 RACI matice | `"4.5.1"` |
| `typ` | Vždy `dilci_cinnost` u listových činností | `dilci_cinnost` |

### Kontextová vrstva (povinné u nových)

| Klíč | Co vyplnit | Číselník |
|---|---|---|
| `procesni_oblast` | Wikilink na nadřazenou procesní oblast (1–8) | — |
| `cinnost` | Wikilink na nadřazenou činnost (X.Y) | — |
| `faze` | Hrubá fáze ISO 19650 | [[Ciselnik fazi]] |
| `etapa` | Detailní etapa stavebního projektu | [[Ciselnik etap]] |
| `zdroj` | Volný text s konkrétní referencí | — |

### Procesní vrstva (vyplňuj postupně)

| Klíč | Co vyplnit |
|---|---|
| `R/A/C/I` role | Wikilinky na role z [[Ciselnik roli]] |
| `vstupy` / `vystupy` | Wikilinky na dokumenty/artefakty |
| `predchozi_cinnost` / `nasledujici_cinnost` | Wikilink v sekvenci |
| `navazane_workflow` | Wikilinky na CDE workflow |
| `nastroj` | Seznam CDE nástrojů |

### Časová vrstva (doporučené pro nové činnosti)

| Klíč | Co vyplnit | Číselník |
|---|---|---|
| `rezim_cinnosti` | Jak se činnost chová [volitelné] | [[Ciselnik rezimu cinnosti]] |
| `spousteci_udalost` | 1–3 hodnoty, co aktivuje [doporučené] | [[Ciselnik spousteci udalost]] |
| `opakovatelnost` | Frekvence opakování [doporučené] | [[Ciselnik opakovatelnosti]] |
| `casove_pravidlo` | Pozice vůči spouštěcí události [volitelné, default `po`] | [[Ciselnik casoveho pravidla]] |
| `casova_poznamka` | Slovní upřesnění času [volitelné] | volný text |
| `lhuta` | Konkrétní časový limit [volitelné] | volný text |
| `lhuta_typ` | Klasifikace lhůty [volitelné] | [[Ciselnik typu lhut]] |
| `ukoncovaci_podminka` | Kdy je činnost dokončená [doporučené] | [[Ciselnik ukoncovacich podminek]] |
| `poznamka_k_ukonceni` | Slovní upřesnění ukončení [volitelné] | volný text |

## Pravidla zápisu

- Klíče i ID hodnoty číselníků jsou **česky bez diakritiky** (snake_case): `bim_odevzdani_modelu`, `ve_lhute`, `priprava_zakazky`.
- Pole označená v [[Pravidla metadat]] jako seznam se vždy zapisují jako seznam (`[]` i pro prázdnou hodnotu, `[hodnota]` i pro jednu).
- `casove_pravidlo` se nevyplňuje, pokud platí default `po` (reaktivní činnost).
- Pokud činnost potřebuje hodnotu, která není v číselníku — **nejprve doplň hodnotu do číselníku**, pak ji použij ve frontmatteru.
- Workflow pro novou hodnotu: **číselník -> seed -> první použití v činnosti**. Seed soubor je `[[00_Podklady/_seed_metadata_hodnoty]]`.
- Nepoužívej anglické technické názvy klíčů (`affected_phases`, `trigger_events`, ...) — vault drží českou konvenci.

## Tělo stránky (doporučená struktura)

```markdown
# Popis
(Co činnost dělá, kdo ji řídí, proč existuje.)

# Vstupy
- Konkrétní dokumenty/artefakty

# Postup
(Kroky, sekvence, role.)

# Výstupy
- Konkrétní výstupy

# Kontrolní body pro správce stavby
- (Co Správce stavby kontroluje.)
```

## Příklady plně vyplněných činností

- ISO 19650 reaktivní: viz [[Pravidla metadat]] sekce „Příklad frontmatteru — Dílčí činnost".
- FIDIC se smluvní lhůtou: viz [[Pravidla metadat]] sekce „Dílčí činnost s FIDIC vazbou a smluvní lhůtou".
