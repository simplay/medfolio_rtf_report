// Relevant classes to build rtf reports in medfolio.
// Please notice that Medfolio only supports (very reduced) subset of javascript.
// That's why we cannot rely on modules, fancy metaprogramming or polymorphism.
//
// These classes have either to be copied into the corresponding Medfolio report script
// or into the global "Briefeschreibe (i.e. nxletter)" script.
//
// Builds a valid rtf document containing the standard header
function Report() {
  this.elements = [];

  var startRtf = function() {
    return "{\\rtf1\\ansi\\ansicpg1252\\deff0\\deflang2055\\deflangfe2055\\deftab284{\\fonttbl{\\f0\\froman\\fprq2\\fcharset0 Times New Roman;}{\\f1\\fswiss\\fprq2\\fcharset0 Arial;}}";
    };

    var endRtf = function() {
      return "}"; 
  }

  this.toRtf = function() {
    var rtf = startRtf();
    for (var idx = 0; idx < this.elements.length; idx++) {
      rtf += this.elements[idx].toRtf(); 
    }
    rtf += endRtf();
    return rtf; 
  };

  this.add = function(item) {
    this.elements.push(item);
  };
}

// Difines a new rtf table with a certain with.
// A consists of a series of rows, whereas a row
// as formed by a series of cells.
//
// @example
//  var table = new Table(10000)
//  table.addSimpleRow(new Cell("Full Name: "), new Cell("Hans Peter"));
//  table.addSimpleRow(new Cell("Age: "), new Cell("27"));
//  var report = new Report();
//  report.add(table);
//  report.toRtf();
//
//  @param width [Integer] defines the with of every cell. RTF uses twip units.
//    15 twips = 1 pixel
function Table(width) {
  this.width = width;

  // collection of row instances
  this.rows = [];

  this.addHeader = function() {
    return "\\trowd\\trgaph70\\trleft-108\\trpaddl70\\trpaddr70\\trpaddfl3\\trpaddfr3";
  };

  // generate the rtf that belongs to this table
  //
  // @return [String] string that generates the rtf table
  this.toRtf = function() {

    var rtf = "\\viewkind4\\uc1";

    for (var idx = 0; idx < this.rows.length; idx++) {

      var row = this.rows[idx];
      if (!row.isValid()) continue;

      rtf += this.addHeader();
      rtf += row.toRtf();
      rtf += "\\row";
    }

    // ending this table
    rtf += "\\pard\\nowidctlpar\\par";

    // ensures that the following parsed rtf code being rendered on a new page.
    rtf += "\\page";
    return rtf;
  };

  // Appens a series of cells to this table.
  //
  // @param cells [Array<Cell>] columns of row.
  this.addSimpleRow = function(cells) {
    this.rows.push(new SimpleRow(cells, this.width));
  };

  // Appends a row of cell-lists and cells to this table.
  //
  // @param cells [Array<Array<Cell, String>>] columns of row.
  this.addNestedRow = function(cells) {
    this.rows.push(new NestedRow(cells, this.width));
  };
};

// A simple row consists of N not-nested cells.
// This class is never directly used by the user.
function SimpleRow(cells, width) {

  // Collection of Cell instances
  this.cells = cells;
  this.width = width;

  // is any cell null valued?
  this.isValid = function() {
    for (var k = 0; k < this.cells.length; k++) {
      var cell = this.cells[k];
      if (!cell.isValid()) return false; 
    } 
    return true;
  };

  // Generate the rtf that generates a simple row.
  this.toRtf = function() {

    var cellCount = this.cells.length;
    var offset = parseInt(this.width / cellCount);
    var rtf = "";

    for (var idx = 0; idx < cellCount; idx++) {
      var startPos = offset * (idx + 1);
      rtf += "\\cellx" + startPos;
    }
    rtf += "\\pard\\intbl\\nowidctlpar\\f1\\fs22";

    for (var idx = 0; idx < cellCount; idx++) {
      rtf += " " + this.cells[idx].toRtf() + "\\cell";
    }

    rtf += "\\row";
    return rtf;
  }
}

// A nested row is able to display an inner table or a list of items.
// This class is never directly used by the user.
function NestedRow(cells, width) {

  // Collection of Cell instances
  this.cells = cells;
  this.width = width;

  // is any cell null valued?
  this.isValid = function() {
    for (var k = 0; k < this.cells.length; k++) {
      if (this.cells[k].toRtf() == null) return false; 
    } 
    return true;
  };

  var isOfTypeArray = function(element) {
    return Object.prototype.toString.call(element) === '[object Array]';
  };

  this.toRtf = function() {
    var cellCount = this.cells.length;
    var offset = parseInt(this.width / cellCount);
    var rtf = "";

    for (var idx = 0; idx < cellCount; idx++) {
      var startPos = offset * (idx + 1);
      rtf += "\\cellx" + startPos;
    }

    var mayEnter = true;
    for (var idx = 0; idx < cellCount; idx++) {
      var cell = this.cells[idx];

      if (!cell.containsArray()) {
        rtf += "\\pard\\intbl\\nowidctlpar";

        // guard
        if (idx == cellCount - 1) {
          rtf += "\\cell";
          mayEnter = false;
        }
        rtf += " " + cell.toRtf() + "\\cell";
      // else we are working with an array of cell instances
      } else {
        var container = cell.content;
        for (var k = 0; k < container.length; k++) {
          rtf += "\\pard\\intbl\\itap2\\nowidctlpar";
          rtf += " " + container[k];
          rtf += "\\nestcell{\\*\\nesttableprops\\trowd\\trgaph70\\trpaddl70\\trpaddr70\\trpaddfl3\\trpaddfr3";
          rtf += "\\cellx" + offset + "\\nestrow}{\\nonesttables\\par}";
        }
      }
    }

    // case simple-nextes
    if (mayEnter) {
      rtf += "\\pard\\intbl\\nowidctlpar\\cell";
    }
    rtf += "\\trowd\\trgaph70\\trleft-108";

    for (var idx = 0; idx < cellCount; idx++) {
      var startPos = offset * (idx + 1);
      rtf += "\\cellx" + startPos;
    }
    rtf += "\\row";
    return rtf;
  };
}

// A Cell models a column within a certain table-row.
// We add cells to a table by relying on the Table#addSimpleRow and Table#addNestedRow
// members. The content of a cell is a string which may contain rtf codes.
//
// @example
// var cell = new Cell("some text");
// var bold_cell = new Cell("Heading").asBold();
// var table = new Table(10000);
// table.addSimple(bold_cell, cell);
function Cell(content) {
  this.content = content;

  // private member to overwrite the content of this cell
  this.setContent = function(content) {
    this.content = content; 
  };

  // A cell is valid if its content is not null.
  this.isValid = function() {
    return this.content != null; 
  };

  // collapse this cell with another cell
  this.mergeWith = function(cell) {
    this.content += cell.content;
  };

  // Checks if this cell's content is an array.
  // When dealing with nested rows, the content of an cell can be an array of strings.
  this.containsArray = function() {
    return Object.prototype.toString.call(this.content) === '[object Array]';
  };

  // displays the conent of this cell in bold
  this.asBold = function() {
    this.setContent("\\b1 " + this.toRtf() + "\\b0");
    return this;
  };

  // append a suffix that indicates a certain unit.
  this.withUnit = function(unit) {
    this.setContent(this.toRtf() + unit);
    return this;
  };

  // Generate corresponding rtf of this cell
  this.toRtf = function() {
    if (this.containsArray()) return this.content;
    return this.content;
  };
}

// Used to add placeholder cell that do not exhibit any content.
//
// @example: A row with four columns, where the first three are empty.
//  table.addSimpleRow(Cell.blank(), Cell.blank(), Cell.blank(), new Cell("4th column"))
Cell.blank = function() {
  return new Cell("");
};

// Generate the rtf to from a bullet point list of a given collection of items.
// @example 
//  asList(["A", "B", "C"])
// @param item [Array<String>] collection of bullet points
// @return [String] rtf representation of bullet point list containing the given items.
function List(items) {
  this.items = items;

  this.toRtf = function() {
    var rtf = "";
    for (var idx = 0; idx < this.items.length; idx++) {
      var text = this.items[idx];

      // the tag \pnlvlblt, which makes this list a bulleted list
      // \'B7 is the actual unicode tag for the bullet 
      rtf += "{\\pntext \\'B7\\tab}{\\pn\\pnlvlblt\\pnstart1{\\pntxtb\\'B7}}{\\ltrch"; 
      rtf += " " + text + "}\\li720\\ri0\\sa0\\sb0\\jclisttab\\tx720\\fi-360\\ql";

      // no new paragraph for the last item
      if (idx < this.items.length - 1) {
        rtf += "\\par";
      }
    }
    return rtf;
  };
}
