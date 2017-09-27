<template>
  <div id="wrapper">
    <div class="layout-content">
        <div class="col-4" v-show="folderFocus">
            <folder-lists
              :data="folders"
              v-on:changeTitle="changeTitle"
              v-on:addTitle="addTitle"
              v-on:deleteFolder="deleteFolder"
              v-on:addFile="addFile"
              v-on:checkoutFolder="checkoutFolder"
              v-on:updateList="updateData"
            ></folder-lists>
        </div>
        <div class="col-4" v-show="fileFocus">
            <file-lists
              ref="file"
              v-on:exportHTML="exportHTML"
              v-on:exportPDF="exportPDF"
              v-on:exportMarkdown="exportMarkdown"
              v-on:checkoutFolder="checkoutFolder"
              v-on:updateList="updateData"
              v-on:checkoutFile="checkoutFile"
              v-on:addFile="addFile"
              :data="files"
            ></file-lists>
        </div>
        <div class="col-16">
            <markdown-content
              ref="editor"
              v-on:changeFileTitle="changeFileTitle"
              v-on:saveContent="saveContent"
              :data="content"
            ></markdown-content>
        </div>
    </div>
  </div>
</template>

<script>
  import folderLists from './LandingPage/folderLists'
  import fileLists from './LandingPage/fileLists'
  import markdownContent from './LandingPage/main'
  import toHtml from './htmlGenerator.js'
  import pdf from 'html-pdf'
  import electron from 'electron'
  const fs = require('fs');
  const path = require('path');
  const { remote, ipcRenderer } = electron;
  const { dialog, app } = remote;
  export default {
    name: 'landing-page',
    created(){
        ipcRenderer.on('menuEvent',(event,data)=>{
          this[data]();
        })
        this.$folder.find({},(err,doc)=>{
            if(doc&&doc.length){
              this.folders = doc
            }else if(doc){
              let defaultDoc = {
                title: '未分类文档',
                selected: false
              }
              this.$folder.insert(defaultDoc,(err,newdoc)=>{
                this.folders = newdoc;
              })
            }
        })
    },
    mounted(){
      this.$folder.find({
        selected: true
      },(err,doc)=>{
        if(!err&&doc.length){
          this.currentFolder = doc[0];
          this.$file.find({
            belongTo: this.currentFolder.title,
            selected: true
          },(err,doc)=>{
            if(!err&&doc.length){
              this.currentFile= doc[0];
              this.content = this.currentFile.content;
              this.$refs.editor.showContent(this.content);
              this.updateData();
            }
          })
        }
      })
    },
    data(){
      return {
          folders: null,
          currentFolder: '',
          currentFile: '',
          files: [],
          content: '',
          folderFocus: true,
          fileFocus: true,
          isPreview: false
      }
    },
    components: { folderLists, fileLists, markdownContent },
    methods: {
        changeTitle(data){
          this.$folder.update({
            title: data.old
          },{
            $set: {
              title: data.new
            }
          },(err,num)=>{
            if(!err){
              this.updateData();
            }
          })
        },
        checkoutFolder(folder){
          if(typeof folder==='string'){
            if(folder==='allDocuments'){
              this.$file.find({
                deleted: false
              },(err,docs)=>{
                if(!err){
                  for(let item of docs){
                    item.selected = false;
                  }
                  docs[0].selected = true;
                  this.files = docs;
                  this.checkFileListIsEmpty();
                }
              })
            }else if(folder==='recently'){
              this.$file.find({
                deleted: false
              }).sort({
                update: -1
              }).limit(7).exec((err,docs)=>{
                if(!err){
                  for(let item of docs){
                    item.selected = false;
                  }
                  docs[0].selected = true;
                  this.files = docs;
                  this.checkFileListIsEmpty();
                }
              })
            }else{
              this.$file.find({
                deleted: true
              },(err,docs)=>{
                for(let item of docs){
                  item.selected = false;
                }
                docs[0].selected = true;
                this.files = docs.map(item=>{
                   item.deleted = false;
                   item.wastebasket = true;
                   return item;
                })
                this.checkFileListIsEmpty()
              })
            }
          }else{
            this.currentFolder = folder;
            this.$folder.update({},{
              $set: {
                selected: false
              }
            },{
              multi: true
            },(err)=>{
              if(!err){
                this.$folder.update({
                  _id: folder._id
                },{
                  $set: {
                    selected: true
                  }
                },(err)=>{
                  !err && this.updateData();
                })
              }
            })
          }
        },
        checkoutFile(file){
          this.currentFile = file;
          this.$file.update({
            belongTo: file.belongTo
          },{
            $set: {
              selected: false
            }
          },{
            multi: true
          },(err,num)=>{
            if(!err){
              this.$file.update({
                _id: file._id
              },{
                $set: {
                  selected: true
                }
              },(err)=>{
                !err && this.updateData();
                this.content = file.content;
                this.$refs.editor.editor.setValue(file.content);
                this.$refs.editor.editor.focus();
              })
            }
          })
        },
        updateData(){
          this.$folder.find({}).sort({
            create: 1
          }).exec((err,doc)=>{
            if(!err){
              this.folders = doc;
            }
          })
          let currentFolder = this.currentFolder.title;
          this.$file.find({
            belongTo: currentFolder
          }).sort({
            create: 1
          }).exec((err,doc)=>{
            if(!err){
              this.files = doc;
              this.checkFileListIsEmpty();
            }
          })
        },
        addTitle(data){
          this.$folder.insert(data,(err,newdoc)=>{
            !err &&this.updateData();
          })
        },
        addFile(data){
          let create = Date.now();
          let update = create;
          let content = '';
          let newFile = {
            title: data.title,
            belongTo: data.belongTo,
            create: data.create || create,
            update: data.update || update,
            content: data.content || content,
            selected: data.selected || true,
            deleted: false
          }
          this.$file.update({
            belongTo: data.belongTo
          },{
            $set: {
              selected: false
            }
          },(err)=>{
            if(!err){
              this.$file.insert(newFile,(err,newdoc)=>{
                !err && this.updateData()
              })
            }
          })
        },
        deleteFolder(name){
          this.$folder.remove({
            title: name
          },{},(err,num)=>{
              !err && this.updateData()
          })
        },
        checkFileListIsEmpty(){
          if(!this.files.length){
            document.title = 'm-note';
            this.$refs.editor.disable = true;
          }else{
            for(let item of this.files){
              if(item.selected){
                this.currentFile = item;
              }
            }
            document.title = this.currentFile.title;
            this.$refs.editor.disable = false;
            this.$file.find({
              belongTo: this.currentFolder.title,
              selected: true
            },(err,docs)=>{
              this.currentFile = docs[0];
              this.$refs.editor.showContent(this.currentFile.content);
            })
          }
        },
        saveContent(content){
          let now = Date.now();
          now = this.$refs.file.timeFormat(now);
          this.$file.update({
            _id: this.currentFile._id
          },{
            $set: {
              content: content,
              update: now
            }
          },(err)=>{
            if(!err){
              console.log(content);
            }
          })
        },
        changeFileTitle(name){
          if(this.currentFile.title){
            return
          }
          this.$file.update({
            _id: this.currentFile._id
          },{
            $set: {
              title: name
            }
          },(err)=>{
            if(!err){
              this.updateData();
            }
          })
        },
        exportHTML(){
          this.openDialog().then(Paths=>{
            let content = this.$refs.editor.editor.preview[0].innerHTML;
            let html = toHtml(content);
            let exportPath = path.join(Paths[0],this.currentFile.title+'.html');
            fs.writeFile(exportPath,html,(err)=>{
              if(err){
                this.alert('导出失败',err.message)
              }else{
                this.alert('导出完成')
              }
            })
          })
        },
        exportPDF(){
          this.openDialog().then(Paths=>{
            let content = this.$refs.editor.editor.preview[0].innerHTML;
            let html = toHtml(content);
            let name = this.currentFile.title+'.pdf';
            let exportPath = path.join(Paths[0],name);
            pdf.create(html,{
              format: 'Letter'
            }).toFile(exportPath,(err,res)=>{
              if(err){
                console.log(err)
                this.alert('导出失败')
              }else{
                this.alert('导出完成')
              }
            })
          })
        },
        exportMarkdown(){
          this.openDialog().then(Paths=>{
            let content = this.$refs.editor.editor.getMarkdown();
            let name = this.currentFile.title+'.md';
            let exportPath = path.join(Paths[0],name);
            fs.writeFile(exportPath,content,'utf8',(err)=>{
              if(err){
                this.alert('导出失败')
              }else{
                this.alert('导出完成')
              }
            })
          })
        },
        openDialog(){
          return new Promise((resolve,reject)=>{
            dialog.showOpenDialog({
              title: '选择导出路径',
              defaultPath: app.getPath('documents'),
              properties: ['openDirectory']
            },(savepath)=>{
              resolve(savepath)
            })
          })
        },
        alert(message,detail){
          dialog.showMessageBox({
            message: message,
            detail: detail || ''
          })
        },
        blod(){
          var cm        = this.$refs.editor.editor.cm;
          var cursor    = cm.getCursor();
          var selection = cm.getSelection();
          cm.replaceSelection("**" + selection + "**");
          if(selection === "") {
              cm.setCursor(cursor.line, cursor.ch + 2);
          }
        },
        underline(){
          var cm        = this.$refs.editor.editor.cm;
          var cursor    = cm.getCursor();
          var selection = cm.getSelection();

          cm.replaceSelection("_" + selection + "_");

          if(selection === "") {
              cm.setCursor(cursor.line, cursor.ch + 1);
          }
        },
        deleteline(){
          var cm        = this.$refs.editor.editor.cm;
          var cursor    = cm.getCursor();
          var selection = cm.getSelection();

          cm.replaceSelection("~~" + selection + "~~");

          if(selection === "") {
              cm.setCursor(cursor.line, cursor.ch + 2);
          }
        },
        h1(){
          var cm        = this.$refs.editor.editor.cm;
          var cursor    = cm.getCursor();
          var selection = cm.getSelection();
          if (cursor.ch !== 0)
          {
              cm.setCursor(cursor.line, 0);
              cm.replaceSelection("# " + selection);
              cm.setCursor(cursor.line, cursor.ch + 2);
          }
          else
          {
              cm.replaceSelection("# " + selection);
          }
        },
        h2(){
          var cm        = this.$refs.editor.editor.cm;
          var cursor    = cm.getCursor();
          var selection = cm.getSelection();
          if (cursor.ch !== 0)
          {
              cm.setCursor(cursor.line, 0);
              cm.replaceSelection("## " + selection);
              cm.setCursor(cursor.line, cursor.ch + 3);
          }
          else
          {
              cm.replaceSelection("## " + selection);
          }
        },
        h3(){
          var cm        = this.$refs.editor.editor.cm;
          var cursor    = cm.getCursor();
          var selection = cm.getSelection();
          if (cursor.ch !== 0)
          {
              cm.setCursor(cursor.line, 0);
              cm.replaceSelection("### " + selection);
              cm.setCursor(cursor.line, cursor.ch + 4);
          }
          else
          {
              cm.replaceSelection("### " + selection);
          }
        },
        h4(){
          var cm        = this.$refs.editor.editor.cm;
          var cursor    = cm.getCursor();
          var selection = cm.getSelection();

          if (cursor.ch !== 0)
          {
              cm.setCursor(cursor.line, 0);
              cm.replaceSelection("#### " + selection);
              cm.setCursor(cursor.line, cursor.ch + 5);
          }
          else
          {
              cm.replaceSelection("#### " + selection);
          }
        },
        h5(){
          var cm        = this.$refs.editor.editor.cm;
          var cursor    = cm.getCursor();
          var selection = cm.getSelection();
          if (cursor.ch !== 0)
          {
              cm.setCursor(cursor.line, 0);
              cm.replaceSelection("##### " + selection);
              cm.setCursor(cursor.line, cursor.ch + 6);
          }
          else
          {
              cm.replaceSelection("##### " + selection);
          }
        },
        h6(){
          var cm        = this.$refs.editor.editor.cm;
          var cursor    = cm.getCursor();
          var selection = cm.getSelection();
          if (cursor.ch !== 0)
          {
              cm.setCursor(cursor.line, 0);
              cm.replaceSelection("###### " + selection);
              cm.setCursor(cursor.line, cursor.ch + 7);
          }
          else
          {
              cm.replaceSelection("###### " + selection);
          }
        },
        comment(){
          var cm        = this.$refs.editor.editor.cm;
          var cursor    = cm.getCursor();
          var selection = cm.getSelection();

          cm.replaceSelection("<!--" + selection + "-->");

          if(selection === "") {
              cm.setCursor(cursor.line, cursor.ch + 4);
          }
        },
        inlineCode(){
          var cm        = this.$refs.editor.editor.cm;
          var cursor    = cm.getCursor();
          var selection = cm.getSelection();
          cm.replaceSelection("`" + selection + "`");
          if (selection === "") {
              cm.setCursor(cursor.line, cursor.ch + 1);
          }
        },
        blockCode(){
          this.$refs.editor.editor.executePlugin("codeBlockDialog", "code-block-dialog/code-block-dialog");
        },
        ul(){
          var cm        = this.$refs.editor.editor.cm;
          var cursor    = cm.getCursor();
          var selection = cm.getSelection();
          if (selection === "") 
          {
              cm.replaceSelection("- " + selection);
          } 
          else 
          {
              var selectionText = selection.split("\n");
              for (var i = 0, len = selectionText.length; i < len; i++) 
              {
                  selectionText[i] = (selectionText[i] === "") ? "" : "- " + selectionText[i];
              }
              cm.replaceSelection(selectionText.join("\n"));
          }
        },
        ol(){
          var cm        = this.$refs.editor.editor.cm;
          var cursor    = cm.getCursor();
          var selection = cm.getSelection();
          if(selection === "") 
          {
              cm.replaceSelection("1. " + selection);
          }
          else
          {
              var selectionText = selection.split("\n");
              for (var i = 0, len = selectionText.length; i < len; i++) 
              {
                  selectionText[i] = (selectionText[i] === "") ? "" : (i+1) + ". " + selectionText[i];
              }
              cm.replaceSelection(selectionText.join("\n"));
          }
        },
        quote(){
          var cm        = this.$refs.editor.editor.cm;
          var cursor    = cm.getCursor();
          var selection = cm.getSelection();

          if (cursor.ch !== 0)
          {
              cm.setCursor(cursor.line, 0);
              cm.replaceSelection("> " + selection);
              cm.setCursor(cursor.line, cursor.ch + 2);
          }
          else
          {
              cm.replaceSelection("> " + selection);
          }
        },
        link(){
          this.$refs.editor.editor.executePlugin("linkDialog", "link-dialog/link-dialog");
        },
        image(){
          this.$refs.editor.editor.executePlugin("imageDialog", "image-dialog/image-dialog");
        },
        table(){
          this.$refs.editor.editor.executePlugin("tableDialog", "table-dialog/table-dialog");
        },
        preview(){
          this.isPreview = !this.isPreview;
          let previewElm = this.$refs.editor.editor.preview[0];
          if(this.isPreview){
            previewElm.style.display = 'block'
          }else{
            previewElm.style.display = 'none'
          }
        },
        editorMode(){
          this.folderFocus = false;
          this.fileFocus = false;
        },
        listMode(){
          this.folderFocus = false;
          this.fileFocus = true;
        },
        normalMode(){
          this.folderFocus = true;
          this.fileFocus = true
        },
        previewMode(){
          let main = this.$refs.editor;
          main.watch = !main.watch;
          if(main.watch){
            this.$refs.editor.previewContent = this.$refs.editor.editor.preview[0].innerHTML
            this.$nextTick(function(){
              main.editor.bindPreviewScrollEvent(main.$refs.watch)
            })
          }
        }
    }
  }
</script>

<style>
  @import url('https://fonts.googleapis.com/css?family=Source+Sans+Pro');

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  html {
    margin: 0;
    padding: 0;
  }

  * { font-family: PingFangSC-Regular !important; }

  #wrapper {
    -webkit-user-select: none;
    background: #f8f8f9;;
    height: 100vh;
    width: 100vw;
  }
 .layout-content,.ivu-row{
   width: 100%;
   height: 100%;
   display: flex;
 }
 .col-4 {
   width: 185px;
   min-width: 185px;
 }
 .col-16 {
   flex-grow: 1;
   overflow: hidden;
 }
 .col-4 {
   height: 100%;
 }

</style>
