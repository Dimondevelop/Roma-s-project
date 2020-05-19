"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var main_1 = require("../../main");
var electron_1 = require("electron");
var indexing_1 = require("../indexing/indexing");
electron_1.ipcMain.on('search', function (event, arg) {
    var sender = event.sender;
    search(separate(arg.text)).then(function (results) {
        console.log(results);
        sender.send('ipcLog', { message: { results: results } });
        sender.send('searchResults', { results: results });
    }).catch(function (err) { throw err; });
    main_1.win.webContents.send('ipcLog', { message: 'OnSearch emit' });
});
function separate(text) {
    var removeRN = /[\r\n]/gm;
    var regexp = /(.{500}|.+$)([\u0400-\u04FF\S]|\w)*/gm;
    return text.replace(removeRN, ' ').match(regexp);
}
function search(text) {
    return __awaiter(this, void 0, void 0, function () {
        var queries, _i, text_1, str, body;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    queries = [];
                    for (_i = 0, text_1 = text; _i < text_1.length; _i++) {
                        str = text_1[_i];
                        queries.push({ "match": { "query": str } });
                    }
                    return [4 /*yield*/, indexing_1.client.search({
                            index: 'docx',
                            body: {
                                "_source": "name",
                                "query": {
                                    "intervals": {
                                        "full_text": {
                                            "any_of": {
                                                "intervals": queries
                                            }
                                        }
                                    }
                                    // "match" : { "full_text" : text }
                                    /*        "match" : {
                                              "full_text" : { "query" : text, "operator" : "and" }
                                            }*/
                                },
                                "highlight": {
                                    "fields": {
                                        "full_text": {}
                                    }
                                }
                            }
                        })];
                case 1:
                    body = (_a.sent()).body;
                    return [2 /*return*/, body.hits.hits
                        // hits.forEach((hit) => {
                        //   console.log({document: hit._source.name, score: hit._score, highlight: hit.highlight})
                        //   // console.log(hit)
                        // })
                    ];
            }
        });
    });
}
//# sourceMappingURL=search.js.map