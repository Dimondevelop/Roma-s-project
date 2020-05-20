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
var electron_1 = require("electron");
var main_1 = require("../../main");
var fs_1 = require("fs");
var path_1 = require("path");
var glob_1 = require("glob");
var doxtract_1 = require("doxtract");
var elasticsearch_1 = require("@elastic/elasticsearch");
var HttpGetQueue_1 = require("./HttpGetQueue");
exports.client = new elasticsearch_1.Client({ node: 'http://localhost:9200' });
var sub;
// const { webContents } = win
electron_1.ipcMain.on('changeIndexingDirectory', function (event) {
    electron_1.dialog.showOpenDialog(main_1.win, {
        defaultPath: path_1.join(__dirname, '/../../documents'),
        properties: ['openDirectory']
    }).then(function (files) {
        main_1.win.webContents.send('ipcLog', { message: { files: files, message: 'OpenDialogReturnValue' } });
        if (files) {
            event.sender.send('selectedDirectory', files);
            main_1.win.webContents.send('ipcLog', { message: { files: files, message: 'if' } });
        }
    });
});
electron_1.ipcMain.on('reindex', function (event, arg) {
    var sender = event.sender;
    // note const documents_dir = join(__dirname, '/../../../../documents') /*for build*/
    var documents_dir = path_1.join(__dirname, '/../../documents'); /*for dev*/
    if (!fs_1.existsSync(documents_dir)) {
        fs_1.mkdir(documents_dir, function (err) { if (err)
            throw err; });
    }
    var files = glob_1.sync(path_1.join(documents_dir, '*.docx'));
    deleteAll();
    createIndex().then(function () {
        indexAll(files).then(function () {
            sender.send('ipcLog', { message: 'All documents EXTRACTED' });
        }).catch(function (err) { throw err; });
    });
});
function createIndex() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, exports.client.indices.create({
                        index: 'docx',
                        body: {
                            "mappings": {
                                properties: {
                                    "name": { "type": "keyword" },
                                    "full_text": { "type": "text" }
                                }
                            }
                        }
                    }, { ignore: [400] })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function sendRequest(client, dataset) {
    return __awaiter(this, void 0, void 0, function () {
        var body, bulkResponse, erroredDocuments_1, count;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    main_1.win.webContents.send('ipcLog', { message: { client: client, dataset: dataset } });
                    body = dataset.flatMap(function (doc) { return [{ index: { _index: 'docx' } }, doc]; });
                    bulkResponse = { errors: null, items: [] };
                    return [4 /*yield*/, client.bulk({ refresh: 'true', body: body }).then(function (data) {
                            bulkResponse = data.body;
                        }).catch(function (error) {
                            console.error(error);
                        })];
                case 1:
                    _a.sent();
                    if (bulkResponse.errors) {
                        erroredDocuments_1 = [];
                        bulkResponse.items.forEach(function (action, i) {
                            var operation = Object.keys(action)[0];
                            if (action[operation].error) {
                                erroredDocuments_1.push({
                                    status: action[operation].status,
                                    error: action[operation].error,
                                    operation: body[i * 2],
                                    document: body[i * 2 + 1]
                                });
                            }
                        });
                        console.log(erroredDocuments_1);
                        throw erroredDocuments_1;
                    }
                    return [4 /*yield*/, client.count({ index: 'docx' })];
                case 2:
                    count = (_a.sent()).body;
                    return [2 /*return*/, count];
            }
        });
    });
}
function indexAll(files) {
    return __awaiter(this, void 0, void 0, function () {
        var length, instance, i;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    length = files.length - 1;
                    instance = new HttpGetQueue_1.HttpGetQueue(sendRequest, exports.client);
                    sub = instance.results.subscribe(function (res) {
                        main_1.win.webContents.send('ipcLog', { message: res });
                        if (res.count >= files.length) {
                            sub.unsubscribe();
                            main_1.win.webContents.send('reindexResponse', { files: files });
                            main_1.win.webContents.send('ipcLog', { message: 'files.length: ' + files.length + ' res.count: ' + res.count });
                        }
                    });
                    _a.label = 1;
                case 1:
                    if (!(length > 0)) return [3 /*break*/, 3];
                    i = length;
                    length -= 200;
                    return [4 /*yield*/, separatedExtract(i, length, files).then(function (dataset) {
                            instance.addToQueue(dataset);
                        })];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 1];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function separatedExtract(i, length, files) {
    return __awaiter(this, void 0, void 0, function () {
        var dataset, _loop_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    dataset = [];
                    _loop_1 = function () {
                        var name_1;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    name_1 = path_1.parse(files[i]).name;
                                    return [4 /*yield*/, doxtract_1.extractText(files[i]).then(function (text) {
                                            // console.log(name, 'extracted!')
                                            dataset.push({
                                                name: name_1,
                                                "full_text": text
                                            });
                                        }).catch(function (err) { throw err; })];
                                case 1:
                                    _a.sent();
                                    return [2 /*return*/];
                            }
                        });
                    };
                    _a.label = 1;
                case 1:
                    if (!(i > length && i >= 0)) return [3 /*break*/, 4];
                    return [5 /*yield**/, _loop_1()];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    i--;
                    return [3 /*break*/, 1];
                case 4: return [2 /*return*/, dataset];
            }
        });
    });
}
function deleteAll() {
    exports.client.indices.delete({
        index: '_all'
    }, function (err, res) {
        if (err) {
            throw err.message;
        }
        else {
            main_1.win.webContents.send('ipcLog', { message: 'All indexes have been deleted!' });
        }
    });
}
//# sourceMappingURL=indexing.js.map