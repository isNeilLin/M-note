export default {
  setAllDocs: function(state, allDocs){
    state.allDocs = allDocs;
  },
  setRecentDocs: function(state, recentDocs){
    state.recentDocs = recentDocs;
  },
  setWastebasket: function(state,wastebasket){
    state.wastebasket = wastebasket;
  },
  setFolders: function(state, folders){
    state.folders = folders;
  },
  setCurrentFolder: function(state, folder){
    state.curFolder = folder;
    if(folder.title=='所有文档'){
      state.curList = state.allDocs;
    }else if(folder.title=='最近使用'){
      state.curList = state.recentDocs;
    }else if(folder.title=='废纸篓'){
      state.curList = state.wastebasket;
    }else{
      state.curList = folder.files;
    }
    let selected = state.curList.filter(file=>file.selected)[0];
    if(selected){
      state.curFile = selected;
      state.content = state.curFile.content;
    }else if(state.curList.length){
      state.curFile = state.curList[0];
      state.content = state.curFile.content;
    }else{
      state.curFile = null;
    }
  },
  setCurrentFile: function(state, file){
    state.curFile = file;
    state.content = state.curFile.content;
  },
  updateFolder: function(state, folder){
    state.folders = state.folders.map(f=>{
      if(f._id==folder._id){
        folder.selected = true;
        return folder;
      }else{
        f.selected = false;
      }
      return f;
    })
    state.folders = [...state.folders];
    let files = state.folders.reduce((prev,next)=>{
      return prev.concat(next.files)
    },[]);
    let all = files.filter(file=>!file.deleted);
    let deleted = files.filter(file=>file.deleted);
    let recents = all.sort(function(a, b){
      return b.update- a.update;
    })
    this.commit('setAllDocs',all);
    this.commit('setRecentDocs',recents);
    this.commit('setWastebasket',deleted);
    this.commit('setCurrentFolder',folder);
  },
  addFolder: function(state, folder){
    state.folders.push(folder);
    state.folders = state.folders.map(f=>{
      if(f._id==folder._id){
        f.selected = true;
      }else{
        f.selected = false;
      }
      return f;
    })
    state.folders = [...state.folders];
    state.curList = folder.files;
    state.curFolder = folder;
    state.curFile = null;
  },
  removeFolder: function(state, folder){
    state.folders = state.folders.filter(f=>f._id!==folder._id);
    if(folder.selected){
      if(state.folders.length){
        this.commit('setCurrentFolder',state.folders[0])
      }else{
        state.curFolder = null;
        state.curFile = null;
        state.curList = [];
      }
    }
  },
  addFile: function(state, {file, folder}){
    state.allDocs.push(file);
    state.recentDocs.unshift(file);
    state.curFile = file;
    state.content = state.curFile.content;
    state.curFolder = folder;
  },
  removeFile: function(state, file){
    state.allDocs = state.allDocs.filter(doc=>doc._id == file._id);
    state.recentDocs = state.recentDocs.filter(doc=>doc._id == file._id);
    state.wastebasket.unshift(file);
    if(state.curFile._id == file._id){
      if(state.curList.length){
        state.curFile = state.curList[0];
        state.content = state.curFile.content;
      }else{
        state.curFile = null;
      }
    }
  },
  changeFile: function(state, file){
    state.curFile = file;
    state.content = state.curFile.content;
  },
  setCurList: function(state, list){
    state.curList = list;
    let selected = list.filter(f=>f.selected)[0];
    state.curFile = selected || null;
    if(state.curFile){
      state.content = state.curFile.content;
    }
  }
}