const assert = require('assert');
const snmp = require('..');

let mibProviders;
let mib;

describe('MIB', function () {

	this.beforeAll(function () {
        const mibDir = './test/';
        const store = snmp.createModuleStore();
        store.loadFromFile(mibDir + 'TEST-MIB.mib');
        mibProviders = store.getProvidersForModule('TEST-MIB');
    });

    beforeEach(function () {
        mib = snmp.createMib();
        mib.registerProviders(mibProviders);
    });

    describe('setScalarValue()', function () {
        it('sets a scalar value', function () {
            mib.setScalarValue('testScalarInteger', 42);
            assert.equal(mib.getScalarValue('testScalarInteger'), 42);
        });
    });

    describe('getScalarValue()', function () {
        it('sets a scalar value', function () {
            mib.setScalarValue('testScalarInteger', 42);
            assert.equal(mib.getScalarValue('testScalarInteger'), 42);
        });
    });

    describe('addTableRow()', function () {
        it('adds a row to a table', function () {
            const row = [1, 'RowValue'];
            mib.addTableRow('testEntry1', row);
            const tableData = mib.getTableCells('testEntry1', true, true);
            assert.deepEqual(tableData, [[ [1], 'RowValue']]);
        });
    });

    describe('getTableColumnDefinitions()', function () {
        it('returns column definitions for a table', function () {
            const columns = mib.getTableColumnDefinitions('testEntry1');
            assert.equal(columns.length, 2);
            assert.equal(columns[0].name, 'testTable1Index');
            assert.equal(columns[1].name, 'testTable1Value');
        });
    });

    describe('getTableCells()', function () {
        it('retrieves table data by rows', function () {
            const row = [1, 'RowValue'];
            mib.addTableRow('testEntry1', row);
            const data = mib.getTableCells('testEntry1', true, true);
            assert.deepEqual(data, [[ [1], 'RowValue']]);
        });

        it('retrieves table data by columns', function () {
            const row = [1, 'RowValue'];
            mib.addTableRow('testEntry1', row);
            const data = mib.getTableCells('testEntry1', false, true);
            assert.deepEqual(data, [ [[1]], ['RowValue']]);
        });
    });

    describe('getTableColumnCells()', function () {
        it('retrieves a single column of table data', function () {
            const row = [1, 'RowValue'];
            mib.addTableRow('testEntry1', row);
            const columnData = mib.getTableColumnCells('testEntry1', 2);
            assert.deepEqual(columnData, ['RowValue']);
        });
    });

    describe('getTableRowCells()', function () {
        it('retrieves a single row of table data', function () {
            const row = [1, 'RowValue'];
            mib.addTableRow('testEntry1', row);
            const rowData = mib.getTableRowCells('testEntry1', [1]);
            assert.deepEqual(rowData, ['RowValue']);
        });
    });

    describe('getTableSingleCell()', function () {
        it('retrieves a single cell value from a table', function () {
            const row = [1, 'RowValue'];
            mib.addTableRow('testEntry1', row);
            const cellValue = mib.getTableSingleCell('testEntry1', 2, [1]);
            assert.equal(cellValue, 'RowValue');
        });
    });

    describe('setTableSingleCell()', function () {
        it('sets a single cell value in a table', function () {
            const row = [1, 'RowValue'];
            mib.addTableRow('testEntry1', row);
            mib.setTableSingleCell('testEntry1', 2, [1], 'NewValue');
            const cellValue = mib.getTableSingleCell('testEntry1', 2, [1]);
            assert.equal(cellValue, 'NewValue');
        });
    });

    describe('deleteTableRow()', function () {
        it('deletes a table row', function () {
            const row1 = [1, 'CellValue1'];
            const row2 = [2, 'CellValue2'];
            mib.addTableRow('testEntry1', row1);
            mib.addTableRow('testEntry1', row2);
            mib.deleteTableRow('testEntry1', [1]);
            const data = mib.getTableCells('testEntry1', true, true);
            assert.deepEqual(data, [[ [2], 'CellValue2']]);
        });
    });

    describe('registerProvider() - scalar defVal', function () {
        it('adds a scalar value on registration', function () {
            const options = {
                addScalarDefaultsOnRegistration: true
            };
            mib = snmp.createMib(options);
            mib.registerProviders(mibProviders);
            assert.strictEqual(mib.getScalarValue('testScalarIntegerDefval'), 49);
        });
    });

});
