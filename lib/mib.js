var fs = require('fs');

var MIB = function (dir) {
    return ({
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
            Table: {},
            ColumnIndex: 0,
            RowIndex: 0,
            ModuleName: {},
            PreviousRow: 0,
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
                this.builder.length = 0;
                if (!this.Table[FileName]) {
                    this.Table[FileName] = [];
                }
                if (row == 0) {
                    this.RowIndex = 0;
                    this.PreviousRow = 0;
                }
                if (this.PreviousRow < row) {
                    this.RowIndex++;
                    this.ColumnIndex = 0;
                    this.PreviousRow = row;

                }
                var R = this.RowIndex;
                var C = this.ColumnIndex;

                if (!this.Table[FileName][R]) {
                    this.Table[FileName][R] = [];
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
            this.ParseModule(FileName.split('/')[FileName.split('/').length - 1].split('.')[0], fs.readFileSync(FileName).toString());
        },
        ParseModule: function (FileName, Contents) {
            this.CharBuffer.RowIndex = 0;
            this.CharBuffer.ColumnIndex = 0;

            var lines = Contents.split('\n');
            var line = '';
            var i = 0;
            while ((line = lines[i]) != null && i <= lines.length) {
                this.ParseLine(FileName, line, i);
                i++;
            }
        },
        ParseLine: function (FileName, line, row) {
            line = line + "\n";
            for (var i = 0; i < line.length; i++) {
                var char = line.charAt(i);
                this.ParseChar(FileName, char, row, i);
            }
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
                    if (this.CharBuffer.isEqual) { this.CharBuffer.isOID = true; }
                case '[':
                case '(':
                    if ( ! this.CharBuffer.isString ) {
                        this.CharBuffer.nested++;
                        if ( char == '(') {
                            this.CharBuffer.inGroup++;
                        }
                    }
                    if (this.CharBuffer.builder == 'INTEGER') {
                        this.CharBuffer.Fill(FileName, row, column);
                        this.CharBuffer.Append(char);
                    } else if (this.CharBuffer.isComment || ((this.CharBuffer.isOID || this.CharBuffer.nested > 0) && (!this.CharBuffer.isList || this.CharBuffer.inGroup > 0))) {
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
                    if ( ! this.CharBuffer.isString ) {
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
                    if (this.CharBuffer.lastChar == '-') {
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
                for (var r = 0; r < Table[FileName].length; r++) {
                    for (var c = 0; c < Table[FileName][r].length; c++) {
                        var symbol = Table[FileName][r][c];
                        switch (symbol) {
                            default:
                                if (symbol.indexOf('--') != 0) {//REMOVE COMMENTS
                                    //console.log(ModuleName, symbol);
                                    this.SymbolBuffer[ModuleName].push(symbol);
                                }
                        }
                    }
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
                    for (var i = 0; i < Symbols.length; i++) {
                        switch (Symbols[i]) {
                            case '::=': //new OBJECT to define
                                //if OBJECT IDENTIFIER tag IS NEXT, FIND MARCO TO CALL...
                                if (Symbols[i + 1].indexOf('{') == 0) {
                                    var r = i - 1;
                                    var found = false;
                                    //Go back and find the MACRO to call
                                    while (!found && r > 0) {
                                        r--;
                                        for (var m = 0; m < this.MACROS.length; m++) {
                                            if (Symbols[r] == this.MACROS[m]) {
                                                found = true;
                                                break;
                                            }
                                        }
                                    }
                                    if (Symbols[i - 1] == 'OBJECT IDENTIFIER') {
                                        Object[Symbols[i - 2]] = {};
                                        Object[Symbols[i - 2]]['ObjectName'] = Symbols[i - 2];
                                        Object[Symbols[i - 2]]['ModuleName'] = ModuleName;
                                        Object[Symbols[i - 2]]['OBJECT IDENTIFIER'] = Symbols[i + 1].replace("{", "").replace("}", "").trim();
                                        if (Object[Symbols[i - 2]]['OBJECT IDENTIFIER'] == '0 0') {
                                            Object[Symbols[i - 2]]['OID'] = '0.0';
                                            Object[Symbols[i - 2]]['NameSpace'] = 'null';
                                        } else {
                                            this.OID(Object[Symbols[i - 2]]['OBJECT IDENTIFIER'], '', Symbols[i - 2], '', function (ID, OD) {

                                                Object[Symbols[i - 2]]['OID'] = ID;
                                                Object[Symbols[i - 2]]['NameSpace'] = OD;
                                                //Object[Symbols[i - 2]]['ModuleName'] = ModuleName;
                                                // Object[Symbols[i - 2]]['ObjectName'] = Symbols[i - 2];
                                            });
                                        }

                                    } else {
                                        var ObjectName = Symbols[r - 1];
                                        Object[ObjectName] = {};
                                        Object[ObjectName]['ObjectName'] = ObjectName;
                                        Object[ObjectName]['ModuleName'] = ModuleName;
                                        Object[ObjectName]['MACRO'] = Symbols[r];
                                        //BUILD OBJECT FROM MACRO TYPE NOTATION
                                        var MARCO = this[Symbols[r]];
                                        if (!MARCO) {
                                            //HACK IF MARCO IS NOT FOUND 
                                            //MARCO = {};
                                            //return;
                                        }
                                        var c1 = r;
                                        var keychain = [];
                                        keychain.push('DESCRIPTION');
                                        var key;
                                        for (var notation in MARCO['TYPE NOTATION']) {
                                            key = notation;
                                            //if TYPE NOTATION does not have a value
                                            if (MARCO['TYPE NOTATION'][notation] == null) {
                                                //then look up the value from the MACRO Root
                                                key = MARCO[notation]['MACRO'].replace(/"/g, '');
                                            }
                                            keychain.push(key);
                                        }
                                        while (c1 < (i - 1)) {
                                            c1++;
                                            key = Symbols[c1]; //Parse TYPE NOTATION. ex: SYNTAX, ACCESS, STATUS, DESCRIPTION.....

                                            //key == 'DESCRIPTION' ? console.log(keychain.indexOf(key), key, Symbols[c1 + 1]) : false;

                                            var regExp = /\(([^)]+)\)/; //in parentheses ex: "ethernet-csmacd (6)"

                                            if (keychain.indexOf(key) > -1 || key == 'REVISION') {
                                                var val = Symbols[c1 + 1].replace(/"/g, "");
                                                //if value array.
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
                                                        val = val.replace("{", "").replace("}", "").split(",");
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
                                        Object[Symbols[r - 1]]['ObjectName'] = Symbols[r - 1];
                                        Object[Symbols[r - 1]]['ModuleName'] = ModuleName;
                                        Object[Symbols[r - 1]]['OBJECT IDENTIFIER'] = Symbols[i + 1].replace("{", "").replace("}", "").trim();

                                        if (Object[Symbols[r - 1]]['OBJECT IDENTIFIER'] == '0 0') {
                                            Object[Symbols[r - 1]]['OID'] = '0.0';
                                            Object[Symbols[r - 1]]['NameSpace'] = 'null';
                                        } else {
                                            this.OID(Object[Symbols[r - 1]]['OBJECT IDENTIFIER'], '', Symbols[r - 1], '', function (ID, OD) {

                                                Object[Symbols[r - 1]]['OID'] = ID;
                                                Object[Symbols[r - 1]]['NameSpace'] = OD;
                                                //Object[Symbols[r - 1]]['ModuleName'] = ModuleName;
                                                //Object[Symbols[r - 1]]['ObjectName'] = Symbols[r - 1];
                                            });
                                        }
                                        if ( Object[Symbols[r - 1]]['REVISIONS-DESCRIPTIONS'] &&
                                                Object[Symbols[r - 1]]['REVISIONS-DESCRIPTIONS'].length == 1 &&
                                                Object[Symbols[r - 1]]['REVISIONS-DESCRIPTIONS'][0]['type'] == 'DESCRIPTION' ) {
                                            delete Object[Symbols[r - 1]]['REVISIONS-DESCRIPTIONS'];
                                        }

                                    }
                                } else {
                                    //if OBJECT IDENTIFIER tag is NOT NEXT, check prior symbol for processing instructions / MARCO creation.
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
                                            // End INDEX/AUGMENTS workaround
                                            break;
                                        default:
                                            //new object
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
                                    //ADD macros to root for easier processing
                                    //Still need Import feature
                                    this[MACROName] = Object;
                                    this.MACROS.push(MACROName);
                                }
                                //reset Object to Module root;
                                Object = Module;
                                MACROName = '';
                                break;
                            case 'IMPORTS':
                                //console.log(ModuleName, 'IMPORTS');
                                //i++;
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
                                //console.log(ModuleName, 'EXPORTS');
                                break;
                            default:
                                break;
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

            var r = i;
            var m = Symbols.indexOf('SYNTAX', r) - r;
            var SYNTAX = Symbols[Symbols.indexOf('SYNTAX', r) + 1];
            var val = Symbols[Symbols.indexOf('SYNTAX', r) + 2];
            var c1 = Symbols.indexOf('SYNTAX', r) + 1;

            if (this.MACROS.indexOf(macro) > -1 && m < 10) {
                switch (SYNTAX) {
                    case "INTEGER":
                        if (val.indexOf("{") == 0) {
                            c1++;
                            while (Symbols[c1].indexOf("}") == -1) {
                                c1++;
                                val += Symbols[c1].trim();
                            }
                            val = val.replace("{", "").replace("}", "").split(",");

                            Object[ObjectName]['SYNTAX'] = {};
                            Object[ObjectName]['SYNTAX'][SYNTAX] = {};

                            for (var TC = 0; TC < val.length; TC++) {
                                Object[ObjectName]['SYNTAX'][SYNTAX][val[TC].split("(")[1].replace(")", "")] = val[TC].split("(")[0];
                            }
                        }
                        break;
                    default:
                        Object[ObjectName]['SYNTAX'] = SYNTAX;
                        break;

                }
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
        OID: function (OBJECT_IDENTIFIER, ID, ObjectName, OD, callback) {
            let members = OBJECT_IDENTIFIER.split(" ");
            let parent = members.shift();
            let oid = members.pop();
            if (parent == 'iso') {
                let midID = ['1'];
                let midOD = ['iso'];
                for (let entry of members) {
                    let match = entry.match(/(.*)\((.+)\)$/);
                    midID.push(match[2]);
                    midOD.push(match[1]);
                }
                midID.push(oid);
                if ( ID != '' ) {
                    midID.push(ID);
                }
                if ( OD != '' ) {
                    midOD.push(OD);
                }
                midOD.push(ObjectName);
                callback(midID.join('.'), midOD.join('.'));
                return;
            }
            ID = ID == '' ? oid : [oid, ID].join('.');
            OD = OD == '' ? parent : [parent, OD].join('.');
            for (var ModuleName in this.Modules) {
                if (this.Modules.hasOwnProperty(ModuleName)) {
                    if (this.Modules[ModuleName][parent]) {
                        this.OID(this.Modules[ModuleName][parent]["OBJECT IDENTIFIER"], ID, ObjectName, OD, callback);
                        break;
                    }
                }
            }
        }
    });
};

module.exports = exports = MIB;
exports.MIB = MIB;
exports.native = undefined;
