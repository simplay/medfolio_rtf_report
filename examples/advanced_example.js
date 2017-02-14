// This is how an example letter/ report (within a "Briefschreibescript") might look like.
// This has been taken from an early version of the "Mutter Kind Austrittsbericht".
// The usage examples of the report.js classes can be found within the definition of 
// the functions #buildMutterTable and #buildKindTale .

var db = Application.CreateDBCursor();
var patNr = Application.CurrentKg.GetInfo("$Patient.PatNr$"); 
var fallNr = Application.CurrentKg.GetInfo("$Patient.VisitNr$");
var fullName = Application.CurrentKg.GetInfo("$Patient.Name$") + " " + Application.CurrentKg.GetInfo("$Patient.Firstname$");

// Fetches the kg_einträge kurztext by its kgtitel_nr
// of this "Fall Nr" & "Patient Nr".
// @param kgNr [Integer, String] kgtitel nr
// @return [String] kurztext of kg_eintraege entity that corresponds to the given kg_nr. 
function findByKg(kgNr) {
  return findColumnByKg("kurztext", kgNr);
}

// Fetches the kg_einträge kurztext by its kgtitel_nr
// of this "Fall Nr" & "Patient Nr".
// @param kgNr [Integer, String] kgtitel nr
// @return [String] kurztext of kg_eintraege entity that corresponds to the given kg_nr. 
function findColumnByKg(columnName, kgNr) {
  try {

    var sql = " select " + columnName + " as content ";
    sql += " from kgtitel kg, kg_eintraege kge ";
    sql += " where kg.nr = kge.kgtitel_nr ";
    sql += " and kg.nr = '" + kgNr.toString() + "'";
    sql += " and kge.patient_nr = '" + patNr + "' and kge.fall_nr = '" + fallNr +"'";

    db.sql(sql);
    if (db.Next()) {
      return db.Get("content");
    }
  } catch(e) {}
}

// Fetches the kg_einträge kurztext by its kgtitel_nr
// of this "Fall Nr" & "Patient Nr".
// @param kgNr [Integer, String] kgtitel nr
// @return [String] kurztext of kg_eintraege entity that corresponds to the given kg_nr. 
function findNColumnByKg(columnName, kgNr, n) {
  try {

    var sql = " select " + columnName + " as content ";
    sql += " from kgtitel kg, kg_eintraege kge ";
    sql += " where kg.nr = kge.kgtitel_nr ";
    sql += " and kg.nr = '" + kgNr.toString() + "'";
    sql += " and kge.patient_nr = '" + patNr + "' and kge.fall_nr = '" + fallNr +"'";

    db.sql(sql);
    var counter = 0;
    var matches = [];
    while (db.Next()) {
      matches.push(db.Get("content"));
      counter++;
      if (counter == n) break;
    }
    return matches;
  } catch(e) {}
}

// @param kgNr [Integer, String] kgtitel nr
// @return [Array<String>] matches
function selectByKg(kgNr) {
  try {
    var sql = " select kg_data.kurztext as data, kg_vorname.kurztext as vorname ";
    sql    += " from kg_eintraege kg_data, kg_eintraege kg_vorname "
    sql    += " where kg_data.kgtitel_nr = '" + kgNr.toString() + "' and kg_vorname.kgtitel_nr = '221050'" 
    sql    += "   and kg_vorname.kg_eintrag_kg_id = kg_data.kg_eintrag_kg_id "  
    sql    += "   and kg_data.fall_nr = '" + fallNr +"' and kg_data.patient_nr = '" + patNr + "' " ; 

    db.sql(sql);
    var matches = []
    while (db.Next()) {
      var item = {name: db.Get("vorname"), data: db.Get("data")};
      matches.push(item);
    }
    return matches;
  } catch(e) {}
}

function selectByKgFromWochenbett(kgNr) {
  try {
    var tabNameNr = "230845"; 
    var pNr = "230150";
    var sql = " select ";   
    sql += "      kg_data.kurztext as data, ";
    sql += "      vorname.kurztext as name ";
    sql += "    from ";
    sql += "      kg_eintraege kg_data, ";
    sql += "      kg_eintraege parent_kge, ";
    sql += "      kg_eintraege vorname ";
    sql += "    where ";
    sql += "      parent_kge.kgtitel_nr = '" + pNr + "' ";
    sql += "      and kg_data.kg_eintrag_kg_id = parent_kge.kg_id ";
    sql += "      and vorname.kgtitel_nr = '" + tabNameNr + "' ";
    sql += "      and vorname.kg_eintrag_kg_id = parent_kge.kg_id ";
    sql += "      and kg_data.kgtitel_nr = '" + kgNr.toString() + "' ";
    sql += "      and kg_data.fall_nr = '" + fallNr + "' and kg_data.patient_nr = '" + patNr + "' ";

    db.sql(sql);
    var matches = []
    while (db.Next()) {
      var item = {name: db.Get("name"), data: db.Get("data")};
      matches.push(item);
    }
    return matches;
  } catch(e) {}
}

function getPatData(Item) {
  try {
    sCmd  = " select p.sprache, a.telefon ";
    sCmd += " from adressen a, personen p ";
    sCmd += " where p.pat_nr =:PatientNr ";
    sCmd += " and a.person_nr = p.nr ";
    sCmd += " and a.gueltig = (select max(gueltig) from adressen where person_nr = p.nr)";
    db.DefineVar("PatientNr", patNr)

    db.SQL(sCmd);
    if (db.HasDbMessage()) {
      Application.StdDlg.MsgBox(db.GetDbMessage(), "NxPatient");
    } else {
      db.Next();
      var data = { 
        sprache: db.Get("sprache"),
        telefon: db.Get("telefon")
      };
      return data;
    }
  } catch(e) {}
}

// Checks whether a given string is a valid number.
// Used to resolve Issue #2#
//
// @info: Usually, in javascript, we would perform a check like !isNaN(aString)
//  However, this does work in MedFolio, since they use special types,
//  Meaning, that parseFloat(aString) does not yield NaN for non-numeric values,
//  but instead, yields 1.QNaN (WTF...).
//  This method is used as a helper method to perform input validations.
//  And yes, I know there is some form of standard lib functionality present here,
//  but it kind of sucks (no docs, weird behaviour) - don't dare to neither touch,
//  nor modifying it... QQ
//
// @example
//  isStringNumber("1") #=> true
//  isStringNumber("0") #=> true
//  isStringNumber("1.1") #=> true
//  isStringNumber("foobar") #=> false
//
// @param aString [String] usually the input of a certain form field,
//  given by aFormItem.value.
// @return [Boolean] true if input string is a number and false otherwise.
function stringIsNumber(aString) {
  // and in case you wonder: no, \d does in Medfolio not work...
  var isNumberRegExp = new RegExp("^[0-9]+$");
  return aString.match(isNumberRegExp);
}

function withRtfNewlines(text) {
  if (text == "") return text;
  return text.replace(/\n/g, "\\par ");
}

function fetchKinderData() {
  var data = [];
  var fetches = [];
  var labels = [];

  var names = selectByKg(221050)
  fetches.push(names);
  labels.push("name");

  var childCount = names.length;
  // append empty children
  for (var k = 0; k < childCount; k++) {
    data.push({idx: (k + 1)});
  }

  // fill fetched content
  for (var k = 0; k < labels.length; k++) {
    for (var idx = 0; idx < childCount; idx++) {
      data[idx][labels[k]] = fetches[k][idx].data;
    }
  }
  return data;
}

function checkboxSelected(kgNr, label) {
  var content = findByKg(kgNr);
  if (content == null || content == "") {
    return null;
  }
  return (content == "1") ? label : "";
}

function radioSelected(kgNumbers, labels) {
  for (var k = 0; k < kgNumbers.length; k++) {
    var state = checkboxSelected(kgNumbers[k], labels[k]) 
    if (state) {
      return state; 
    }
  }
  return null;
}

function contentIfCheckbox(checkboxKgNr, label, otherNrs) {
  var hasSubContent = false;
  var checkbox = checkboxSelected(checkboxKgNr, label);
  if (!checkbox) return null
  var str = checkbox;
  var subContent = "";
  for (var k = 0; k < otherNrs.length; k++) {
    var data = findByKg(otherNrs[k]);
    if (data) data = withRtfNewlines(data);
    subContent += " " + data;
    hasSubContent = true;
  }
  if (hasSubContent && (subContent == "" || subContent == null)) return null;
  return str + subContent;
}

function contentIfCheckboxWithSubcheckboxes(kgNr, label, unit, textKgNr, subcheckboxKgNrs, subcheckboxLabels) {
  var content = contentIfCheckbox(kgNr, label, [textKgNr]);

  var hasContent = (content != "" && content != null);
  if (hasContent) {

    content += " " + unit + " ";

    for (var k = 0; k < subcheckboxKgNrs.length; k++) {
      var subitem = contentIfCheckbox(subcheckboxKgNrs[k], subcheckboxLabels[k], []);
      if (subitem != "" && subitem != null) {
        content += subitem;
      }
    }
  }
  return content;
}

function pushUnlessNull(collection, item) {
  if (item != null) {
    if (item != "" ) collection.push(item);
  }
}

function Kind(name) {
  this.name = name;

  this.getKgFromWochenbett = function(kgNr) {
    var records = selectByKgFromWochenbett(kgNr);
    for (var k = 0; k < records.length; k++) {
      var record = records[k];
      //if (record.name == this.name) {
        if (record.name.match(this.name)) {
          return record.data
        }
      }
      return null;
    };

  this.getKgFromGeburt = function(kgNr) {
    var records = selectByKg(kgNr);
    for (var k = 0; k < records.length; k++) {
      var record = records[k];
      //if (record.name == this.name) {
        if (record.name.match(this.name)) {
          return record.data
        }
      }
      return null;
    };

  this.checkboxSelected = function(kgNr, label) {
    var content = this.getKgFromWochenbett(kgNr);
    if (content == null || content == "") {
      return null;
    }
    return (content == "1") ? label : "";
  };

  this.contentIfCheckbox = function(checkboxKgNr, label, otherNrs) {
    var hasSubContent = false;
    var checkbox = this.checkboxSelected(checkboxKgNr, label);
    if (!checkbox) return null
    var str = checkbox;
    var subContent = "";
    for (var k = 0; k < otherNrs.length; k++) {
      var data = this.getKgFromWochenbett(otherNrs[k]);
      if (data) data = withRtfNewlines(data);
      subContent += " " + data;
      hasSubContent = true;
    }
    if (hasSubContent && (subContent == "" || subContent == null)) return null;
    return str + subContent;
  };

  this.contentIfCheckboxWithSubcheckboxes = function(kgNr, label, unit, textKgNr, subcheckboxKgNrs, subcheckboxLabels) {
    var content = this.contentIfCheckbox(kgNr, label, [textKgNr]);

    var hasContent = (content != "" && content != null);
    if (hasContent) {
      content += " " + unit + " ";

      for (var k = 0; k < subcheckboxKgNrs.length; k++) {
        var subitem = this.contentIfCheckbox(subcheckboxKgNrs[k], subcheckboxLabels[k], []);
        if (subitem != "" && subitem != null) {
          content += subitem;
        }
      }
    }
    return content;
  };

  this.getBgRhesus = function() {
    var bg = this.getKgFromWochenbett(230810);
    var rh = this.getKgFromWochenbett(230820);
    var bg_rh = bg;
    if (rh != "Nicht vorhanden") bg_rh += " " + rh;
    return bg_rh;
  };

  this.getApgar = function() {
    return this.getKgFromGeburt(221270) + "-" + this.getKgFromGeburt(221280) + "-" + this.getKgFromGeburt(221290);
  };

  this.getNeugeborenenScreening = function() {
    data = [];
    pushUnlessNull(data, this.contentIfCheckbox(231380, "durchgeführt am", [231382]));
    pushUnlessNull(data, this.contentIfCheckbox(231384, "durchzuführen am", [231386]));
    pushUnlessNull(data, this.contentIfCheckbox(231388, "Vitamin K (Konaktion) erhalten am", [231390]));
    pushUnlessNull(data, this.contentIfCheckbox(231392, "Karte und Konaktion mitgeben", []));
    return data;
  };

  this.getUeberwachung = function() {
    var data = [];
    pushUnlessNull(data, this.contentIfCheckbox(231400, "Adaptationsüberwachung", []));
    pushUnlessNull(data, this.contentIfCheckbox(231402, "Infekt Überwachung 48h", []));
    pushUnlessNull(data, this.contentIfCheckbox(231404, "Finnigan Score", []));
    pushUnlessNull(data, this.contentIfCheckbox(231406, "3x nüchtern Blutzucker", []));
    pushUnlessNull(data, this.contentIfCheckbox(231408, "Sonstige Überwachung: ", [231410]));
    return data;
  };

  this.getSonoRoentgenLabor = function() {
    var data = [];
    var subList = [];
    pushUnlessNull(data, this.contentIfCheckbox(231430, "Hüftsonographie", []));
    pushUnlessNull(subList, this.contentIfCheckbox(231432, "Durchführung beim Kinderarzt", []));
    pushUnlessNull(subList, this.contentIfCheckbox(231434, "Hüfte reif", []));
    pushUnlessNull(subList, this.contentIfCheckbox(231436, "Hüfte unreif", []));
    pushUnlessNull(subList, this.contentIfCheckbox(231438, "Breit wickeln", []));
    if (subList.length > 0) pushUnlessNull(data, new List(subList).toRtf());
    return data;
  };

  this.getAusscheidung = function() {
    var data = [];
    pushUnlessNull(data, this.contentIfCheckbox(231490, "unauffällig", []));
    pushUnlessNull(data, this.contentIfCheckbox(231492, "Besonderes: ", [231396]));
    return data;
  };

  this.getGrundUeberwachung = function() {
    var data = [];
    var subList = [];
    pushUnlessNull(subList, this.contentIfCheckbox(231420, "Gestationsdiabetes der Mutter", []));
    pushUnlessNull(subList, this.contentIfCheckbox(231500, "Frühgeburtlichkeit unter 37 SSW", []));
    pushUnlessNull(subList, this.contentIfCheckbox(231502, "Geburtsgewicht unter 2500g (SDF)", []));
    pushUnlessNull(subList, this.contentIfCheckbox(231504, "Geburtsgewicht über 4500g", []));
    pushUnlessNull(data, this.contentIfCheckbox(231412, "Strepto B positiv", []));
    pushUnlessNull(data, this.contentIfCheckbox(231414, "Strepto B unbekannt", []));
    pushUnlessNull(data, this.contentIfCheckbox(231416, "BS > 18h", []));
    pushUnlessNull(data, this.contentIfCheckbox(231418, "V.a AIS Mutter", []));
    pushUnlessNull(data, this.contentIfCheckbox(231498, "Hypoglykämie Risiko", []));
    if (subList.length > 0) pushUnlessNull(data, new List(subList).toRtf());
    pushUnlessNull(data, this.contentIfCheckbox(231422, "HIV positiv der Mutter", []));
    pushUnlessNull(data, this.contentIfCheckbox(231424, "Sonstiges: ", [231426]));
    return data;
  };

  // Fetch and process relevant "Gewicht" information.
  //
  // @return [Object] with the following weight properties:
  //  start: Eintrittsgewicht in g
  //  end: Austrittsgewicht in g
  //  delta: Gewichtsveränderung (keine, zunahme, abnahme)
  this.getWeights = function() {
    var computeDelta = true;
    var weightStart = this.getKgFromGeburt(221090);
    var weightEnd = this.getKgFromWochenbett(231398);
    var weightDelta = "Keine";
    var out = {
      start: weightStart,
      end: weightEnd,
      delta: weightDelta
    };

    (!stringIsNumber(weightStart) || weightStart == "") ? (computeDelta = false) : (out.start += "g");
    (!stringIsNumber(weightEnd) || weightEnd == "") ? (computeDelta = false) : (out.end += "g");

    if (computeDelta) {
      out.delta = (parseFloat(weightEnd) > parseFloat(weightStart)) ? "Zunahme" : "Abnahme";
    }
    return out;
  };

  this.getBilirubinwert = function() {
    data = [];
    var austrittstag = this.contentIfCheckboxWithSubcheckboxes(
      231460, "Austrittstag", "mmol/l", 231462, [231464, 231466], ["transkutan", "chemisch"]
    );
    var vortag = this.contentIfCheckboxWithSubcheckboxes(
      231468, "Vortag", "mmol/l", 231470, [231472, 231474], ["transkutan", "chemisch"]
    );
    pushUnlessNull(data, austrittstag);
    pushUnlessNull(data, vortag);
    pushUnlessNull(data, this.contentIfCheckbox(231476, "Besonderes", [231478]));
    return data;
  };
}

function Mutter() {

  this.getGP = function() {
    var gp = new Cell("G").asBold();
    gp.mergeWith(new Cell(": " + findByKg(205321) + " "));
    gp.mergeWith(new Cell("P").asBold());
    gp.mergeWith(new Cell(": " + findByKg(205322)));
    return gp;
  };

  this.getAusscheidung = function() {
    var data = [];
    pushUnlessNull(data, contentIfCheckbox(231180, "Harnweginfekt: ", [231181]));
    pushUnlessNull(data, contentIfCheckbox(231185, "Miktionsprobleme nach PDA/SA: ", [231186]));
    pushUnlessNull(data, contentIfCheckbox(231195, "Miktionsprobleme nach Sectio: ", [231196]));
    pushUnlessNull(data, contentIfCheckbox(231190, "Miktionsprobleme nach Spontangeburt ohne PDA: ", [231191]));
    pushUnlessNull(data, contentIfCheckbox(231200, "Urininkontinenz: ", [231199]));
    pushUnlessNull(data, contentIfCheckbox(231202, "Stuhlinkontinenz: ", [231203]));
    pushUnlessNull(data, contentIfCheckbox(231201, "", [230285]));
    return data;
  };

  this.getVitalzeichen = function() {
    var data = [];
    pushUnlessNull(data, contentIfCheckbox(231512, "problemlos", []));
    pushUnlessNull(data, contentIfCheckbox(231514, "Sonstiges: ", [231516]));
    return data;
  };

  this.getBrustpflege = function() {
    var data = [];
    pushUnlessNull(data, contentIfCheckbox(231520, "MultiMam", []));
    pushUnlessNull(data, contentIfCheckbox(231524, "Mepilex Lite", []));
    pushUnlessNull(data, contentIfCheckbox(231526, "Mercurialis perennis 20%", []));
    pushUnlessNull(data, contentIfCheckbox(231534, "Salbeiteekompression", []));
    pushUnlessNull(data, contentIfCheckbox(231530, "Sonstige: ", [231532]));
    return data;
  };

  this.getStillen = function() {
    var type = findByKg(230400);
    var text = findByKg(230410);
    if (text.length > 0) {
      type += ": " + text;
    }
    return type; 
  };

  this.getUterus = function() {
    var data = [];
    pushUnlessNull(data, contentIfCheckbox(231260, "Subinvolutio", []));
    pushUnlessNull(data, contentIfCheckbox(230290, "Endomyometritis", []));
    pushUnlessNull(data, contentIfCheckbox(231270, "Hämatometra", []));
    pushUnlessNull(data, contentIfCheckbox(231275, "Therapie: ", [231280]));
    pushUnlessNull(data, contentIfCheckbox(231285, "", [231290]));
    return data;
  };

  this.getWundheilung = function() {
    var data = []; 
    pushIfContentExists(data, "Geburtsverletzung:", [230470, 230480]);
    pushIfContentExists(data, "OP-Wundheilung", [230490, 230500]);
    return data;
  };

  var contentIfCheckboxFromText = function(checkboxKgNr, label, otherNrs) {
    var hasSubContent = false;
    var checkbox = checkboxSelected(checkboxKgNr, label);
    if (!checkbox) return null
    var str = checkbox;
    var subContent = "";
    for (var k = 0; k < otherNrs.length; k++) {
      var data = findColumnByKg("text", otherNrs[k]);
      if (data) data = withRtfNewlines(data);
      subContent += " " + data;
      hasSubContent = true;
    }
    if (hasSubContent && (subContent == "" || subContent == null)) return null;
    return str + subContent;
  };

  this.getMedikamente = function() {
    var data = [];
    pushUnlessNull(data, contentIfCheckboxFromText(205605, "Magnesium: ", [205610]));
    pushUnlessNull(data, contentIfCheckboxFromText(205615, "Eisensubstitution: ", [205620]));
    pushUnlessNull(data, contentIfCheckboxFromText(205625, "Vitamine: ", [205630]));
    pushUnlessNull(data, contentIfCheckboxFromText(205635, "Antibiotika: ", [205640]));
    pushUnlessNull(data, contentIfCheckboxFromText(205645, "Tokolytika: ", [205650]));
    pushUnlessNull(data, contentIfCheckboxFromText(205655, "1. Lungenreifung: ", [205660]));
    pushUnlessNull(data, contentIfCheckboxFromText(205664, "2. Lungenreifung: ", [205661]));
    pushUnlessNull(data, contentIfCheckboxFromText(205665, "Antihypertensiva: ", [205670]));
    pushUnlessNull(data, contentIfCheckboxFromText(205675, "Andere: ", [205680]));
    return data;
  };

  // Data fetched from: GG_Wochenbett / Entlassungsbefunde
  this.getRezept = function() {
    var rezeptStatus = findByKg(230570) 

    // according to the radio button default value,
    // the string "Rezept" represents that there are drugs
    // present.
    if (rezeptStatus == "Rezept") {
      var data = [];
      var drugs = findNColumnByKg("kurztext", 230590, -1);
      for (var idx = 0; idx < drugs.length; idx++) {
        pushUnlessNull(data, drugs[idx]);
      }
      return data;
    } 
    return [rezeptStatus];
  }

  this.getBgRhesus = function() {
    return findByKg(205350) + " " + findByKg(205354);
  };

  // Push a label with its content if and only if
  // the involved Kg numbers exhibit some content.
  //
  // @param data [Array<String>] data that should be displayed.
  // @param label [String] heading in current report section.
  // @param kgNrs [Array<Integer>] kg numbers that should be fetched from the db.
  var pushIfContentExists = function(data, label, kgNrs) {
    var state = "";
    for (var idx = 0; idx < kgNrs.length; idx++) {
      var item = findByKg(kgNrs[idx]);
      if (item.length > 0) {
        state += " " + item; 
      }
    }
    if (state != "") {
      pushUnlessNull(data, label + state);
    }
  };

  this.getGeburtsverletzungen = function() {
    var data = [];
    pushIfContentExists(data, "Episiotomie:", [220320]);
    pushIfContentExists(data, "Damm:", [220330, 220340]);
    pushIfContentExists(data, "Vagina:", [220350, 220360]);
    pushIfContentExists(data, "Labien:", [220370, 220380]);
    pushIfContentExists(data, "Zervix:", [220390]);
    pushIfContentExists(data, "Weitere: ", [220400]);
    return data;
  };
}

function buildMutterTable() {
  var mutter = new Mutter();

  var table = new Table(TABLE_WIDTH);
  table.addSimpleRow([new Cell("MUTTER ").asBold()]);
  table.addSimpleRow([new Cell("Name ").asBold(), new Cell(fullName)]);

  var pat = getPatData();
  table.addSimpleRow([new Cell("Telefon Nr.").asBold(), new Cell(pat.telefon)]);
  table.addSimpleRow([new Cell("Sprache").asBold(), new Cell(pat.sprache)]);

  table.addSimpleRow([new Cell("Austritt am").asBold(), new Cell(findByKg(171092))]);

  var geburtAm = findByKg(220220) + " um " + findByKg(220230);
  table.addSimpleRow([
      new Cell("Geburt am").asBold(), new Cell(geburtAm),
      new Cell("Lage").asBold(), new Cell(findByKg(220290))
  ]);

  table.addSimpleRow([new Cell("Gravidität").asBold(), mutter.getGP()]);
  table.addNestedRow([new Cell("Vitalzeichen").asBold(), new Cell(mutter.getVitalzeichen())]);
  table.addNestedRow([new Cell("Ausscheidung").asBold(), new Cell(mutter.getAusscheidung())]);

  table.addSimpleRow([
      new Cell("BG / Rhesus").asBold(), new Cell(mutter.getBgRhesus()), 
      new Cell("Anti-D").asBold(), new Cell(findByKg(230200))]
  );

  table.addSimpleRow([new Cell("Anitkörpersuchtest am").asBold(), new Cell(findByKg(205356))]);
  table.addNestedRow([new Cell("Uterus").asBold(), new Cell(mutter.getUterus())]);
  table.addSimpleRow([new Cell("Lochien").asBold(), new Cell(findByKg(230510))]);
  table.addNestedRow([new Cell("Geburtsverletzungen").asBold(), new Cell(mutter.getGeburtsverletzungen())]);
  table.addNestedRow([new Cell("Wundheilung").asBold(), new Cell(mutter.getWundheilung())]);
  table.addSimpleRow([new Cell("Hb Postpartal").asBold(), new Cell(findByKg(230520))]);
  table.addSimpleRow([new Cell("Stillen").asBold(), new Cell(mutter.getStillen())]);
  table.addNestedRow([new Cell("Brustpflege").asBold(), new Cell(mutter.getBrustpflege())]);
  table.addNestedRow([new Cell("Medikamente").asBold(), new Cell(mutter.getRezept())]);
  table.addSimpleRow([new Cell("Verlauf").asBold(), new Cell(findByKg(230750))]);
  return table;
}

function buildKindTable(data) {
  var kind = new Kind(data.name);
  var table = new Table(TABLE_WIDTH);

  table.addSimpleRow([new Cell("KIND " + data.idx).asBold()]);
  table.addSimpleRow([
      new Cell("Name").asBold(), new Cell(data.name),
      new Cell("SSW").asBold(), new Cell(kind.getKgFromGeburt(221030))
  ]);

  var weights = kind.getWeights();
  table.addSimpleRow([
      new Cell("Eintrittsgewicht").asBold(), new Cell(weights.start),
      new Cell("Austrittsgewicht").asBold(), new Cell(weights.end)
  ]);
  table.addSimpleRow([
      Cell.blank(), Cell.blank(), 
      new Cell("Gewichtsveränderung").asBold(), new Cell(weights.delta)
  ]);

  table.addSimpleRow([
      new Cell("Länge").asBold(), new Cell(kind.getKgFromGeburt(221100)).withUnit("cm"),
      new Cell("Kopfumfang").asBold(), new Cell(kind.getKgFromGeburt(221110)).withUnit("cm")
  ]);

  table.addSimpleRow([
      new Cell("APGAR").asBold(), new Cell(kind.getApgar()),
      new Cell("BG / Rhesus").asBold(), new Cell(kind.getBgRhesus())
  ]);

  table.addSimpleRow([
      new Cell("Coombstest").asBold(), new Cell(kind.getKgFromWochenbett(230830)),
      new Cell("Hepatits B Impfung").asBold(), new Cell(kind.getKgFromWochenbett(230850))
  ]);

  table.addSimpleRow([new Cell("Ernährung").asBold(), new Cell(kind.getKgFromWochenbett(231394))]);
  table.addNestedRow([new Cell("Ausscheidung").asBold(), new Cell(kind.getAusscheidung())]);
  table.addSimpleRow([new Cell("Hörscreening").asBold(), new Cell(kind.getKgFromWochenbett(230886))]);
  table.addNestedRow([new Cell("Neugeborenen Screening").asBold(), new Cell(kind.getNeugeborenenScreening())]);
  table.addNestedRow([new Cell("Überwachung").asBold(), new Cell(kind.getUeberwachung())]);
  table.addNestedRow([new Cell("Grund der Überwachung").asBold(), new Cell(kind.getGrundUeberwachung())]);
  table.addNestedRow([new Cell("Sono / Röntgen / Labor").asBold(), new Cell(kind.getSonoRoentgenLabor())]);

  table.addSimpleRow([Cell.blank(), new Cell(kind.contentIfCheckbox(231440, "Schädelsonographie: ", [231494]))]);
  table.addSimpleRow([Cell.blank(), new Cell(kind.contentIfCheckbox(231442, "Herzecho: ", [231444]))]);
  table.addSimpleRow([Cell.blank(), new Cell(kind.contentIfCheckbox(231446, "Labor: ", [231448]))]);
  table.addSimpleRow([Cell.blank(), new Cell(kind.contentIfCheckbox(231450, "Sonstiges: ", [231452]))]);

  table.addNestedRow([new Cell("Bilirubinwert").asBold(), new Cell(kind.getBilirubinwert())]);
  table.addSimpleRow([new Cell("Phototherapie").asBold(), new Cell(kind.getKgFromWochenbett(230895))]);

  return table;
}

function Create() {
  SetDatum_g_g();
  var mukiField = Letter.Field("MuKi_Bericht");
  //mukiField.setRTFText(rtfReport);

  var report = new Report();
  report.add(buildMutterTable());

  var fetchedKinderData = fetchKinderData();
  // Foreach kind in kinder do buildKindTable(kind) end
  for (var kindIdx = 0; kindIdx < fetchedKinderData.length; kindIdx++) {
    var formData = fetchedKinderData[kindIdx];
    report.add(buildKindTable(formData));
  }
  mukiField.setRTFText(report.toRtf());
}
