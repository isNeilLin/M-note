<template>
  <div id="wrapper">
    <div class="layout-content">
        <div class="col-4" v-show="folderFocus">
            <folder-lists
              :data="folders"
              v-on:changeTitle="changeTitle"
              v-on:addTitle="addTitle"
              v-on:deleteFolder="deleteFolder"
              v-on:addFile="addFileEvent"
              v-on:checkoutFolder="checkoutFolder"
            ></folder-lists>
        </div>
        <div class="col-4" v-show="fileFocus">
            <file-lists
              ref="file"
              :showDeleted="showDeleted"
              v-on:exportHTML="exportHTML"
              v-on:exportPDF="exportPDF"
              v-on:exportMarkdown="exportMarkdown"
              v-on:checkoutFolder="checkoutFolder"
              v-on:deleteFile="deleteFile"
              v-on:checkoutFile="checkoutFile"
              v-on:addFile="addFileEvent"
              :data="curList"
            ></file-lists>
        </div>
        <div class="col-16">
            <markdown-content
              ref="editor"
              v-on:changeFileTitle="changeFileTitle"
              v-on:saveContent="saveContent"
              :data="content"
              :curFile="curFile"
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
  import { mapState, mapMutations, mapGetters } from 'vuex';
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
    },
    mounted(){
      this.init();
    },
    data(){
      return {
          folderFocus: true,
          fileFocus: true,
          isPreview: false,
          showDeleted: false,
      }
    },
    components: { folderLists, fileLists, markdownContent },
    computed: {
      ...mapState([
        'allDocs',
        'recentDocs',
        'wastebasket',
        'folders',
        'curList',
        'curFolder',
        'curFile',]),
      ...mapGetters(['content'])
    },
    methods: {
        ...mapMutations(['setAllDocs',
          'setRecentDocs',
          'setWastebasket',
          'setFolders',
          'setCurList',
          'setCurrentFolder',
          'setCurrentFile',
          'addFolder',
          'addFile',
          'removeFolder',
          'removeFile',
          'updateFolder']),
        init(){
          // this.$db.remove({},{multi: true})
          this.$db.find({},(err, doc)=>{
            if(!err&&doc.length){
              let currentFolder = doc.filter(d=>d.selected)[0] || null;
              let files = doc.reduce(function(prev,next){
                prev.concat(next.files);
              },[])
              this.setFolders(doc);
              this.setCurrentFolder(currentFolder);
              if(files&&files.length){
                let all = files.filter(file=>!file.deleted);
                let deleted = files.filter(file=>file.deleted);
                let recents = all.sort(function(a, b){
                  return b.update - a.update;
                })
                this.setAllDocs(all);
                this.setRecentDocs(recents);
                this.setWastebasket(deleted);
              }
            }else{
              let defaults = [
                {
                  title: '所有文档',
                  selected: false,
                  files: []
                },
                {
                  title: '最近使用',
                  selected: false,
                  files: []
                },
                {
                  title: '废纸篓',
                  selected: false,
                  files: []
                },
                {
                  title: '未分类文档',
                  selected: true,
                  files: []
                }
              ]
              this.$db.insert(defaults,(err,newdoc)=>{
                this.setFolders(newdoc);
                this.setCurrentFolder(newdoc[3]);
              })
            }
          })
        },
        changeTitle(data){
          let folder;
          this.$db.find({
            title: data.old
          },(err, doc)=>{
            if(err) return
            folder = doc[0];
            this.$db.update({
              title: data.old
            },{
              $set: {
                title: data.new
              }
            },()=>{
              folder.title = data.new;
              this.updateFolder(folder);
            })
          })
        },
        checkoutFolder(folder){
          let c = this.$refs.editor.editor.getMarkdown();
          this.saveContent(c);
          this.showDeleted = false;
          this.setCurrentFolder(folder);
        },
        checkoutFile(file){
          let c = this.$refs.editor.editor.getMarkdown();
          this.saveContent(c);
          if(this.curFolder){
            this.curFolder.files = this.curFolder.files.map(f=>{
              if(f._id==file._id){
                f.selected = true;
              }else{
                f.selected = false;
              }
              return f;
            })
            this.$db.update({
              _id: this.curFolder._id
            },{
              files: this.curFolder.files
            },()=>{
              this.updateFolder(this.curFolder);
              this.$refs.editor.editor.setValue(file.content);
              this.$refs.editor.editor.focus();
            })
          }else{
            let curList = this.curList.map(f=>{
              if(f._id==file._id){
                f.selected = true;
              }else{
                f.selected = false;
              }
              return f;
            })
            this.setCurList(curList);
            this.$refs.editor.showContent();
          }
        },
        deleteFile(file){
          this.curFolder.files = this.curFolder.files.map(f=>{
            if(f._id==file._id){
              f.deleted = true;
            }
            return f;
          });
          this.$db.update({
            _id: file._id
          },{
            $set: {
              files: this.curFolder.files
            }
          },()=>{
            this.updateFolder(this.curFolder);
          })
        },
        addTitle(data){
          this.$db.insert(data,(err,newdoc)=>{
            this.addFolder(newdoc);
          })
        },
        addFileEvent(data){
          let c = this.$refs.editor.editor.getMarkdown();
          this.saveContent(c);
          let create = Date.now();
          let update = create;
          let content = '';
          let folder = this.folders.filter(folder=>folder.title==data.folder)[0];
          folder.files = folder.files.map(file=>{
            file.selected=false;
            return file;
          });
          let newFile = {
            _id: create.toString(),
            title: data.title || '未命名',
            create: data.create || create,
            update: data.update || update,
            content: data.content || content,
            selected: data.selected || true,
            deleted: false
          }
          folder.files.push(newFile);
          this.$db.update({
            _id: folder._id
          },{
            $set: {
              files: folder.files
            }
          },(err)=>{
            if(err) return this.alert(JSON.stringify(err));
            this.updateFolder(folder);
          })
        },
        deleteFolder(name){
          this.$db.find({
            title: name
          },(err, doc)=>{
            this.$db.remove({title: name});
            this.removeFolder(doc[0]);
          });
        },
        saveContent(content){
          let now = Date.now();
          this.curFolder.files = this.curFolder.files.map(f=>{
            if(f._id==this.curFile._id){
              f.content = content;
            }
            return f;
          })
          this.$db.update({
            _id: this.curFolder._id
          },{
            $set: {
              files: this.curFolder.files,
              update: now
            }
          },(err)=>{
            if(!err){
              this.updateFolder(this.curFolder);
            }
          })
        },
        changeFileTitle(name){
          this.curFolder.files = this.curFolder.files.map(f=>{
            if(f._id==this.curFile._id){
              f.title = name;
            }
            return f;
          })
          this.$db.update({
            _id: this.curFolder._id,
          },{
            $set: {
              files: this.curFolder.files
            }
          },(err)=>{
            this.updateFolder(this.curFolder);
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
    },
    watch: {
      curFile: function(data){
        if(data){
          this.$refs.editor.showContent(data.content);
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
