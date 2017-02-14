// Simple example how to use report.js

var report = new Report();
var table = new Table(10000);

// Simple row with two columns, a bold header and the content
table.addSimpleRow(new Cell("Name").asBold(), new Cell("Hans Peter"));

// A Simple row with four columns
table.addSimpleRow([
    new Cell("Eintrittsgewicht").asBold(), new Cell("20kg"),
    new Cell("Austrittsgewicht").asBold(), new Cell("24.2kg")
]);

// A nested row  with two columns
table.addNestedRow(new Cell("Interessen").asBold(), new Cell(["Bücher", "Essen"]);

// A nested row with list items
var listItems = new List(["schnell", "fleissig", "start"])
table.addNestedRow(new Cell("Attribute").asBold(), new Cell(listItems));

// A row with three columns. The first column is blank.
table.addSimple([Cell.blank(), new Cell("Alter").asBold(), new Cell("23")]);

// Add the table twice to the report
// Each table is on its own, new page.
report.add(table);
report.add(table);

// Obtain the corresponding rtf string.
report.toRtf();
