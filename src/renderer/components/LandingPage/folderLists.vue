<template>
    <div class="folder-wrapper">
        <ul v-if="data.length">
            <li class="folder-item all-documents" 
                :class="allDocuments.selected ? 'folder-item-active' : ''" 
                @click="selectItem(data[0],$event)" 
                >
                <i class="icon"></i>
                <span>{{data[0].title}}</span>
            </li>
            <li class="folder-item recently" 
                :class="recently.selected ? 'folder-item-active' : ''" 
                @click="selectItem(data[1],$event)" 
                >
                <i class="icon"></i>
                <span>{{data[1].title}}</span>
            </li>
            <li class="folder-item wastebasket" 
                :class="wastebasket.selected ? 'folder-item-active' : ''" 
                @click="selectItem(data[2],$event)"
                >
                <i class="icon"></i>
                <span>{{data[2].title}}</span>
            </li>
            <li v-for="item in data.slice(3)" 
                class="folder-item editable" 
                :class="item.selected&&folderActive  ? 'folder-item-active' : ''" 
                @contextmenu="mouseDown"
                @click="selectItem(item,$event)"
                :key="item.title">
                <i class="icon"></i>
                <span>{{item.title}}</span>
            </li>
        </ul>
        <div class="edit" v-if="input.show">
            <input type="text" :value="input.value" ref="input" autofocus="autofocus"/>
            <button class="confirm" @click="confirm">确认</button>
            <button class="cancel" @click="cancel">取消</button>
        </div>
    </div>
</template>
<script>
    import electron from 'electron'
    const { remote } = electron;
    const { Menu, MenuItem, dialog, app } = remote;
    const fs = require('fs');
    const path = require('path');
    export default {
        data: ()=>{
            return {
                folderActive: true,
                folderMenu: null,
                menuTarget: null,
                input: {
                    show: false,
                    value: '',
                    type: ''
                },
                allDocuments: {
                    title: '所有文档',
                    selected: false
                },
                recently: {
                    title: '最近使用',
                    selected: false
                },
                wastebasket: {
                    title: '废纸篓',
                    selected: false
                }
            }
        },
        mounted(){
            console.log(this.data);
        },
        props: ['data'],
        methods: {
            selectItem(e){
                let folder = arguments[0];
                this.changeAcitve(folder);
            },
            changeAcitve(folder){
                this.folderActive = false;
                this.allDocuments.selected = false;
                this.recently.selected = false;
                this.wastebasket.selected = false;
                if(typeof folder==='string'){
                    let name = folder;
                    this[name].selected = true;
                    this.$emit('checkoutFolder',folder)
                }else{
                    this.folderActive = true;
                    this.$emit('checkoutFolder',folder)
                }
            },
            mouseDown(e){
                let _this = this;
                if(this.input.show){
                    this.cancel();
                }
                let menuData = [
                    {
                        label: '编辑',
                        click: _this.changeName
                    },{
                        type: 'separator'
                    },{
                        label: '新增分类',
                        click: _this.addFoler
                    },{
                        label: '新建文档',
                        click: _this.addFile
                    },{
                        label: '导入文档',
                        click: _this.importFile
                    },{
                        type: 'separator'
                    },{
                        label: '删除',
                        click: _this.deleteFoler
                    }
                ]
                if(e.target.localName=='i'||e.target.localName=='span'){
                    this.menuTarget = e.target.parentNode;
                }else{
                    this.menuTarget = e.target;
                }
                this.createMenu(menuData)
            },
            createMenu(data){
                this.folderMenu = new Menu();
                for(let item of data){
                    let mentItem = new MenuItem({
                        click: item.click || '',
                        label: item.label || '',
                        type: item.type || 'normal',
                        enabled: item.enabled || true,
                        visible: item.visible || true
                    })
                    this.folderMenu.append(mentItem);
                }
                this.folderMenu.popup();
            },
            confirm(){
                let name = this.$refs.input.value;
                if(this.input.type==='edit'){
                    let old = this.input.value;
                    this.$emit('changeTitle',{
                        new: name,
                        old: old
                    })
                }else if(this.input.type==='add'){
                    this.$emit('addTitle',{
                        title: name,
                        selected: false,
                        files: []
                    })
                }
                this.cancel();
            },
            cancel(){
                this.input = {
                    show: false,
                    value: '',
                    type: ''
                }
            },
            changeName(){
                let name = this.menuTarget.innerText.trim();
                this.input = {
                    show: true,
                    value: name,
                    type: 'edit'
                }
            },
            addFoler(){
                this.input = {
                    show: true,
                    value: '',
                    type: 'add'
                }
            },
            addFile(){
                let folder = this.menuTarget.innerText.trim();
                this.$emit('addFile',{
                    folder
                })
            },
            importFile(){
                dialog.showOpenDialog({
                    title: '选择Markdown文件',
                    defaultPath: app.getPath('documents'),
                    filters: [{
                        name: 'Markdown',
                        extensions: ['md']
                    }],
                    properties: ['openFile']
                },(Paths)=>{
                    let title = path.parse(Paths[0]).name;
                    let belongTo = this.menuTarget.innerText.trim();
                    fs.readFile(Paths[0],'utf8',(err,data)=>{
                        if(err){
                            this.alert('导入失败')
                        }else{
                            let create = this.timeFormat(Date.now());
                            this.$emit('addFile',{
                                title: title,
                                belongTo: belongTo,
                                content: data,
                                create: create,
                                update: create
                            })
                            this.alert('导入完成')
                        }
                    })
                })
            },
            deleteFoler(){
                let _this = this;
                let name = this.menuTarget.innerText.trim();
                dialog.showMessageBox({
                    type: 'warning',
                    buttons: ['取消','删除'],
                    defaultId: 0,
                    message: `确认删除分类"${name}"吗`,
                    detail: '删除分类后将不能恢复！'
                },function(index){
                    if(index){
                        _this.$emit('deleteFolder',name)
                    }
                })
            },
            timeFormat(time){
                let format = num => num.toString().length > 1 ? num : `0${num}`
                let date = new Date(time);
                let Y, M, D, h, m, s;
                Y = date.getFullYear()
                M = format(date.getMonth() + 1)
                D = format(date.getDate())
                h = format(date.getHours())
                m = format(date.getMinutes())
                s = format(date.getSeconds())
                return `${Y}-${M}-${D} ${h}:${m}:${s}`
            },
            alert(message,detail){
                dialog.showMessageBox({
                    message: message,
                    detail: detail || ''
                })
            }
        }
    }
</script>
<style>
    .folder-wrapper {
        height: 100%;
        display: flex;
        flex-direction: column;
        background: rgba(250,235,215,.1);
        padding:8px 0px 0px 0px;
        border-right: 1px solid rgb(230,230,230);
    }
    ul {
        overflow-y: auto;
        overflow-x: hidden;
        flex-grow: 1;
        text-align: left;
    }
    .edit {
        height: 96px;
        text-align: center;
        background: rgba(250,235,215,.5);
        padding-top: 16px;
    }
    .folder-item {
        height: 36px;
        line-height: 36px;
        padding: 0 16px;
        font-size: 14px;
        padding-left: 16px;
        cursor: pointer;
    }
    .folder-item:hover{
        background-color: rgba(213,232,252,.6);
    }
    .wastebasket {
        border-bottom: 1px solid rgba(230,230,230,.6);
    }
    .folder-item-active span {
        color: #1976d2;
    }
    .folder-item i {
        display: inline-block;
        margin-right: 4px;
        width: 16px;
        height: 16px;
        background-image: url('../../assets/folder.png');
        background-size: contain;
        margin-bottom: -2px;
    }
    .all-documents i {
        background-image: url('../../assets/documents.png');
    }
    .recently i {
        background-image: url('../../assets/time.png');
    }
    .wastebasket i {
        background-image: url('../../assets/wastebasket.png');
        width: 18px;
        height: 18px;
        margin-right: 1px;
    }
    .edit input {
        width: 100%;
        height: 36px;
        border: none;
        border-bottom: 1px solid rgb(217,217,217);
        border-radius: 5px;
        padding: 0 16px;
        font-size: 13px;
        outline: none;
    }
    .edit button {
        width: 66px;
        height: 24px;
        margin: 10px 4px 0 4px;
        border-radius: 15px;
        border: 1px solid rgb(74,144, 226);
        box-shadow: 0 1px 1px 0 rgba(0,0,0,0.1);
        background: rgb(74,144, 226);
        color: #fff;
        outline: none;
    }
    .edit button:hover{
        box-shadow: 0 1px 2px 0 rgba(0,0,0,.2);
    }
    .edit .cancel {
        border: 1px solid rgb(160,111,204);
        background: rgb(160,111,204);
        color: #fff;
    }
</style>
