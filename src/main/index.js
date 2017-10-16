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
    show: false,
    width: 1000
  })
  initMenu(mainWindow)
  mainWindow.loadURL(winURL)
  mainWindow.on('ready-to-show',() => {
    mainWindow.show();
  })
  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

function initMenu(mainWindow){
  let template = [
      {
        label: 'M-note',
        submenu: [
          {
            label: '关于M-note',
            role: 'about'
          },
          {type: 'separator'},
          {
            label: '服务',
            role: 'services'
          },
          {type: 'separator'},
          {
            label: '隐藏',
            accelerator: 'CommandOrControl+H',
            role: 'hide'
          },
          {
            label: '显示',
            accelerator: 'CommandOrControl+Shift+H',
            click: function(){
              mainWindow.show()
            }
          },
          {
            label: '退出应用',
            accelerator: 'CommandOrControl+Q',
            click: function(){
              app.quit()
            }
          }
        ]
      },
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
              mainWindow.webContents.send('menuEvent','blod')
            }
          },
          {
            label: '下划线',
            accelerator: 'CommandOrControl+Alt+U',
            click: function(){
              mainWindow.webContents.send('menuEvent','underline')
            }
          },
          {
            label: '删除线',
            accelerator: 'CommandOrControl+-',
            click: function(){
              mainWindow.webContents.send('menuEvent','deleteline')
            }
          },
          {type: 'separator'},
          {
            label: '转为',
            submenu: [
              {
                label: 'H1',
                accelerator: 'CommandOrControl+Alt+1',
                click: function(){
                  mainWindow.webContents.send('menuEvent','h1')
                }
              },
              {
                label: 'H2',
                accelerator: 'CommandOrControl+Alt+2',
                click: function(){
                  mainWindow.webContents.send('menuEvent','h2')
                }
              },
              {
                label: 'H3',
                accelerator: 'CommandOrControl+Alt+3',
                click: function(){
                  mainWindow.webContents.send('menuEvent','h3')
                }
              },
              {
                label: 'H4',
                accelerator: 'CommandOrControl+Alt+4',
                click: function(){
                  mainWindow.webContents.send('menuEvent','h4')
                }
              },
              {
                label: 'H5',
                accelerator: 'CommandOrControl+Alt+5',
                click: function(){
                  mainWindow.webContents.send('menuEvent','h5')
                }
              },
              {
                label: 'H6',
                accelerator: 'CommandOrControl+Alt+6',
                click: function(){
                  mainWindow.webContents.send('menuEvent','h6')
                }
              }
            ]
          },
          {type: 'separator'},
          {
            label: '注释',
            accelerator: 'CommandOrControl+/',
            click: function(){
              mainWindow.webContents.send('menuEvent','comment')
            }
          },
          {
            label: '行内代码',
            accelerator: 'CommandOrControl+K',
            click: function(){
              mainWindow.webContents.send('menuEvent','inlineCode')
            }
          },
          {
            label: '代码块',
            accelerator: 'CommandOrControl+Shift+K',
            click: function(){
              mainWindow.webContents.send('menuEvent','blockCode')
            }
          },
          {type: 'separator'},
          {
            label: '无序列表',
            accelerator: 'CommandOrControl+U',
            click: function(){
              mainWindow.webContents.send('menuEvent','ul')
            }
          },
          {
            label: '有序列表',
            accelerator: 'CommandOrControl+O',
            click: function(){
              mainWindow.webContents.send('menuEvent','ol')
            }
          },
          {
            label: '引用',
            accelerator: 'CommandOrControl+Shift+B',
            click: function(){
              mainWindow.webContents.send('menuEvent','quote')
            }
          },
          {
            label: '链接',
            accelerator: 'CommandOrControl+L',
            click: function(){
              mainWindow.webContents.send('menuEvent','link')
            }
          },
          {
            label: '图片',
            accelerator: 'CommandOrControl+I',
            click: function(){
              mainWindow.webContents.send('menuEvent','image')
            }
          },{
            label: '表格',
            accelerator: 'CommandOrControl+T',
            click: function(){
              mainWindow.webContents.send('menuEvent','table')
            }
          }
        ]
      },{
        label: '视图',
        submenu: [
          {
            label: '预览/取消预览',
            accelerator: 'CommandOrControl+P',
            click: function(){
              mainWindow.webContents.send('menuEvent','preview')
            }
          },
          {type: 'separator'},
          {
            label: '仅显示编辑器',
            accelerator: 'CommandOrControl+1',
            click: function(){
              mainWindow.webContents.send('menuEvent','editorMode')
            }
          },
          {
            label: '双栏视图模式',
            accelerator: 'CommandOrControl+2',
            click: function(){
              mainWindow.webContents.send('menuEvent','listMode')
            }
          },
          {
            label: '三栏视图模式',
            accelerator: 'CommandOrControl+3',
            click: function(){
              mainWindow.webContents.send('menuEvent','normalMode')
            }
          },
          {
            label: '切换实时预览',
            accelerator: 'CommandOrControl+W',
            click: function(){
              mainWindow.webContents.send('menuEvent','previewMode')
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
            label: '切换开发者工具',
            accelerator: 'CommandOrControl+Option+I',
            role: 'toggledevtools'
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
              shell.openExternal('https://github.com/isNeilLin/M-note/issues/new')
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


import { autoUpdater } from 'electron-updater'

autoUpdater.on('update-downloaded', () => {
  autoUpdater.quitAndInstall()
})

app.on('ready', () => {
  if (process.env.NODE_ENV === 'production') autoUpdater.checkForUpdates()
})
