const fs = require('fs');
const path = require('path');

const MIB = function (dir) {

    var initializeBuffer = function (buffer) {
        return Object.assign(buffer, {
            logit: false,
            lastChar: '',
            state: '',
            open: false,
            CurrentSymbol: '',
            nested: 0,
            isComment: false,
            isEqual: false,
            isOID: false,
            isList: false,
            isString: false,
            inComment: false,
            inGroup: 0,
            builder: '',
            ColumnIndex: 0,
            RowIndex: 0,
            PreviousRow: 0
        });
    };

    var newMIB = ({
        directory: dir ? dir : '',
        SymbolBuffer: {},
        StringBuffer: '',
        Modules: {},
        Objects: {},
        MACROS: [],
        CurrentObject: null,
        TempObject: {},
        CurrentClause: '',
        WaitFor: '',
        CharBuffer: {
            Table: {},
            ModuleName: {},
            Append: function (char) {
                this.builder += char;
            },
            Fill: function (FileName, row, column) {
                if (this.builder.length == 0) {
                    return;
                }
                column = (column - this.builder.length);
                var symbol = this.builder.toString().trim();
                this.builder = "";
                if (!this.Table[FileName]) {
                    this.Table[FileName] = [];
                } else if (this.PreviousRow < row) {
                    this.RowIndex++;
                    this.ColumnIndex = 0;
                    this.PreviousRow = row;
                }
                var R = this.RowIndex;
                var C = this.ColumnIndex;

                if (!this.Table[FileName][R] || C === 0) {
                    this.Table[FileName][R] = Object.defineProperty([], "line", {
                        enumerable: false,
                        value: row + 1
                    });
                }
                this.isEqual = false;
                switch (symbol) {
                    case ')':
                        this.Table[FileName][R][C] = symbol;
                        this.ColumnIndex++;
                        this.logit = false;
                        break;
                    case '(':
                        this.Table[FileName][R][C] = symbol;
                        this.ColumnIndex++;
                        this.logit = true;
                        break;
                    case 'DEFINITIONS':
                        if (C == 0) {
                            this.ModuleName[FileName] = this.Table[FileName][R - 1][C];
                        } else {
                            this.ModuleName[FileName] = this.Table[FileName][R][C - 1];
                        }
                        this.Table[FileName][R][C] = symbol;
                        this.ColumnIndex++;
                        break;
                    case '::=':
                        this.Table[FileName][R][C] = symbol;
                        this.ColumnIndex++;
                        this.isEqual = true;
                        break;
                    case '{':
                        if (this.Table[FileName][R][C - 1] != '::=') {
                            this.isList = true;
                        }
                        this.Table[FileName][R][C] = symbol;
                        this.ColumnIndex++;
                        break;
                    case 'NOTATION':
                        if (this.Table[FileName][R][C - 1] == 'TYPE' || this.Table[FileName][R][C - 1] == 'VALUE') {
                            this.Table[FileName][R][C - 1] += ' NOTATION';
                        }
                        break;

                    case 'OF':
                        if (this.Table[FileName][R][C - 1] == 'SEQUENCE') {
                            this.Table[FileName][R][C - 1] = 'SEQUENCE OF';
                        }
                        break;
                    case 'IDENTIFIER':
                        if (this.Table[FileName][R][C - 1] == 'OBJECT') {
                            this.Table[FileName][R][C - 1] = 'OBJECT IDENTIFIER';
                        }
                        break;
                    case 'STRING':
                        if (this.Table[FileName][R][C - 1] == 'OCTET') {
                            this.Table[FileName][R][C - 1] = 'OCTET STRING';
                        }
                        break;
                    default:
                        this.Table[FileName][R][C] = symbol;
                        this.ColumnIndex++;
                        break;
                }

            }
        },
        Import: function (FileName) {
            this.ParseModule(path.basename(FileName, path.extname(FileName)), fs.readFileSync(FileName).toString());
        },
        ParseModule: function (FileName, Contents) {
            initializeBuffer(this.CharBuffer);

            var lines = Contents.split('\n');
            var line = '';
            var i = 0;
            while ((line = lines[i]) != null && i <= lines.length) {
                this.ParseLine(FileName, line, i);
                i++;
            }
        },
        ParseLine: function (FileName, line, row) {
            let len = line.length;
            if (line[len - 1] === '\r')
                --len;
            for (var i = 0; i < len; i++) {
                var char = line.charAt(i);
                this.ParseChar(FileName, char, row, i);
            }
            this.ParseChar(FileName, '\n', row, len);
        },
        ParseChar: function (FileName, char, row, column) {
            switch (char) {
                case '\r':
                case '\n':
                    if (!this.CharBuffer.isString) {
                        this.CharBuffer.Fill(FileName, row, column);
                        this.CharBuffer.isComment = false;
                        this.CharBuffer.inGroup = 0; //IGNORE GROUPINGS ACROSS COMMENTS
                    } else if (this.CharBuffer.isString && this.CharBuffer.isComment) {
                        this.CharBuffer.Append(char);
                    }
                    break;
                case '{':
                    if ( ! this.CharBuffer.isComment && this.CharBuffer.isEqual ) { this.CharBuffer.isOID = true; }
                case '[':
                case '(':
                    if ( ! this.CharBuffer.isComment && ! this.CharBuffer.isString ) {
                        this.CharBuffer.nested++;
                        if (char == '(' || char == '{') {
                            // Emit the previous token if this is the start of an outer group
                            if (this.CharBuffer.nested === 1) {
                                this.CharBuffer.Fill(FileName, row, column);
                            }
                            this.CharBuffer.inGroup++;
                        }
                    }
                    if (this.CharBuffer.isComment || ((this.CharBuffer.isOID || this.CharBuffer.nested > 0) && (!this.CharBuffer.isList || this.CharBuffer.inGroup > 0))) {
                        this.CharBuffer.Append(char);
                    } else {
                        this.CharBuffer.Fill(FileName, row, column);
                        this.CharBuffer.Append(char);
                        this.CharBuffer.Fill(FileName, row, column);
                    }
                    break;
                case '}':
                case ']':
                case ')':
                    if ( ! this.CharBuffer.isComment && ! this.CharBuffer.isString ) {
                        this.CharBuffer.nested--;
                        if (this.CharBuffer.nested < 0) {
                            this.CharBuffer.nested = 0;
                        }
                        if ( char == ')') {
                            this.CharBuffer.inGroup--;
                            if (this.CharBuffer.inGroup < 0) {
                                this.CharBuffer.inGroup = 0; // ignore grouping across comments
                            }
                        }
                    }
                    if (this.CharBuffer.isComment || ((this.CharBuffer.isOID || this.CharBuffer.nested >= 0) && (!this.CharBuffer.isList || this.CharBuffer.inGroup >= 0))) {
                        this.CharBuffer.Append(char);
                    } else {
                        this.CharBuffer.Fill(FileName, row, column);
                        this.CharBuffer.Append(char);
                        this.CharBuffer.Fill(FileName, row, column);
                    }
                    if (char == '}') {
                        this.CharBuffer.isOID = false;
                        this.CharBuffer.isList = false;
                    }
                    break;
                case ',':
                    if (this.CharBuffer.isComment) {
                        this.CharBuffer.Append(char);
                    } else {
                        this.CharBuffer.Fill(FileName, row, column);
                        this.CharBuffer.Append(char);
                        this.CharBuffer.Fill(FileName, row, column);
                    }
                    break;
                case ';':
                    if (this.CharBuffer.isComment) {
                        this.CharBuffer.Append(char);
                    } else {
                        this.CharBuffer.Fill(FileName, row, column);
                        this.CharBuffer.Append(char);
                        this.CharBuffer.Fill(FileName, row, column);
                    }
                    break;
                case " ":
                case "\t":
                    if (this.CharBuffer.isComment || ((this.CharBuffer.isOID || this.CharBuffer.nested > 0) && (!this.CharBuffer.isList || this.CharBuffer.inGroup > 0))) {
                        this.CharBuffer.Append(char);
                    } else {
                        this.CharBuffer.Fill(FileName, row, column);
                    }
                    break;
                case "-":
                    this.CharBuffer.Append(char);
                    if (!this.CharBuffer.isString && this.CharBuffer.lastChar == '-') {
                        this.CharBuffer.isComment = true;
                        this.CharBuffer.builder = this.CharBuffer.builder.split('--')[0];
                        this.CharBuffer.Fill(FileName, row, column);
                        this.CharBuffer.builder = '--';
                    }

                    break;
                case '"':
                    if (this.CharBuffer.isComment && !this.CharBuffer.isString && !this.CharBuffer.inComment) {
                        //011 = COMMENT
                        //IF 011 SET 101
                        this.CharBuffer.isComment = true;
                        this.CharBuffer.isString = false;
                        this.CharBuffer.inComment = true;
                    } else if (!this.CharBuffer.isComment && !this.CharBuffer.isString && !this.CharBuffer.inComment) {
                        //000 = STRING
                        //IF 000 SET 110
                        this.CharBuffer.isComment = true;
                        this.CharBuffer.isString = true;
                        this.CharBuffer.inComment = false;
                        this.CharBuffer.Fill(FileName, row, column); //new string
                    } else if (this.CharBuffer.isComment && this.CharBuffer.isString && !this.CharBuffer.inComment) {
                        //110 = END STRING
                        //IF 110 SET 000
                        this.CharBuffer.isComment = false;
                        this.CharBuffer.isString = false;
                        this.CharBuffer.inComment = false;
                    } else if (this.CharBuffer.isComment && !this.CharBuffer.isString && this.CharBuffer.inComment) {
                        //101 = END COMMENT
                        //IF 101 SET 000
                        this.CharBuffer.isComment = true;
                        this.CharBuffer.isString = false;
                        this.CharBuffer.inComment = false;
                    }

                    if (this.CharBuffer.isComment) {
                        this.CharBuffer.Append(char);
                    } else {
                        this.CharBuffer.Append(char);
                        this.CharBuffer.Fill(FileName, row, column);
                    }
                    break;
                default:
                    this.CharBuffer.Append(char);
                    break;
            }
            this.CharBuffer.lastChar = char;
        },
        Serialize: function () {
            var Table = this.CharBuffer.Table;
            var ModuleName = '';
            for (var FileName in Table) {
                ModuleName = this.CharBuffer.ModuleName[FileName];
                this.SymbolBuffer[ModuleName] = [];
                var foundTheEnd = false;
                var lastGoodDeclaration = [ 'none' ];
                var file = Table[FileName];
                for (var r = 0; r < file.length; r++) {
                    var row = file[r];
                    for (var c = 0; c < row.length; c++) {
                        var symbol = row[c];
                        var addSymbol = true;
                        switch (symbol) {
                            case 'END':
                                foundTheEnd = true;
                                break;
                            case '::=':
                                foundTheEnd = false;
                                lastGoodDeclaration = row;
                                break;
                            default:
                                if (symbol.startsWith('--')) {//REMOVE COMMENTS
                                    //console.log(ModuleName, symbol);
                                    addSymbol = false;
                                } else {
                                    foundTheEnd = false;
                                }
                        }
                        if (addSymbol) {
                            this.SymbolBuffer[ModuleName].push(symbol);
                        }
                    }
                }
                if (!foundTheEnd) {
                    // Warn that the contents are malformed
                    console.warn(
                        '[%s]: Incorrect formatting: no END statement found - last good declaration "%s" (line %s)',
                        ModuleName, lastGoodDeclaration.join(' '), lastGoodDeclaration.line
                    );
                }

            }
            this.Compile();
        },
        Compile: function () {
            for (var ModuleName in this.SymbolBuffer) {
                if (this.SymbolBuffer.hasOwnProperty(ModuleName)) {
                    if (!this.Modules[ModuleName]) {
                        this.Modules[ModuleName] = {};
                    }
                    var Module = this.Modules[ModuleName];
                    var Symbols = this.SymbolBuffer[ModuleName];
                    var Object = Module;
                    var MACROName = '';
                    let unresolvedObjects = [];
                    for (var i = 0; i < Symbols.length; i++) {
                        switch (Symbols[i]) {
                            case '::=': // new OBJECT or SMIv1 TRAP-TYPE to define
                                // if an object assignment list is next, the next symbol is a '{' for the integer list
                                const isObjectIdentifierAssignment = Symbols[i + 1].indexOf('{') == 0;
                                // iff it is a TRAP-TYPE macro (SMIv1), the next symbol is an integer
                                const isTrapTypeDefinition = Number.isInteger(Number.parseInt(Symbols[i + 1]));
                                // Object assigment or trap type definition
                                if ( isObjectIdentifierAssignment || isTrapTypeDefinition ) {
                                    let macroIndex = i - 1;
                                    let found = false;
                                    // Go back and find the index position of the macro
                                    while ( ! found && macroIndex > 0) {
                                        macroIndex--;
                                        for (var m = 0; m < this.MACROS.length; m++) {
                                            if (Symbols[macroIndex] == this.MACROS[m]) {
                                                found = true;
                                                break;
                                            }
                                        }
                                    }
                                    // Internal MIB node assignment is marked by an 'OBJECT IDENTIFIER' tag before the ::=
                                    if (Symbols[i - 1] == 'OBJECT IDENTIFIER') {
                                        Object[Symbols[i - 2]] = {};
                                        Object[Symbols[i - 2]]['ObjectName'] = Symbols[i - 2];
                                        Object[Symbols[i - 2]]['ModuleName'] = ModuleName;
                                        Object[Symbols[i - 2]]['OBJECT IDENTIFIER'] = Symbols[i + 1].replace("{", "").replace("}", "").trim().replace(/\s+/, " ");
                                        if (Object[Symbols[i - 2]]['OBJECT IDENTIFIER'] == '0 0') {
                                            Object[Symbols[i - 2]]['OID'] = '0.0';
                                            Object[Symbols[i - 2]]['NameSpace'] = 'null';
                                        } else {
                                            const { oidString, nameString, unresolvedObject } = this.getOidAndNamePaths(Object[Symbols[i - 2]]['OBJECT IDENTIFIER'], Symbols[i - 2], ModuleName);
                                            Object[Symbols[i - 2]]['OID'] = oidString;
                                            Object[Symbols[i - 2]]['NameSpace'] = nameString;
                                            if (unresolvedObject) {
                                                if ( ! unresolvedObjects.includes(unresolvedObject) ) {
                                                    unresolvedObjects.push(unresolvedObject);
                                                }
                                            }
                                            // Object[Symbols[i - 2]]['ModuleName'] = ModuleName;
                                            // Object[Symbols[i - 2]]['ObjectName'] = Symbols[i - 2];
                                        }
                                    // Leaf MIB node assignments have a macro, as do TRAP-TYPE definitions
                                    } else {
                                        const ObjectName = Symbols[macroIndex - 1];
                                        Object[ObjectName] = {};
                                        Object[ObjectName]['ObjectName'] = ObjectName;
                                        Object[ObjectName]['ModuleName'] = ModuleName;
                                        Object[ObjectName]['MACRO'] = Symbols[macroIndex];
                                        // Build MACRO object from TYPE NOTATION
                                        const MACRO = this[Symbols[macroIndex]];
                                        let c1 = macroIndex;
                                        const keychain = [];
                                        keychain.push('DESCRIPTION');
                                        let key;
                                        for (let notation in MACRO['TYPE NOTATION']) {
                                            key = notation;
                                            // If TYPE NOTATION does not have a value
                                            if (MACRO['TYPE NOTATION'][notation] == null) {
                                                // Then look up the value from the MACRO Root
                                                key = MACRO[notation]['MACRO'].replace(/"/g, '');
                                            }
                                            keychain.push(key);
                                        }
                                        while (c1 < (i - 1)) {
                                            c1++;
                                            key = Symbols[c1]; // Parse TYPE NOTATION. ex: SYNTAX, ACCESS, STATUS, DESCRIPTION.....

                                            const regExp = /\(([^)]+)\)/; // in parentheses e.g. "ethernet-csmacd (6)"

                                            if (keychain.indexOf(key) > -1 || key == 'REVISION') {
                                                let val = Symbols[c1 + 1].replace(/"/g, "");
                                                // if value array
                                                if (val.indexOf("{") == 0) {
                                                    c1++;
                                                    while (Symbols[c1].indexOf("}") == -1) {
                                                        c1++;
                                                        val += Symbols[c1];
                                                    }
                                                    if ( key == 'DEFVAL' ) {
                                                        // DEFVAL { 1500 } is not an array
                                                        val = val.replace(/^{/, '').replace(/}$/, '').trim();
                                                    } else {
                                                        // build value array
                                                        val = val.replace("{", "").replace("}", "").split(",").map( (v) => v.trim() );
                                                    }
                                                }

                                                switch (key) {
                                                    case 'SYNTAX':
                                                        switch (val) {
                                                            case 'BITS':
                                                            case 'INTEGER':
                                                            case 'Integer32':
                                                                // integer value array e.g. INTEGER {...rfc877-x25 (5), ethernet-csmacd (6)...}
                                                                if (Symbols[c1 + 2].indexOf("{") == 0) {
                                                                    var valObj = val;
                                                                    val = {};
                                                                    val[valObj] = {};
                                                                    c1 = c1 + 1;
                                                                    var integer;
                                                                    var syntax;
                                                                    while (Symbols[c1].indexOf("}") == -1) {
                                                                        c1++;
                                                                        var ok = false;
                                                                        if (Symbols[c1].indexOf("(") == 0 && Symbols[c1].length > 1) {
                                                                            integer = regExp.exec(Symbols[c1]);
                                                                            syntax = Symbols[c1 - 1];
                                                                            ok = true;
                                                                        } else if (Symbols[c1].indexOf("(") > 0) {
                                                                            integer = regExp.exec(Symbols[c1]);
                                                                            syntax = Symbols[c1].split("(")[0];
                                                                            ok = true;
                                                                        }
                                                                        if (syntax && syntax.indexOf("{") == 0) {
                                                                            syntax = syntax.split("{")[1].trim();
                                                                        }
                                                                        if (ok) {
                                                                            val[valObj][integer[1]] = syntax;
                                                                        }
                                                                    }
                                                                // integer range e.g. INTEGER (1..2147483647)
                                                                } else if (Symbols[c1 + 2].indexOf("(") == 0) {
                                                                    let valObj = val;
                                                                    val = {};
                                                                    val[valObj] = {
                                                                        ranges: this.GetRanges(Symbols[c1 + 2])
                                                                    };
                                                                }
                                                                break;
                                                            case 'OCTET STRING':
                                                            case 'DisplayString':
                                                                // string size e.g. OCTET STRING (SIZE (0..127))
                                                                if (Symbols[c1 + 2].replace(/ */g, '').startsWith('(SIZE')) {
                                                                    let valObj = val;
                                                                    val = {};
                                                                    val[valObj] = {
                                                                        sizes: this.GetRanges(Symbols[c1 + 2])
                                                                    };
                                                                }
                                                                break;
                                                            case 'SEQUENCE OF':
                                                                val += ' ' + Symbols[c1 + 2];
                                                                c1 = c1 + 2;
                                                                break;
                                                            default:
                                                                break;
                                                        }
                                                        //SYNTAX value
                                                        Object[ObjectName][key] = val;
                                                        break;
                                                    case 'DESCRIPTION':
                                                        if ( ! Object[ObjectName][key] ) {
                                                            Object[ObjectName][key] = val;
                                                        }
                                                        if ( ! Object[ObjectName]['REVISIONS-DESCRIPTIONS'] ) {
                                                            Object[ObjectName]['REVISIONS-DESCRIPTIONS'] = [];
                                                        }
                                                        Object[ObjectName]['REVISIONS-DESCRIPTIONS'].push ({
                                                            "type": "DESCRIPTION",
                                                            "value": val
                                                        });
                                                        break;
                                                    case 'REVISION':
                                                        if ( ! Object[ObjectName]['REVISIONS-DESCRIPTIONS'] ) {
                                                            Object[ObjectName]['REVISIONS-DESCRIPTIONS'] = [];
                                                        }
                                                        Object[ObjectName]['REVISIONS-DESCRIPTIONS'].push ({
                                                            "type": "REVISION",
                                                            "value": val
                                                        });
                                                        break;
                                                    default:
                                                        Object[ObjectName][key] = val;
                                                        break;
                                                }
                                            }


                                        }
                                        Object[Symbols[macroIndex - 1]]['ObjectName'] = Symbols[macroIndex - 1];
                                        Object[Symbols[macroIndex - 1]]['ModuleName'] = ModuleName;
                                        if ( isObjectIdentifierAssignment ) {
                                            Object[Symbols[macroIndex - 1]]['OBJECT IDENTIFIER'] = Symbols[i + 1].replace("{", "").replace("}", "").trim().replace(/\s+/, " ");
                                            if (Object[Symbols[macroIndex - 1]]['OBJECT IDENTIFIER'] == '0 0') {
                                                Object[Symbols[macroIndex - 1]]['OID'] = '0.0';
                                                Object[Symbols[macroIndex - 1]]['NameSpace'] = 'null';
                                            } else {
                                                const { oidString, nameString, unresolvedObject } = this.getOidAndNamePaths(Object[Symbols[macroIndex - 1]]['OBJECT IDENTIFIER'], Symbols[macroIndex - 1], ModuleName);
                                                Object[Symbols[macroIndex - 1]]['OID'] = oidString;
                                                Object[Symbols[macroIndex - 1]]['NameSpace'] = nameString;
                                                if (unresolvedObject) {
                                                    if ( ! unresolvedObjects.includes(unresolvedObject) ) {
                                                        unresolvedObjects.push(unresolvedObject);
                                                    }
                                                }
                                            }
                                        } else if ( isTrapTypeDefinition ) {
                                            Object[Symbols[macroIndex - 1]]['VALUE'] = Number.parseInt(Symbols[i + 1]);
                                        }
                                        if ( Object[Symbols[macroIndex - 1]]['REVISIONS-DESCRIPTIONS'] &&
                                                Object[Symbols[macroIndex - 1]]['REVISIONS-DESCRIPTIONS'].length == 1 &&
                                                Object[Symbols[macroIndex - 1]]['REVISIONS-DESCRIPTIONS'][0]['type'] == 'DESCRIPTION' ) {
                                            delete Object[Symbols[macroIndex - 1]]['REVISIONS-DESCRIPTIONS'];
                                        }
                                    }
                                // if object assignment list is not next, check prior symbol for processing instructions / macro creation
                                } else {
                                    switch (Symbols[i - 1]) {
                                        case 'DEFINITIONS':
                                            break;
                                        case 'OBJECT IDENTIFIER':
                                            break;
                                        case 'MACRO':
                                            Object = Object[Symbols[i - 2]] = {};
                                            MACROName = Symbols[i - 2];
                                            break;
                                        case 'VALUE NOTATION':
                                        case 'TYPE NOTATION':
                                            Object[Symbols[i - 1]] = {};
                                            var j = i + 1;
                                            while (Symbols[j + 1] != '::=' && Symbols[j + 1] != 'END') {
                                                if (Symbols[j].indexOf('"') == 0) {
                                                    var value = Symbols[j + 1];
                                                    var t = j + 1;
                                                    if (Symbols[j + 2].indexOf('(') == 0) {
                                                        value = Symbols[j + 2];
                                                        t = j + 2;
                                                    }
                                                    Object[Symbols[i - 1]][Symbols[j].replace(/"/g, "")] = value;
                                                    j = t;
                                                } else {
                                                    Object[Symbols[i - 1]][Symbols[j]] = null;
                                                    if (Symbols[j + 1].indexOf('(') == 0) {
                                                        Object[Symbols[i - 1]][Symbols[j]] = Symbols[j + 1];
                                                        j++;
                                                    }
                                                }
                                                j++;
                                            }
                                            // Workaround for lack of INDEX, AUGMENTS and ACCESS in OBJECT-TYPE MACRO "TYPE NOTATION"
                                            if ( ModuleName == "SNMPv2-SMI" ) {
                                                Object["TYPE NOTATION"].INDEX = "Index";
                                                Object["TYPE NOTATION"].AUGMENTS = "Augments";
                                                Object["TYPE NOTATION"].ACCESS = "Access";
                                            } else if ( ModuleName == "RFC-1212" ) {
                                                Object["TYPE NOTATION"].INDEX = "Index";
                                                Object["TYPE NOTATION"].ACCESS = "Access";
                                            }
                                            // End INDEX/AUGMENTS/ACCESS workaround
                                            break;
                                        default:
                                            // New object
                                            Object[Symbols[i - 1]] = {};
                                            Object[Symbols[i - 1]]['ObjectName'] = Symbols[i - 1];
                                            Object[Symbols[i - 1]]['ModuleName'] = ModuleName;
                                            Object[Symbols[i - 1]]['MACRO'] = Symbols[i + 1];
                                            this.BuildObject(Object, Symbols[i - 1], Symbols[i + 1], i, Symbols);
                                            break;
                                    }
                                }
                                break;
                            case 'END':
                                if (MACROName != '') {
                                    // Add macros to root for easier processing
                                    // Still need Import feature
                                    this[MACROName] = Object;
                                    this.MACROS.push(MACROName);
                                }
                                // Reset Object to Module root;
                                Object = Module;
                                MACROName = '';
                                break;
                            case 'IMPORTS':
                                Module['IMPORTS'] = {};
                                var tmp = i + 1;
                                var IMPORTS = [];
                                while (Symbols[tmp] != ';') {
                                    if (Symbols[tmp] == 'FROM') {
                                        var ImportModule = Symbols[tmp + 1];
                                        if (!this.Modules[ImportModule]) {
                                            console.log(ModuleName + ': Can not find ' + ImportModule + '!!!!!!!!!!!!!!!!!!!!!');
                                            console.log(ModuleName + ': Can not import ', IMPORTS);
                                        }
                                        Module['IMPORTS'][ImportModule] = IMPORTS;
                                        tmp++;
                                        IMPORTS = [];
                                    } else if (Symbols[tmp] != ',') {
                                        IMPORTS.push(Symbols[tmp]);
                                    }
                                    tmp++;
                                }
                                //console.log(ModuleName, 'IMPORTS', Module['IMPORTS']);
                                break;
                            case 'EXPORTS':
                                // EXPORTS only appears for SMIv1 once: in RFC1155-SMI - where it exports everything
                                // EXPORTS are forbidden for SMIv2 in RFC2578 section 3.3, as all objects are exported by default
                                // Therefore, we ignore EXPORTS for both SMIv1 and SMIv2
                                break;
                            default:
                                break;
                        }


                    }
                    // Attempt OID/namespace reconstruction for unresolved objects, as parsing has finished
                    if (unresolvedObjects.length > 0) {
                        for (const unresolved of unresolvedObjects) {
                            const obj = this.Modules[ModuleName][unresolved];

                            const { oidString, nameString, unresolvedObject } = this.getOidAndNamePaths(obj['OBJECT IDENTIFIER'], unresolved, ModuleName);
                            this.Modules[ModuleName][unresolved].NameSpace = nameString;
                            this.Modules[ModuleName][unresolved].OID = oidString;

                            // unresolvedObject is only returned if still unable to resolve (likely due to error in MIB)
                            // unresolved OID will propagate to all children as well
                            if (unresolvedObject) {
                                if (obj.NameSpace) {
                                    const unresolvedParent = obj.NameSpace.split('.')[1];
                                    if (unresolvedParent !== obj.ObjectName) {
                                        console.warn(`Unable to mount node '${obj.ObjectName}', cannot resolve parent object '${unresolvedParent}'.`);
                                        continue;
                                    }
                                }
                                console.warn(`Unable to mount node '${obj.ObjectName}', cannot resolve object identifier '${obj['OBJECT IDENTIFIER']}'.`);
                            }
                        }
                    }
                }
            }
        },
        GetRanges: function (mibRanges) {
            let rangesString = mibRanges.replace(/ */g, '').replace(/\(SIZE/, '').replace(/\)/, '').replace(/\(/, '').replace(/\)/, '');
            let rangeStrings = rangesString.split('|');
            let ranges = [];

            for ( let rangeString of rangeStrings ) {
                if ( rangeString.includes('..') ) {
                    let range = rangeString.split('..');
                    ranges.push({
                        min: parseInt(range[0], 10),
                        max: parseInt(range[1], 10)
                    });
                } else {
                    ranges.push({
                        min: parseInt(rangeString, 10),
                        max: parseInt(rangeString, 10)
                    });
                }
            }
            return ranges;
        },
        BuildObject: function (Object, ObjectName, macro, i, Symbols) {

            var syntaxKeyword = Symbols.indexOf('SYNTAX', i);
            var m = syntaxKeyword - i;
            var c1 = syntaxKeyword + 1;
            var SYNTAX = Symbols[c1];
            var val = Symbols[c1 + 1];

            // Normal MACROs
            if (this.MACROS.indexOf(macro) > -1 && m < 10) {
                if (val[0] === "{") {
                    this.BuildObjectEnumeration(Object, ObjectName, c1, SYNTAX, val, Symbols);
                } else if (val[0] === '(') {
                    const key = val.startsWith('(SIZE')? 'sizes' : 'ranges';
                    Object[ObjectName]['SYNTAX'] = {};
                    Object[ObjectName]['SYNTAX'][SYNTAX] = { [key]: this.GetRanges(val) };
                } else {
                    Object[ObjectName]['SYNTAX'] = SYNTAX;
                }
            // SMIv1 INTEGER enumerations
            } else if ( Symbols[i + 1] == 'INTEGER' ) {
                c1 = i + 1;
                SYNTAX = 'INTEGER';
                val = Symbols[c1 + 1];
                if ( val[0] === '{' ) {
                    this.BuildObjectEnumeration(Object, ObjectName, c1, SYNTAX, val, Symbols);
                }
            }
        },
        BuildObjectEnumeration: function (Object, ObjectName, c1, SYNTAX, val, Symbols) {
            c1++;
            while (Symbols[c1].indexOf("}") == -1) {
                c1++;
                val += Symbols[c1].trim();
            }
            val = val.replace("{", "").replace("}", "").split(",");
            Object[ObjectName]['SYNTAX'] = {};
            Object[ObjectName]['SYNTAX'][SYNTAX] = {};
            for (var TC = 0; TC < val.length; TC++) {
                let openParenSplit = val[TC].split(/\s*\(\s*/);
                Object[ObjectName]['SYNTAX'][SYNTAX][openParenSplit[1].replace(/\s*\)\s*$/, '')] = openParenSplit[0].trimStart();
            }
        },
        GetSummary: function (callback) {
            var summary = '';
            for (var ModuleName in this.Modules) {
                if (this.Modules.hasOwnProperty(ModuleName)) {
                    for (var ObjectName in this.Modules[ModuleName]) {
                        if (this.Modules[ModuleName].hasOwnProperty(ObjectName)) {
                            if (this.Modules[ModuleName][ObjectName]['OID']) {
                                //OID
                                summary += this.Modules[ModuleName][ObjectName]['OID'] + " : " + ObjectName + '\r\n';
                                //callback(this.Modules[ModuleName][ObjectName]);
                                //break;
                            }
                        }
                    }
                }
            }
            callback(summary);
        },
        getOidAndNamePaths: function (OBJECT_IDENTIFIER, ObjectName, ModuleName) {
            const entries = OBJECT_IDENTIFIER.split(/\s+/);
            const parent = entries.shift();
            const finalEntries = entries.pop();
            const nameEntries = [];
            const oidEntries = [];
            // process middle entries if any
            // e.g. { enterprises pwg(2699) mibs(1) jobmonMIB(1) }
            for (const entry of entries) {
                const match = entry.match(/(.*)\((.+)\)$/);
                if ( match ) {
                    oidEntries.push(match[2]);
                    nameEntries.push(match[1]);
                } else {
                    // cater for unannotated middle entries (use number entries for name entries)
                    // e.g. { enterprises 2699 1 1 }
                    oidEntries.push(entry);
                    nameEntries.push(entry);
                }
            }
            // ignore name entry if it exists on final OID entry - use object name instead
            // e.g. for { mibs jobmonMIB(1) } we would ignore the "jobmonMIB" name
            let finalOid;
            if ( finalEntries.includes('(') ) {
                const oidSplit = finalEntries.match(/(.*)\((.+)\)$/);
                finalOid = oidSplit[2];
            } else {
                finalOid = finalEntries;
            }
            oidEntries.push(finalOid);
            nameEntries.push(ObjectName);
            let parentOidPrefix;
            let parentNamePrefix;
            let unresolvedObject;
            if ( parent == 'iso' ) {
                parentOidPrefix = '1';
                parentNamePrefix = 'iso';
            } else {
                // find parent object
                // first look in the current module
                let parentObject = this.Modules[ModuleName][parent];
                // if not found, find the import entry for the object
                if ( ! parentObject ) {
                    const importModules = Object.keys(this.Modules[ModuleName]['IMPORTS']);
                    for (let importModule of importModules) {
                        if (this.Modules[importModule][parent]) {
                            parentObject = this.Modules[importModule][parent];
                            break;
                        }
                    }
                }
                if ( ! parentObject ) {
                    // occurs for out-of-order dependencies in a module
                    // return partial OID/namespace and name of unresolved object
                    unresolvedObject = ObjectName;
                    return {
                        oidString: '.' + oidEntries.join('.'),
                        nameString: '.' + nameEntries.join('.'),
                        unresolvedObject
                    };
                }
                // occurs for all children of an unresolved node
                if ( parentObject.OID.startsWith('.') ) {
                    unresolvedObject = ObjectName;
                }
                parentOidPrefix = parentObject['OID'];
                parentNamePrefix = parentObject['NameSpace'];
            }
            return {
                oidString: parentOidPrefix + '.' + oidEntries.join('.'),
                nameString: parentNamePrefix + '.' + nameEntries.join('.'),
                unresolvedObject: unresolvedObject || undefined
            };
        }
    });

    // Complete buffer setup before returning to caller.
    initializeBuffer(newMIB.CharBuffer);

    return newMIB;
};

module.exports = exports = MIB;
exports.MIB = MIB;
exports.native = undefined;
