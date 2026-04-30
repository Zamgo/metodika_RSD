---
title: Ciselnik spousteci udalost
typ: catalog
faze: []
stav: draft
permalink: /sprava-obsahu/ciselnik-spousteci-udalost
aliases: [Číselník spouštěcích událostí]
---

## Použití

Tento číselník je jediný zdroj hodnot pro metadata `spousteci_udalost`. Popisuje konkrétní událost nebo situaci, která činnost aktivuje.

Pole je multi-select. **Doporučení: 1–3 hodnoty na činnost.** Pokud má činnost 5+ spouštěcích událostí, je pravděpodobně příliš obecná a měla by se rozdělit na více činností.

## Konvence zápisu

Hodnoty mají pevný formát `<kategorie>_<konkretni_udalost>` v ID stylu (snake_case bez diakritiky).

Lidský label je tvořen prefixem kategorie před em-dash, např. `BIM – odevzdání modelu`. Kategorie nese sémantiku — kategorii nevedeme jako samostatný klíč, je součástí ID hodnoty.

## Kategorie

- **Projekt** (`projekt_*`) — milníky životního cyklu projektu
- **Fáze** (`faze_*`) — přechody mezi fázemi
- **Dokumentace** (`dokumentace_*`) — události dokumentačního workflow
- **BIM** (`bim_*`) — události BIM/informačního workflow
- **CDE** (`cde_*`) — události v CDE
- **Smlouva** (`smlouva_*`) — smluvní události a FIDIC
- **Kontrola** (`kontrola_*`) — kontrolní a auditní události
- **Periodicky** (`periodicky_*`) — recurrence (zvažte spíš `opakovatelnost: periodicky`)
- **Provoz** (`provoz_*`) — provozní události po předání

## Poznámka k údržbě

Tento číselník je počáteční převzatá množina (~140 hodnot) z metodického návrhu. Při prvním reálném plnění činností v nové struktuře je očekáván **ruční průchod a redukce** — některé hodnoty se mohou ukázat jako zbytečné/duplicitní a budou odstraněny, jiné mohou být v praxi sloučeny.

---

## Projektové spouštěcí události

| ID | label |
|---|---|
| `projekt_zahajeni_projektu` | Projekt – zahájení projektu |
| `projekt_schvaleni_investicniho_zameru` | Projekt – schválení investičního záměru |
| `projekt_schvaleni_stavebniho_programu` | Projekt – schválení stavebního programu |
| `projekt_zahajeni_pripravy_zadani` | Projekt – zahájení přípravy zadání |
| `projekt_zahajeni_pripravy_zadavaci_dokumentace` | Projekt – zahájení přípravy zadávací dokumentace |
| `projekt_vyhlaseni_zakazky` | Projekt – vyhlášení zakázky |
| `projekt_vyber_dodavatele` | Projekt – výběr dodavatele |
| `projekt_uzavreni_smlouvy` | Projekt – uzavření smlouvy |
| `projekt_predani_staveniste` | Projekt – předání staveniště |
| `projekt_zahajeni_realizace` | Projekt – zahájení realizace |
| `projekt_ukonceni_realizace` | Projekt – ukončení realizace |
| `projekt_zahajeni_predani_stavby` | Projekt – zahájení předání stavby |
| `projekt_uvedeni_stavby_do_provozu` | Projekt – uvedení stavby do provozu |
| `projekt_zahajeni_provozni_faze` | Projekt – zahájení provozní fáze |

## Fázové spouštěcí události

| ID | label |
|---|---|
| `faze_zahajeni_faze` | Fáze – zahájení fáze |
| `faze_ukonceni_faze` | Fáze – ukončení fáze |
| `faze_prechod_do_dalsi_faze` | Fáze – přechod do další fáze |
| `faze_kontrola_pripravenosti` | Fáze – kontrola připravenosti |
| `faze_schvaleni_vystupu_faze` | Fáze – schválení výstupů fáze |
| `faze_rozhodnuti_o_pokracovani_projektu` | Fáze – rozhodnutí o pokračování projektu |
| `faze_pozastaveni_projektu` | Fáze – pozastavení projektu |
| `faze_obnoveni_projektu` | Fáze – obnovení projektu |

## Dokumentační spouštěcí události

| ID | label |
|---|---|
| `dokumentace_vznik_noveho_dokumentu` | Dokumentace – vznik nového dokumentu |
| `dokumentace_odevzdani_dokumentace` | Dokumentace – odevzdání dokumentace |
| `dokumentace_predlozeni_ke_kontrole` | Dokumentace – předložení dokumentace ke kontrole |
| `dokumentace_predlozeni_ke_schvaleni` | Dokumentace – předložení dokumentace ke schválení |
| `dokumentace_vraceni_s_pripominkami` | Dokumentace – vrácení dokumentace s připomínkami |
| `dokumentace_vyporadani_pripominek` | Dokumentace – vypořádání připomínek |
| `dokumentace_schvaleni_dokumentace` | Dokumentace – schválení dokumentace |
| `dokumentace_zamitnuti_dokumentace` | Dokumentace – zamítnutí dokumentace |
| `dokumentace_revize_dokumentace` | Dokumentace – revize dokumentace |
| `dokumentace_zmena_dokumentace` | Dokumentace – změna dokumentace |
| `dokumentace_vydani_nove_verze` | Dokumentace – vydání nové verze dokumentace |
| `dokumentace_archivace_dokumentace` | Dokumentace – archivace dokumentace |

## BIM / informační spouštěcí události

| ID | label |
|---|---|
| `bim_definice_informacnich_pozadavku` | BIM – definice informačních požadavků |
| `bim_predlozeni_bep` | BIM – předložení BEP |
| `bim_schvaleni_bep` | BIM – schválení BEP |
| `bim_aktualizace_bep` | BIM – aktualizace BEP |
| `bim_odevzdani_modelu` | BIM – odevzdání modelu |
| `bim_odevzdani_koordinacniho_modelu` | BIM – odevzdání koordinačního modelu |
| `bim_odevzdani_ifc` | BIM – odevzdání IFC |
| `bim_odevzdani_datove_sady` | BIM – odevzdání datové sady |
| `bim_milnik_informacniho_predani` | BIM – milník informačního předání |
| `bim_zjisteni_kolize` | BIM – zjištění kolize |
| `bim_vytvoreni_issue` | BIM – vytvoření issue |
| `bim_vyporadani_issue` | BIM – vypořádání issue |
| `bim_schvaleni_modelu` | BIM – schválení modelu |
| `bim_zamitnuti_modelu` | BIM – zamítnutí modelu |
| `bim_zmena_pozadavku_na_informace` | BIM – změna požadavků na informace |
| `bim_zmena_datoveho_standardu` | BIM – změna datového standardu |
| `bim_predani_dat_pro_provoz` | BIM – předání dat pro provoz |

## CDE spouštěcí události

| ID | label |
|---|---|
| `cde_zalozeni_projektu` | CDE – založení projektu v CDE |
| `cde_nastaveni_prav` | CDE – nastavení práv |
| `cde_zmena_prav` | CDE – změna práv |
| `cde_nahrani_kontejneru` | CDE – nahrání informačního kontejneru |
| `cde_zmena_stavu_kontejneru` | CDE – změna stavu informačního kontejneru |
| `cde_predani_kontejneru_ke_kontrole` | CDE – předání informačního kontejneru ke kontrole |
| `cde_schvaleni_kontejneru` | CDE – schválení informačního kontejneru |
| `cde_vraceni_kontejneru` | CDE – vrácení informačního kontejneru |
| `cde_publikace_dokumentu_nebo_modelu` | CDE – publikace dokumentu nebo modelu |
| `cde_archivace_kontejneru` | CDE – archivace informačního kontejneru |
| `cde_audit_cde` | CDE – audit CDE |

## Smluvní spouštěcí události

| ID | label |
|---|---|
| `smlouva_uzavreni_smlouvy` | Smlouva – uzavření smlouvy |
| `smlouva_pokyn_objednatele` | Smlouva – pokyn objednatele |
| `smlouva_pokyn_spravce_stavby` | Smlouva – pokyn správce stavby |
| `smlouva_zadost_o_zmenu` | Smlouva – žádost o změnu |
| `smlouva_vznik_zmeny` | Smlouva – vznik změny |
| `smlouva_schvaleni_zmeny` | Smlouva – schválení změny |
| `smlouva_zamitnuti_zmeny` | Smlouva – zamítnutí změny |
| `smlouva_vznik_claimove_udalosti` | Smlouva – vznik claimové události |
| `smlouva_oznameni_claimu` | Smlouva – oznámení claimu |
| `smlouva_predlozeni_claimu` | Smlouva – předložení claimu |
| `smlouva_rozhodnuti_o_claimu` | Smlouva – rozhodnutí o claimu |
| `smlouva_prodleni` | Smlouva – prodlení |
| `smlouva_preruseni_praci` | Smlouva – přerušení prací |
| `smlouva_obnoveni_praci` | Smlouva – obnovení prací |
| `smlouva_nepredvidatelna_okolnost` | Smlouva – nepředvídatelná okolnost |
| `smlouva_spor` | Smlouva – spor |
| `smlouva_dohoda_stran` | Smlouva – dohoda stran |

## Kontrolní spouštěcí události

| ID | label |
|---|---|
| `kontrola_interni_kontrola` | Kontrola – interní kontrola |
| `kontrola_externi_kontrola` | Kontrola – externí kontrola |
| `kontrola_technicke_review` | Kontrola – technické review |
| `kontrola_bim_review` | Kontrola – BIM review |
| `kontrola_kontrola_kvality` | Kontrola – kontrola kvality |
| `kontrola_kontrola_uplnosti` | Kontrola – kontrola úplnosti |
| `kontrola_kontrola_souladu_se_zadanim` | Kontrola – kontrola souladu se zadáním |
| `kontrola_kontrola_souladu_se_smlouvou` | Kontrola – kontrola souladu se smlouvou |
| `kontrola_kontrola_souladu_s_eir` | Kontrola – kontrola souladu s EIR |
| `kontrola_kontrola_souladu_s_bep` | Kontrola – kontrola souladu s BEP |
| `kontrola_kontrola_pred_fazovou_branou` | Kontrola – kontrola před fázovou bránou |
| `kontrola_audit` | Kontrola – audit |
| `kontrola_prejimka` | Kontrola – přejímka |
| `kontrola_zkouska` | Kontrola – zkouška |
| `kontrola_inspekce` | Kontrola – inspekce |

## Periodické spouštěcí události

> Poznámka: pro periodické činnosti zvažte spíš primárně `opakovatelnost: periodicky` + `rezim_cinnosti: periodicka`. Hodnoty níže jsou pro případ, kdy potřebuješ explicitně specifikovat, který typ recurrence.

| ID | label |
|---|---|
| `periodicky_denni_kontrola` | Periodicky – denní kontrola |
| `periodicky_tydenni_kontrolni_den` | Periodicky – týdenní kontrolní den |
| `periodicky_tydenni_bim_koordinace` | Periodicky – týdenní BIM koordinace |
| `periodicky_mesicni_reporting` | Periodicky – měsíční reporting |
| `periodicky_mesicni_uzaverka` | Periodicky – měsíční uzávěrka |
| `periodicky_kvartalni_review` | Periodicky – kvartální review |
| `periodicky_rocni_aktualizace` | Periodicky – roční aktualizace |
| `periodicky_pravidelna_aktualizace_registru` | Periodicky – pravidelná aktualizace registru |
| `periodicky_pravidelna_aktualizace_harmonogramu` | Periodicky – pravidelná aktualizace harmonogramu |
| `periodicky_pravidelna_aktualizace_rizik` | Periodicky – pravidelná aktualizace rizik |

## Provozní spouštěcí události

| ID | label |
|---|---|
| `provoz_predani_stavby` | Provoz – předání stavby |
| `provoz_predani_provozni_dokumentace` | Provoz – předání provozní dokumentace |
| `provoz_predani_asset_dat` | Provoz – předání asset dat |
| `provoz_import_dat_do_cafm` | Provoz – import dat do CAFM |
| `provoz_zahajeni_zkusebniho_provozu` | Provoz – zahájení zkušebního provozu |
| `provoz_ukonceni_zkusebniho_provozu` | Provoz – ukončení zkušebního provozu |
| `provoz_zahajeni_bezneho_provozu` | Provoz – zahájení běžného provozu |
| `provoz_zmena_aktiva` | Provoz – změna aktiva |
| `provoz_udrzbovy_zasah` | Provoz – údržbový zásah |
| `provoz_porucha` | Provoz – porucha |
| `provoz_reklamace` | Provoz – reklamace |
| `provoz_revize_zarizeni` | Provoz – revize zařízení |
| `provoz_aktualizace_pasportu` | Provoz – aktualizace pasportu |
| `provoz_vyrazeni_aktiva` | Provoz – vyřazení aktiva |
