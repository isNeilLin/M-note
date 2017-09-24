<template>
    <div class="fileLists">
        <ul>
            <li v-for="item in data"
                v-if="!item.deleted"
                :class="item.selected  ? 'active' : ''" 
                @click="selectFile(item,$event)"
                @contextmenu="menuEvent(item,$event)">
                <p class="fileTitle">{{item.title}}</p>
                <div class="fileDesc">
                    最近更新: <span>{{timeFormat(item.update)}}</span>
                </div>
            </li>
        </ul>
    </div>
</template>
<script>
    import electron from 'electron'
    const { remote } = electron;
    const { Menu, MenuItem, dialog } = remote;
    export default {
        mounted(){
            this.$file.find({
                selected: true
            },(err,doc)=>{
                if(!err&&doc.length){
                    this.active = doc[0];
                }
            })
        },
        data(){
            return {
                active: null,
                menuTarget: null,
                fileMenu: null
            }
        },
        props: ['data'],
        methods: {
            selectFile(){
               this.active = arguments[0];
               this.$emit('checkoutFile',this.active)
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
            menuEvent(){
                this.menuTarget = arguments[0];
                let _this = this;
                let menuData;
                if(this.menuTarget.wastebasket){
                    menuData = [
                        {
                            label: '还原',
                            click: _this.reback
                        },{
                            label: '删除',
                            click: _this.clearFile
                        },{
                            label: '清倒废纸篓',
                            click: _this.clearAll
                        },
                    ]
                }else{
                    menuData = [
                        {
                            label: '新建文档',
                            click: _this.addFile
                        },{
                            type: 'separator'
                        },{
                            label: '导出为HTML',
                            click: _this.exportHTML
                        },{
                            label: '导出为PDF',
                            click: _this.exportPDF
                        },{
                            label: '导出为Markdown',
                            click: _this.exportMarkdown
                        },{
                            type: 'separator'
                        },{
                            label: '移到废纸篓',
                            click: _this.deleteFile
                        }
                    ]
                }
                this.createMenu(menuData);
            },
            createMenu(data){
                this.fileMenu = new Menu();
                for(let item of data){
                    let mentItem = new MenuItem({
                        click: item.click || '',
                        label: item.label || '',
                        type: item.type || 'normal',
                        enabled: item.enabled || true,
                        visible: item.visible || true
                    })
                    this.fileMenu.append(mentItem);
                }
                this.fileMenu.popup();
            },
            addFile(){
                let belongTo = this.menuTarget.belongTo;
                this.$emit('addFile',{
                    title: '',
                    belongTo: belongTo
                })
            },
            exportHTML(){
                this.$emit('exportHTML')
            },
            exportPDF(){
                this.$emit('exportPDF')
            },
            exportMarkdown(){
                this.$emit('exportMarkdown')
            },
            deleteFile(){
                this.$file.update({
                    _id: this.menuTarget._id
                },{
                    $set: {
                        deleted: true
                    }
                },(err)=>{
                    if(!err){
                        this.$emit('updateList')
                    }
                })
            },
            reback(){
                this.$file.update({
                    _id: this.menuTarget._id
                },{
                    $set: {
                        deleted: false
                    }
                },(err)=>{
                    if(!err){
                        this.$emit('checkoutFolder','wastebasket')
                    }
                })
            },
            clearFile(){
                this.$file.remove({
                    _id: this.menuTarget._id
                },(err)=>{
                    if(!err){
                        this.$emit('checkoutFolder','wastebasket')
                    }
                })
            },
            clearAll(){
                this.$file.remove({
                    deleted: true
                },{
                    multi: true
                },(err)=>{
                    if(!err){
                        this.$emit('checkoutFolder','wastebasket')
                    }
                })
            }
        }
    }
</script>
<style>
    .fileLists {
        background: rgba(250,235,215,.4);
        height: 100%;
        padding:8px 0px 0px 0px;
    }
    .fileLists li {
        background: floralwhite;
        margin: 8px 0px;
        padding: 6px;
    }
    p.fileTitle {
        color: rgb(51,51,51);
        height: 24px;
        line-height: 24px;
    }
    .fileDesc {
        font-size: 10px;
    }
    .fileDesc span {
        color: #3174ec;
    }
    .fileLists li.active {
        background: antiquewhite;
    }
    .active .fileTitle {
        color: #1976d2;
    }
</style>