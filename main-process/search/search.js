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
var doxtract_1 = require("doxtract");
var path_1 = require("path");
var indexing_1 = require("../indexing/indexing");
var HttpGetQueue_1 = require("../indexing/HttpGetQueue");
var sub;
electron_1.ipcMain.on('search', function (event, arg) {
    var sender = event.sender;
    var separatedText = separate(arg.text, 500);
    search(indexing_1.client, { document: separatedText, name: 'textArea' }).then(function (results) {
        sender.send('ipcLog', { message: { results: results } });
        sender.send('searchResults', { results: results.results });
    }).catch(function (err) { throw err; });
    main_1.win.webContents.send('ipcLog', { message: 'OnSearch emit' });
});
function separate(text, count) {
    var removeRN = /[\r\n]/gm;
    // const regexp = /(.{500}|.+$)([\u0400-\u04FF\S]|\w)*/gm
    var regexp = new RegExp("(.{" + count + "}|.+$)([\u0400-\u04FF\\S]|\\w)*", 'gm');
    var separatedText = text.replace(removeRN, ' ').match(regexp);
    console.log(separatedText);
    return separatedText;
}
function search(client, _a) {
    var text = _a.document, name = _a.name;
    return __awaiter(this, void 0, void 0, function () {
        var queries, _i, text_1, str, body;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    queries = [];
                    for (_i = 0, text_1 = text; _i < text_1.length; _i++) {
                        str = text_1[_i];
                        queries.push({ "match": { "query": str } });
                    }
                    return [4 /*yield*/, client.search({
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
                    body = (_b.sent()).body;
                    return [2 /*return*/, { results: body.hits.hits, name: name }
                        // hits.forEach((hit) => {
                        //   console.log({document: hit._source.name, score: hit._score, highlight: hit.highlight})
                        //   // console.log(hit)
                        // })
                    ];
            }
        });
    });
}
electron_1.ipcMain.on('chooseSearchDocuments', function (event) {
    electron_1.dialog.showOpenDialog(main_1.win, {
        title: 'Оберіть файли для пошуку',
        properties: ['openFile', 'multiSelections']
    }).then(function (_a) {
        var canceled = _a.canceled, filePaths = _a.filePaths;
        if (canceled) {
            event.sender.send('searchResults', false);
            return;
        }
        if (filePaths.length) {
            extractDocuments(filePaths).then(function (extractedDocuments) {
                getMultipleResults(extractedDocuments).then(function (results) {
                    main_1.win.webContents.send('searchResults', { results: results });
                    sub.unsubscribe();
                });
            });
            // event.sender.send('selectedFiles', files)
        }
    });
});
function getMultipleResults(extractedDocuments) {
    return __awaiter(this, void 0, void 0, function () {
        var searchResults, instance, i;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    searchResults = [];
                    instance = new HttpGetQueue_1.HttpGetQueue(search, indexing_1.client);
                    i = 0;
                    return [4 /*yield*/, new Promise(function (resolve) {
                            sub = instance.results.subscribe(function (_a) {
                                var results = _a.results, name = _a.name;
                                i++;
                                main_1.win.webContents.send('ipcLog', { message: { res: { results: results, name: name }, log: 'ipc' } });
                                searchResults.push({ document: results, name: name });
                                if (i === extractedDocuments.length) {
                                    resolve(searchResults);
                                }
                            });
                            for (var _i = 0, extractedDocuments_1 = extractedDocuments; _i < extractedDocuments_1.length; _i++) {
                                var exDoc = extractedDocuments_1[_i];
                                instance.addToQueue(exDoc);
                                // await search(client, exDoc).then(({results, name}) => {
                                //   searchResults.push({document: results, name: name});
                                // }).catch((err) => {
                                //   throw err
                                // })
                            }
                        })];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    });
}
function extractDocuments(documents) {
    return __awaiter(this, void 0, void 0, function () {
        var extractedDocuments, _loop_1, _i, documents_1, doc;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    extractedDocuments = [];
                    _loop_1 = function (doc) {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, doxtract_1.extractText(doc).then(function (text) {
                                        extractedDocuments.push({ document: separate(text, 500), name: path_1.parse(doc).name });
                                    }).catch(function (err) { throw err; })];
                                case 1:
                                    _a.sent();
                                    return [2 /*return*/];
                            }
                        });
                    };
                    _i = 0, documents_1 = documents;
                    _a.label = 1;
                case 1:
                    if (!(_i < documents_1.length)) return [3 /*break*/, 4];
                    doc = documents_1[_i];
                    return [5 /*yield**/, _loop_1(doc)];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4: return [2 /*return*/, extractedDocuments];
            }
        });
    });
}
//# sourceMappingURL=search.js.map