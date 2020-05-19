import { app, BrowserWindow, screen as electronScreen } from 'electron';
import { Client } from '@elastic/elasticsearch';
import * as path from 'path';
import * as url from 'url';
import * as glob from "glob";

const client = new Client({ node: 'http://localhost:9200' });
export let win: BrowserWindow = null;
const args = process.argv.slice(1),
    serve = args.some(val => val === '--serve');

function createWindow(): BrowserWindow {

  const size = electronScreen.getPrimaryDisplay().workAreaSize;

  // Create the browser window.
  win = new BrowserWindow({
    x: 0,
    y: 0,
    width: size.width * .8,
    height: size.height * .8,
    frame: false,
    webPreferences: {
      nodeIntegration: true,
      allowRunningInsecureContent: (serve) ? true : false,
    },
  });

  if (serve) {
    require('electron-reload')(__dirname, {
      electron: require(`${__dirname}/node_modules/electron`)
    });
    win.loadURL('http://localhost:4200');
  } else {
    win.loadURL(url.format({
      pathname: path.join(__dirname, 'dist/index.html'),
      protocol: 'file:',
      slashes: true
    }));
  }

  if (serve) {
    win.webContents.openDevTools();
  }

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store window
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null;
  });

  !serve && win.setMenuBarVisibility(false)


  return win;
}

function require_main_process (): void {
  const files = glob.sync(path.join(__dirname, 'main-process/**/*.js'));
  files.forEach((file) => { require(file) })
}

try {
  require_main_process();

  app.allowRendererProcessReuse = true;

  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  app.on('ready', createWindow);

  // Quit when all windows are closed.
  app.on('window-all-closed', () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
      createWindow();
    }
  });

  // ipcMain.on('reindex', (event, arg) => {
  //   const files = fs.readdirSync(__dirname);
  //   win.webContents.send('reindexResponse', files);
  //   // event.sender.send('reindexResponse', files);
  // });

} catch (e) {
  // Catch Error
  // throw e;
}
