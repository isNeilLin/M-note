import { app, BrowserWindow, Menu, ipcMain, shell } from 'electron'

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
}

let mainWindow
const winURL = process.env.NODE_ENV === 'development'
  ? `http://localhost:9080`
  : `file://${__dirname}/index.html`

function createWindow () {
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    height: 563,
    useContentSize: true,
    width: 1000
  })
  initMenu(mainWindow)
  mainWindow.loadURL(winURL)

  mainWindow.on('closed', () => {
    mainWindow = null
  })
  
}

function initMenu(mainWindow){
  let template = [
      {
          label: '编辑',
          submenu: [
              {role: 'undo', accelerator: 'CommandOrControl+Z', label: '撤销'},
              {role: 'redo', accelerator: 'CommandOrControl+Shift+Z', label: '重做'},
              {type: 'separator'},
              {role: 'copy', accelerator: 'CommandOrControl+C', label: '复制'},
              {role: 'paste', accelerator: 'CommandOrControl+V', label: '粘贴'},
              {role: 'cut', accelerator: 'CommandOrControl+X', label: '剪切'},
              {role: 'selectall', accelerator: 'CommandOrControl+A', label: '全选'}
          ]
      },{
        label: '标记',
        submenu: [
          {
            label: '加粗',
            accelerator: 'CommandOrControl+B',
            click: function(){
              ipcMain.send('menuEvent','blod')
            }
          },
          {
            label: '下划线',
            accelerator: 'CommandOrControl+Shift+U',
            click: function(){
              ipcMain.send('menuEvent','underline')
            }
          },
          {
            label: '删除线',
            accelerator: 'CommandOrControl+-',
            click: function(){
              ipcMain.send('menuEvent','deleteline')
            }
          },
          {type: 'separator'},
          {
            label: '注释',
            accelerator: 'CommandOrControl+/',
            click: function(){
              ipcMain.send('menuEvent','comment')
            }
          },
          {
            label: '行内代码',
            accelerator: 'CommandOrControl+K',
            click: function(){
              ipcMain.send('menuEvent','inlineCode')
            }
          },
          {
            label: '代码块',
            accelerator: 'CommandOrControl+Shift+K',
            click: function(){
              ipcMain.send('menuEvent','blockCode')
            }
          },
          {type: 'separator'},
          {
            label: '无序列表',
            accelerator: 'CommandOrControl+U',
            click: function(){
              ipcMain.send('menuEvent','ul')
            }
          },
          {
            label: '有序列表',
            accelerator: 'CommandOrControl+O',
            click: function(){
              ipcMain.send('menuEvent','ol')
            }
          },
          {
            label: '引用',
            accelerator: 'CommandOrControl+Shift+B',
            click: function(){
              ipcMain.send('menuEvent','quote')
            }
          },
          {
            label: '链接',
            accelerator: 'CommandOrControl+L',
            click: function(){
              ipcMain.send('menuEvent','link')
            }
          },
          {
            label: '图片',
            accelerator: 'CommandOrControl+I',
            click: function(){
              ipcMain.send('menuEvent','image')
            }
          },{
            label: '表格',
            accelerator: 'CommandOrControl+T',
            click: function(){
              ipcMain.send('menuEvent','table')
            }
          }
        ]
      },{
        label: '视图',
        submenu: [
          {
            label: '预览/取消预览',
            accelerator: 'CommandOrControl+R',
            click: function(){
              ipcMain.send('menuEvent','preview')
            }
          },
          {
            label: '仅显示编辑器',
            accelerator: 'CommandOrControl+1',
            click: function(){
              ipcMain.send('menuEvent','oneMode')
            }
          },
          {
            label: '双栏视图模式',
            accelerator: 'CommandOrControl+2',
            click: function(){
              ipcMain.send('menuEvent','twoMode')
            }
          },
          {
            label: '三栏视图模式',
            accelerator: 'CommandOrControl+3',
            click: function(){
              ipcMain.send('menuEvent','threeMode')
            }
          },
          {
            label: '切换实时预览',
            accelerator: 'CommandOrControl+W',
            click: function(){
              ipcMain.send('menuEvent','fourMode')
            }
          }
        ]
      },
      {
        label: '窗口',
        submenu: [
          {
            label: '最小化',
            accelerator: 'CommandOrControl+M',
            role: 'minimize',
          },
          {
            label: '最大化',
            accelerator: 'CommandOrControl+Shift+M',
            click: function(){
              mainWindow.maximize()
            }
          },
          {
            label: '全屏',
            accelerator: 'CommandOrControl+Shift+F',
            click: function(){
              mainWindow.setFullScreen(true)
            }
          },
          {
            label: '还原',
            accelerator: 'CommandOrControl+Alt+R',
            click: function(){
              mainWindow.restore()
              mainWindow.unmaximize()
              mainWindow.setFullScreen(false)
            }
          },
          {
            label: '退出',
            accelerator: 'CommandOrControl+Q',
            click: function(){
              app.quit()
            }
          }
        ]
      },
      {
        label: '帮助',
        submenu: [
          {
            label: 'Markdown语法',
            click: function(){
              shell.openExternal('https://coding.net/help/doc/project/markdown.html')
            }
          },{
            label: 'BUG反馈',
            click: function(){
              shell.openExternal()
            }
          },
        ]
      }
  ];
  //注册菜单 
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

/**
 * Auto Updater
 *
 * Uncomment the following code below and install `electron-updater` to
 * support auto updating. Code Signing with a valid certificate is required.
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-electron-builder.html#auto-updating
 */

/*
import { autoUpdater } from 'electron-updater'

autoUpdater.on('update-downloaded', () => {
  autoUpdater.quitAndInstall()
})

app.on('ready', () => {
  if (process.env.NODE_ENV === 'production') autoUpdater.checkForUpdates()
})
 */
