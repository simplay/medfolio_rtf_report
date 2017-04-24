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
//  @param fontSize [Integer, optional] set the default font size to be used in this table
//    default is 22 i.e. 11pt
//  @param startsNewPage [Boolean, optional] defines whether the table should start a new page
//    default is false
function Table(width) {
  this.width = width;
  this.fontSize = arguments.length > 1 ? arguments[1] : 22;
  this.startNewPage = arguments.length > 2 ? arguments[2] : false;

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
    if (this.startNewPage) {
      rtf += "\\page";
    }
    return rtf;
  };

  // Appens a series of cells to this table.
  //
  // @param cells [Array<Cell>] columns of row.
  this.addSimpleRow = function(cells) {
    this.rows.push(new SimpleRow(cells, this.width, this.fontSize));
  };

  // Appends a row of cell-lists and cells to this table.
  //
  // @param cells [Array<Array<Cell, String>>] columns of row.
  this.addNestedRow = function(cells) {
    this.rows.push(new NestedRow(cells, this.width, this.fontSize));
  };
};

// A simple row consists of N not-nested cells.
// This class is never directly used by the user.
function SimpleRow(cells, width, fontSize) {

  // Collection of Cell instances
  this.cells = cells;
  this.width = width;
  this.fontSize = fontSize;

  // is any cell null valued?
  this.isValid = function() {
    for (var k = 0; k < this.cells.length; k++) {
      var cell = this.cells[k];
      if (!cell.isValid()) return false; 
    } 
    return true;
  };
  
  // get the amount of fixed width cells and their combined width
  this.getFixedCellInfo = function() {
    var result = {width: 0, num: 0};
    for(var idx = 0; idx < this.cells.length; idx++) {
      if(this.cells[idx].width > 0) {
        result.width += this.cells[idx].width;
        result.num++;
      }
    }
    return result;
  }

  // Generate the rtf that generates a simple row.
  this.toRtf = function() {

    var cellCount = this.cells.length;
    var fixedCellInfo = this.getFixedCellInfo();
    var fixedWidth = fixedCellInfo.width;
    var varWidth = this.width - fixedWidth;
    var varOffset = parseInt(varWidth / (cellCount - fixedCellInfo.num));
    var rtf = "";
    var startPos = 0;

    for (var idx = 0; idx < cellCount; idx++) {
      var cell = this.cells[idx];
      startPos += cell.width > 0 ? cell.width : varOffset;
      rtf += cell.mergeTag;
      rtf += cell.getRtfBorderFormat();
      rtf += cell.valign;
      rtf += "\\cellx" + startPos;
    }

    for (var idx = 0; idx < cellCount; idx++) {
      rtf += "\\pard\\intbl\\nowidctlpar\\f1\\fs" + this.fontSize + "\n";
      rtf += this.cells[idx].toRtf() + "\\cell";
    }

    rtf += "\\pard\\intbl\\row";
    return rtf;
  }
}

// A nested row is able to display an inner table or a list of items.
// This class is never directly used by the user.
function NestedRow(cells, width, fontSize) {

  // Collection of Cell instances
  this.cells = cells;
  this.width = width;
  this.fontSize = fontSize;

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
  
  // get the amount of fixed width cells and their combined width
  this.getFixedCellInfo = function() {
    var result = {width: 0, num: 0};
    for(var idx = 0; idx < this.cells.length; idx++) {
      if(this.cells[idx].width > 0) {
        result.width += this.cells[idx].width;
        result.num++;
      }
    }
    return result;
  }

  this.toRtf = function() {
    var cellCount = this.cells.length;
    var fixedCellInfo = this.getFixedCellInfo();
    var fixedWidth = fixedCellInfo.width;
    var varWidth = this.width - fixedWidth;
    var varOffset = parseInt(varWidth / (cellCount - fixedCellInfo.num));
    var rtf = "";
    var startPos = 0;

    for (var idx = 0; idx < cellCount; idx++) {
      var cell = this.cells[idx];
      startPos += cell.width > 0 ? cell.width : varOffset;
      rtf += cell.mergeTag;
      rtf += cell.getRtfBorderFormat();
      rtf += cell.valign;
      rtf += "\\cellx" + startPos;
    }
    // The newline ensures that if the text following the font size declaration
    // starts with a number it won't be interpreted as part of the declaration
    rtf += "\\pard\\intbl\\nowidctlpar\\f1\\fs" + this.fontSize + "\n";

    var mayEnter = true;
    for (var idx = 0; idx < cellCount; idx++) {
      var cell = this.cells[idx];

      if (!cell.containsArray()) {
        rtf += "\\pard\\intbl\\nowidctlpar\\f1\\fs" + this.fontSize + "\n";

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
          rtf += "\\cellx" + (cell.width > 0 ? cell.width : varOffset) + "\\nestrow}{\\nonesttables\\par}";
        }
      }
    }

    // case simple-nextes
    if (mayEnter) {
      rtf += "\\pard\\intbl\\nowidctlpar" + this.fontSize + "\n\\cell";
    }
    rtf += "\\trowd\\trgaph70\\trleft-108";

    startPos = 0;
    for (var idx = 0; idx < cellCount; idx++) {
      startPos += this.cells[idx].width > 0 ? this.cells[idx].width : varOffset;
      rtf += "\\cellx" + startPos;
    }
    rtf += "\\row";
    return rtf;
  };
}

// The BORDER_TYPE enum is used to specify cell border types
// the available border types are severely restricted by the ancient RTF version
// additionally the double and triple borders are double width and triple width
// rather than actual double and triple borders, like they are in more recent versions
var BORDER_TYPE = {
  NONE  :  null,
  SOLID : '\\brdrs',
  DOUBLE: '\\brdrdb',
  TRIPLE: '\\brdrtriple'
};

// The ALIGN enum is used to specify horizontal text alignment
var ALIGN = {
  LEFT   : '\\ql',
  RIGHT  : '\\qr',
  CENTER : '\\qc',
  JUSTIFY: '\\qj'
};

// The VALIGN enum is used to specify vertical cell text alignment
var VALIGN = {
  TOP   : '', // default value so can be empty
  CENTER : '\\clvertalc',
  BOTTOM: '\\clvertalb'
};

// A Cell models a column within a certain table-row.
// We add cells to a table by relying on the Table#addSimpleRow and Table#addNestedRow
// members. The content of a cell is a string which may contain rtf codes.
//
// @example
// var cell = new Cell("some text");
// var bold_cell = new Cell("Heading").asBold();
// var table = new Table(10000);
// table.addSimple(bold_cell, cell);
// @param content [String, Array<String>] content of cell, if nested structure, then pass an array of string
// @param width [Integer, optional] set the cell to a specific width, the rest of the non fixed width cells on
//        the same row will be distributed evenely across the leftover horizontal space
// @param borderTop, borderLeft, borderBottom, borderRight [BORDER_TYPE, optional] set the corresponding border type.
function Cell(content) {
  this.content = content;
  this.width = arguments.length > 1 ? parseInt(arguments[1]) : 0;
  this.borderTop = arguments.length > 2 ? arguments[2] : BORDER_TYPE.NONE;
  this.borderLeft = arguments.length > 3 ? arguments[3] : BORDER_TYPE.NONE;
  this.borderBottom = arguments.length > 4 ? arguments[4] : BORDER_TYPE.NONE;
  this.borderRight = arguments.length > 5 ? arguments[5] : BORDER_TYPE.NONE;
  this.fontSize = null;
  this.mergeTag = "";
  this.valign = VALIGN.TOP;

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

  // set the font to the given size in half points
  this.setFontSize = function(size) {
    this.fontSize = size;
    this.setContent("\\fs" + size + "\n" + this.toRtf());
    return this;
  }

  // set alignment of text inside the cell
  // param align [ALIGN] horizontal alignment
  // param valign [VALIGN, optional] vertical alignment
  this.setAlignment = function(align) {
    this.setContent(align + "\n" + this.toRtf());
    if(arguments.length>1)
      this.valign = arguments[1];
    return this;
  }

  // should the cell be merged with another cell
  // @param firstCell [Boolean] is this the first cell in a set of cells that should be merged?
  this.mergeCell = function(firstCell) {
    this.mergeTag = firstCell ? "\\clvmgf" : "\\clvmrg";
    return this;
  }

  // displays the conent of this cell in bold
  this.asBold = function() {
    this.setContent("\\b1\n" + this.toRtf() + "\\b0");
    return this;
  };

  // displays the conent of this cell with an underline
  this.withUnderline = function() {
    this.setContent("\\ul\n" + this.toRtf() + "\\ul0");
    return this;
  };

  // append a suffix that indicates a certain unit.
  this.withUnit = function(unit) {
    this.setContent(this.toRtf() + unit);
    return this;
  };

  // set all four sides of the cell to specific types
  // similarly to css properties you can specify between 1 and 4 values
  //
  // The following calls are possible:
  // 4 values: withBorder(top, left, bottom, right)
  // 3 values: withBorder(top, leftRight, bottom)
  // 2 values: withBorder(topBottom, leftRight)
  // 1 value:  withBorder(topLeftBottomRight)
  this.withBorder = function(type) {
    switch(arguments.length) {
      // failing silently is probably fine
      case 0:
        break;

      // if we only get one argument we want to set all sides to the specifc type
      case 1:
        this.borderTop = type;
        this.borderLeft = type;
        this.borderBottom = type;
        this.borderRight = type;
        break;

      // with two arguments the first specifies top and bottom and the second specifies left and right
      case 2:
        this.borderTop = type;
        this.borderLeft = arguments[1];
        this.borderBottom = type;
        this.borderRight = arguments[1];
        break;

      // with three arguments, the first specifies top, the second left and right and the third bottom
      case 3:
        this.borderTop = type;
        this.borderLeft = arguments[1];
        this.borderBottom = arguments[2];
        this.borderRight = arguments[1];
        break;

      // with four arguments each specfies a side like with the constructor
      // additional arguments will be ignored
      case 4:
      default:
        this.borderTop = type;
        this.borderLeft = arguments[1];
        this.borderBottom = arguments[2];
        this.borderRight = arguments[3];
        break;
    }
    return this;
  };

  // set the top border type
  this.withBorderTop = function(type) {
    this.borderTop = type;
    return this;
  }

  // set the left border type
  this.withBorderLeft = function(type) {
    this.borderLeft = type;
    return this;
  }

  // set the bottom border type
  this.withBorderBottom = function(type) {
    this.borderBottom = type;
    return this;
  }

  // set the right border type
  this.withBorderRight = function(type) {
    this.borderRight = type;
    return this;
  }

  // generate a rtf border formatting string based on the cell properties
  this.getRtfBorderFormat = function() {
    var rtf = '';
    if(this.borderTop != BORDER_TYPE.NONE) {
      rtf += '\\clbrdrt' + this.borderTop;
    }
    if(this.borderLeft != BORDER_TYPE.NONE) {
      rtf += '\\clbrdrl' + this.borderLeft;
    }
    if(this.borderBottom != BORDER_TYPE.NONE) {
      rtf += '\\clbrdrb' + this.borderBottom;
    }
    if(this.borderRight != BORDER_TYPE.NONE) {
      rtf += '\\clbrdrr' + this.borderRight;
    }
    return rtf;
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
// @param width [Integer, optional] the width of the blank cell
Cell.blank = function() {
  return new Cell("", arguments.length > 0 ? arguments[0] : 0);
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
